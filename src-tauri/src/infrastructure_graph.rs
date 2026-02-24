use crate::types::*;
use serde_json::json;
use std::collections::HashMap;
use tauri::State;

pub struct InfraGraphState;

impl Default for InfraGraphState {
    fn default() -> Self {
        InfraGraphState
    }
}

#[tauri::command]
pub async fn get_infrastructure_graph(state: State<'_, crate::commands::AppState>) -> Result<InfrastructureGraph, String> {
    let ssh_client = state.ssh_client.lock().await;
    let client = ssh_client.as_ref().ok_or("Not connected to server")?;

    let mut nodes = Vec::new();
    let mut edges = Vec::new();

    // ============== LAYER 1: INTERNET ==============
    nodes.push(InfraGraphNode {
        id: "internet".to_string(),
        label: "Internet".to_string(),
        node_type: InfraGraphNodeType::Internet,
        status: NodeStatus::Healthy,
        metadata: json!({
            "description": "External network"
        }),
    });

    // ============== LAYER 2: NGINX & HOST PORTS ==============
    // Get Nginx status
    let nginx_status_output = client
        .execute_command("systemctl is-active nginx 2>/dev/null || echo 'inactive'")
        .unwrap_or_else(|_| "inactive".to_string());
    
    let nginx_running = nginx_status_output.trim() == "active";
    let nginx_version = client
        .execute_command("nginx -v 2>&1 | cut -d'/' -f2")
        .unwrap_or_default();

    nodes.push(InfraGraphNode {
        id: "nginx".to_string(),
        label: format!("Nginx {}", nginx_version.trim()),
        node_type: InfraGraphNodeType::Nginx,
        status: if nginx_running { NodeStatus::Running } else { NodeStatus::Stopped },
        metadata: json!({
            "version": nginx_version.trim(),
            "running": nginx_running
        }),
    });

    // Edge: Internet -> Nginx
    edges.push(InfraGraphEdge {
        source: "internet".to_string(),
        target: "nginx".to_string(),
        edge_type: "routes_to".to_string(),
        label: Some("80/443".to_string()),
        metadata: None,
    });

    // Get host network interface
    let host_interface = client
        .execute_command("ip route | grep default | awk '{print $5}' | head -1")
        .unwrap_or_else(|_| "eth0".to_string())
        .trim()
        .to_string();

    nodes.push(InfraGraphNode {
        id: "host_network".to_string(),
        label: format!("Host ({})", host_interface),
        node_type: InfraGraphNodeType::HostNetwork,
        status: NodeStatus::Running,
        metadata: json!({
            "interface": host_interface,
            "type": "host"
        }),
    });

    // Edge: Host Network -> Internet (outbound NAT)
    edges.push(InfraGraphEdge {
        source: "host_network".to_string(),
        target: "internet".to_string(),
        edge_type: "outbound".to_string(),
        label: Some("NAT".to_string()),
        metadata: None,
    });

    // ============== LAYER 3: VHOSTS & DIRECT PORTS ==============
    let vhosts = get_vhosts_for_graph(client)?;
    let mut vhost_to_backend: HashMap<String, String> = HashMap::new();

    for vhost in &vhosts {
        let vhost_id = format!("vhost:{}", vhost.name);
        nodes.push(InfraGraphNode {
            id: vhost_id.clone(),
            label: vhost.server_name.clone(),
            node_type: InfraGraphNodeType::Vhost,
            status: if vhost.enabled { NodeStatus::Healthy } else { NodeStatus::Stopped },
            metadata: json!({
                "name": vhost.name,
                "server_name": vhost.server_name,
                "enabled": vhost.enabled,
                "ssl": vhost.ssl_enabled
            }),
        });

        // Edge: Nginx -> Vhost
        edges.push(InfraGraphEdge {
            source: "nginx".to_string(),
            target: vhost_id.clone(),
            edge_type: "serves".to_string(),
            label: Some(vhost.listen_port.clone()),
            metadata: None,
        });

        // Parse proxy_pass
        if let Ok(backend) = extract_proxy_target(client, &vhost.name).await {
            vhost_to_backend.insert(vhost_id.clone(), backend.clone());
        }
    }

    // ============== LAYER 4: DOCKER CONTAINERS ==============
    let containers = get_containers_for_graph(client)?;
    
    for container in &containers {
        let container_id = format!("container:{}", container.name);
        nodes.push(InfraGraphNode {
            id: container_id.clone(),
            label: container.name.clone(),
            node_type: InfraGraphNodeType::Container,
            status: if container.state == "running" { NodeStatus::Running } else { NodeStatus::Stopped },
            metadata: json!({
                "id": container.id,
                "image": container.image,
                "state": container.state
            }),
        });

        // Edge: Vhost -> Container (proxy_pass)
        for (vhost_id, backend) in &vhost_to_backend {
            if backend.contains(&container.name) || backend.contains(&container.id[..12.min(container.id.len())]) {
                edges.push(InfraGraphEdge {
                    source: vhost_id.clone(),
                    target: container_id.clone(),
                    edge_type: "proxies_to".to_string(),
                    label: Some(backend.clone()),
                    metadata: None,
                });
            }
        }
    }

    // ============== LAYER 5: DOCKER NETWORKS ==============
    let networks = get_docker_networks_for_graph(client)?;
    
    for network in &networks {
        let network_id = format!("network:{}", network.name);
        nodes.push(InfraGraphNode {
            id: network_id.clone(),
            label: format!("{} ({})", network.name, network.driver),
            node_type: InfraGraphNodeType::DockerNetwork,
            status: NodeStatus::Healthy,
            metadata: json!({
                "driver": network.driver,
                "scope": network.scope,
                "subnet": network.subnet,
                "containers": network.containers.len()
            }),
        });

        // Edge: Docker Network -> Host Network (NAT)
        edges.push(InfraGraphEdge {
            source: network_id.clone(),
            target: "host_network".to_string(),
            edge_type: "nat".to_string(),
            label: Some("masquerade".to_string()),
            metadata: None,
        });

        // Edge: Container -> Docker Network
        for container in &containers {
            let container_short_id = &container.id[..12.min(container.id.len())];
            if network.containers.contains(&container.name) || 
               network.containers.iter().any(|c| c.starts_with(container_short_id)) {
                edges.push(InfraGraphEdge {
                    source: format!("container:{}", container.name),
                    target: network_id.clone(),
                    edge_type: "connected_to".to_string(),
                    label: None,
                    metadata: None,
                });
            }
        }
    }

    // ============== DIRECT PORT MAPPINGS ==============
    for container in &containers {
        let ports = get_container_ports(client, &container.name).await;
        
        for port_mapping in ports {
            let host_port = &port_mapping.host_port;
            let container_port = &port_mapping.container_port;
            
            // Create HostPort node
            let host_port_id = format!("hostport:{}", host_port);
            nodes.push(InfraGraphNode {
                id: host_port_id.clone(),
                label: format!("Port :{}", host_port),
                node_type: InfraGraphNodeType::HostPort,
                status: NodeStatus::Running,
                metadata: json!({
                    "host_port": host_port,
                    "container_port": container_port,
                    "protocol": port_mapping.protocol
                }),
            });

            // Edge: Internet -> HostPort (direct access)
            edges.push(InfraGraphEdge {
                source: "internet".to_string(),
                target: host_port_id.clone(),
                edge_type: "direct_access".to_string(),
                label: Some(format!(":{}", host_port)),
                metadata: None,
            });

            // Edge: HostPort -> Container
            edges.push(InfraGraphEdge {
                source: host_port_id.clone(),
                target: format!("container:{}", container.name),
                edge_type: "port_mapping".to_string(),
                label: Some(format!("→ :{}", container_port)),
                metadata: None,
            });
        }
    }

    // Calculate summary
    let summary = InfraSummary {
        total_containers: containers.len(),
        running_containers: containers.iter().filter(|c| c.state == "running").count(),
        total_vhosts: vhosts.len(),
        enabled_vhosts: vhosts.iter().filter(|v| v.enabled).count(),
        nginx_status: if nginx_running { "running".to_string() } else { "stopped".to_string() },
        total_volumes: 0,
        total_networks: networks.len(),
    };

    Ok(InfrastructureGraph { nodes, edges, summary })
}

async fn get_container_ports(client: &std::sync::Arc<crate::ssh::SshClient>, container_name: &str) -> Vec<PortMapping> {
    let mut ports = Vec::new();
    
    let output = client
        .execute_command(&format!("docker port {}", container_name))
        .unwrap_or_default();
    
    for line in output.lines() {
        let parts: Vec<&str> = line.split("->").collect();
        if parts.len() == 2 {
            let container_port_full = parts[0].trim();
            let host_binding = parts[1].trim();
            
            // Parse container port (e.g., "80/tcp")
            let container_port = container_port_full.split('/').next().unwrap_or("").to_string();
            let protocol = container_port_full.split('/').nth(1).unwrap_or("tcp").to_string();
            
            // Parse host binding (e.g., "0.0.0.0:8080")
            let host_port = host_binding.split(':').last().unwrap_or("").to_string();
            
            if !host_port.is_empty() {
                ports.push(PortMapping {
                    host_ip: "0.0.0.0".to_string(),
                    host_port,
                    container_port,
                    protocol,
                });
            }
        }
    }
    
    ports
}

fn get_vhosts_for_graph(client: &std::sync::Arc<crate::ssh::SshClient>) -> Result<Vec<NginxVhost>, String> {
    let mut vhosts = Vec::new();

    let available = client
        .execute_command("ls -1 /etc/nginx/sites-available/ 2>/dev/null | grep -v '^default$'")
        .unwrap_or_default();

    let enabled_output = client
        .execute_command("ls -1 /etc/nginx/sites-enabled/ 2>/dev/null")
        .unwrap_or_default();
    let enabled: Vec<&str> = enabled_output.lines().collect();

    for name in available.lines() {
        if name.is_empty() {
            continue;
        }

        let content = client
            .execute_command(&format!("cat /etc/nginx/sites-available/{}", name))
            .unwrap_or_default();

        let server_name = extract_server_name(&content).unwrap_or_else(|| name.to_string());
        let listen_port = extract_listen_port(&content).unwrap_or_else(|| "80".to_string());
        let ssl_enabled = content.contains("ssl_certificate");
        let root_path = extract_root_path(&content).unwrap_or_default();

        vhosts.push(NginxVhost {
            name: name.to_string(),
            enabled: enabled.contains(&name),
            server_name,
            listen_port,
            ssl_enabled,
            root_path,
        });
    }

    Ok(vhosts)
}

fn get_containers_for_graph(client: &std::sync::Arc<crate::ssh::SshClient>) -> Result<Vec<DockerContainer>, String> {
    let ps_output = client
        .execute_command("docker ps --format '{{.ID}}|{{.Names}}|{{.Image}}|{{.State}}' --no-trunc")
        .map_err(|e| e.message)?;

    let mut containers = Vec::new();
    for line in ps_output.lines() {
        let parts: Vec<&str> = line.split('|').collect();
        if parts.len() >= 4 {
            containers.push(DockerContainer {
                id: parts[0].to_string(),
                name: parts[1].to_string(),
                image: parts[2].to_string(),
                status: "running".to_string(),
                state: parts[3].to_string(),
                cpu_percent: 0.0,
                memory_usage: 0,
                memory_limit: 0,
                ports: Vec::new(),
            });
        }
    }

    Ok(containers)
}

fn get_docker_networks_for_graph(client: &std::sync::Arc<crate::ssh::SshClient>) -> Result<Vec<DockerNetwork>, String> {
    let output = client
        .execute_command("docker network ls --format '{{.ID}}|{{.Name}}|{{.Driver}}|{{.Scope}}'")
        .map_err(|e| e.message)?;

    let mut networks = Vec::new();
    for line in output.lines() {
        let parts: Vec<&str> = line.split('|').collect();
        if parts.len() >= 4 {
            let network_id = parts[0].to_string();
            let network_name = parts[1].to_string();
            
            // Skip null network
            if network_name == "null" || network_name == "host" {
                continue;
            }
            
            // Get containers in this network
            let containers_output = client
                .execute_command(&format!("docker network inspect {} --format '{{{{range .Containers}}}}{{.Name}},{{end}}'", network_id))
                .unwrap_or_default();
            
            let containers: Vec<String> = containers_output
                .trim_end_matches(',')
                .split(',')
                .filter(|s| !s.is_empty())
                .map(|s| s.to_string())
                .collect();

            // Get subnet
            let subnet_output = client
                .execute_command(&format!("docker network inspect {} --format '{{{{(index .IPAM.Config 0).Subnet}}}}'", network_id))
                .unwrap_or_default();
            
            let subnet = if subnet_output.trim().is_empty() { None } else { Some(subnet_output.trim().to_string()) };

            networks.push(DockerNetwork {
                id: network_id,
                name: network_name,
                driver: parts[2].to_string(),
                scope: parts[3].to_string(),
                subnet,
                gateway: None,
                containers,
            });
        }
    }

    Ok(networks)
}

async fn extract_proxy_target(client: &std::sync::Arc<crate::ssh::SshClient>, vhost_name: &str) -> Result<String, String> {
    let content = client
        .execute_command(&format!("cat /etc/nginx/sites-available/{}", vhost_name))
        .map_err(|e| e.message)?;

    for line in content.lines() {
        let line = line.trim();
        if line.starts_with("proxy_pass") {
            if let Some(start) = line.find(' ') {
                let url = line[start..].trim().trim_end_matches(';');
                return Ok(url.to_string());
            }
        }
    }

    Ok("static".to_string())
}

fn extract_server_name(content: &str) -> Option<String> {
    for line in content.lines() {
        let line = line.trim();
        if line.starts_with("server_name") {
            if let Some(start) = line.find(' ') {
                let name = line[start..].trim().trim_end_matches(';');
                return Some(name.split_whitespace().next().unwrap_or("").to_string());
            }
        }
    }
    None
}

fn extract_listen_port(content: &str) -> Option<String> {
    for line in content.lines() {
        let line = line.trim();
        if line.starts_with("listen") {
            if let Some(start) = line.find(' ') {
                let port = line[start..].trim().trim_end_matches(';');
                return Some(port.split_whitespace().next().unwrap_or("80").to_string());
            }
        }
    }
    None
}

fn extract_root_path(content: &str) -> Option<String> {
    for line in content.lines() {
        let line = line.trim();
        if line.starts_with("root") {
            if let Some(start) = line.find(' ') {
                let path = line[start..].trim().trim_end_matches(';');
                return Some(path.to_string());
            }
        }
    }
    None
}
