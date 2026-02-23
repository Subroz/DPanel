import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { invoke } from '@tauri-apps/api/core';
import { useServer } from '../context/ServerContext';
import { useToast } from '../context/ToastContext';
import { ServerProfile, AuthMethod, ConnectionResult, SavedServerProfile } from '../types';
import {
  Box,
  Paper,
  TextInput,
  PasswordInput,
  NumberInput,
  Button,
  Group,
  Text,
  Title,
  SegmentedControl,
  Stack,
  Divider,
  Badge,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import {
  IconPlugConnected,
  IconKey,
  IconLock,
  IconTrash,
  IconEdit,
  IconClock,
  IconStar,
  IconStarOff,
  IconServer2,
  IconArrowRight,
} from '@tabler/icons-react';

import { isTauri } from '../lib/tauri';

export default function ConnectionManager() {
  const { setActiveServer, setIsConnected } = useServer();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [savedProfiles, setSavedProfiles] = useState<SavedServerProfile[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProfile, setEditingProfile] = useState<SavedServerProfile | null>(null);
  const [formData, setFormData] = useState({
    name: 'My VPS',
    host: '',
    port: 22,
    username: 'root',
    authType: 'key' as 'password' | 'key',
    password: '',
    keyPath: '',
    passphrase: '',
  });

  useEffect(() => {
    loadSavedProfiles();
  }, []);

  const loadSavedProfiles = async () => {
    if (!isTauri()) return;
    try {
      const profiles = await invoke<SavedServerProfile[]>('get_server_profiles');
      setSavedProfiles(profiles);
    } catch (error) {
      console.error('Failed to load saved profiles:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isTauri()) {
      addToast('Please run this app with: pnpm tauri dev', 'error');
      return;
    }

    setLoading(true);

    const authMethod: AuthMethod = formData.authType === 'password'
      ? { type: 'Password', password: formData.password }
      : { type: 'PrivateKey', key_path: formData.keyPath, passphrase: formData.passphrase || undefined };

    const profile: ServerProfile = {
      id: editingProfile ? editingProfile.id : Date.now().toString(),
      name: formData.name,
      host: formData.host,
      port: formData.port,
      username: formData.username,
      auth_method: authMethod,
    };

    try {
      const result: ConnectionResult = await invoke('connect_to_server', { profile });
      if (result.success) {
        setActiveServer(profile);
        setIsConnected(true);
        addToast(`Connected to ${formData.name} successfully!`, 'success');
        loadSavedProfiles();
        setShowForm(false);
        setEditingProfile(null);
      } else {
        addToast(result.message, 'error');
      }
    } catch (error) {
      addToast(String(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    if (!isTauri()) {
      addToast('Please run this app with: pnpm tauri dev', 'error');
      return;
    }

    setLoading(true);

    const authMethod: AuthMethod = formData.authType === 'password'
      ? { type: 'Password', password: formData.password }
      : { type: 'PrivateKey', key_path: formData.keyPath, passphrase: formData.passphrase || undefined };

    try {
      const result: ConnectionResult = await invoke('test_connection', {
        host: formData.host,
        port: formData.port,
        username: formData.username,
        authMethod,
      });
      if (result.success) {
        addToast('Connection test successful!', 'success');
      } else {
        addToast(result.message, 'error');
      }
    } catch (error) {
      addToast(String(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickConnect = async (profile: SavedServerProfile) => {
    if (!isTauri()) return;

    setLoading(true);
    try {
      const serverProfile: ServerProfile = {
        id: profile.id,
        name: profile.name,
        host: profile.host,
        port: profile.port,
        username: profile.username,
        auth_method: profile.auth_method,
      };
      const result: ConnectionResult = await invoke('connect_to_server', { profile: serverProfile });
      if (result.success) {
        setActiveServer(serverProfile);
        setIsConnected(true);
        addToast(`Connected to ${profile.name} successfully!`, 'success');
        loadSavedProfiles();
      } else {
        addToast(result.message, 'error');
      }
    } catch (error) {
      addToast(String(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProfile = async (profileId: string, profileName: string) => {
    if (!isTauri()) return;
    try {
      await invoke('delete_server_profile', { profileId });
      addToast(`Deleted ${profileName}`, 'success');
      loadSavedProfiles();
    } catch (error) {
      addToast(String(error), 'error');
    }
  };

  const handleEditProfile = (profile: SavedServerProfile) => {
    setEditingProfile(profile);
    setFormData({
      name: profile.name,
      host: profile.host,
      port: profile.port,
      username: profile.username,
      authType: profile.auth_method.type === 'Password' ? 'password' : 'key',
      password: profile.auth_method.type === 'Password' ? profile.auth_method.password : '',
      keyPath: profile.auth_method.type === 'PrivateKey' ? profile.auth_method.key_path : '',
      passphrase: profile.auth_method.type === 'PrivateKey' ? (profile.auth_method.passphrase || '') : '',
    });
    setShowForm(true);
  };

  const handleToggleConnectOnStartup = async (profileId: string, currentValue: boolean) => {
    if (!isTauri()) return;
    try {
      await invoke('update_server_profile_metadata', {
        profileId,
        connectOnStartup: !currentValue,
      });
      addToast('Profile updated', 'success');
      loadSavedProfiles();
    } catch (error) {
      addToast(String(error), 'error');
    }
  };

  const formatLastConnected = (timestamp: number | null) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const fillDefaultKeyPath = () => {
    setFormData({ ...formData, keyPath: '~/.ssh/id_ed25519' });
    addToast('Default key path set. Adjust if your key is elsewhere.', 'info');
  };

  return (
    <Stack gap="xl" maw={720} mx="auto" py="xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Stack align="center" gap="md" mb="xl">
          <Box
            style={{
              width: 56,
              height: 56,
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(6, 182, 212, 0.1))',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(59, 130, 246, 0.1)',
            }}
          >
            <IconServer2 size={28} style={{ color: '#3b82f6' }} />
          </Box>
          <Title
            order={1}
            fw={800}
            style={{ letterSpacing: '-1px', textAlign: 'center' }}
            className="gradient-text"
          >
            Welcome to DPanel
          </Title>
          <Text c="dimmed" size="md" ta="center" maw={400} style={{ lineHeight: 1.6 }}>
            Connect to your server via SSH to manage Docker, services, firewall, and more.
          </Text>
        </Stack>
      </motion.div>

      {savedProfiles.length > 0 && !showForm && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Paper
            p="lg"
            radius="lg"
            className="glass-card-glow"
            style={{ border: '1px solid rgba(255, 255, 255, 0.06)' }}
          >
            <Group justify="space-between" mb="md">
              <Title order={4} fw={700}>Saved Servers</Title>
              <Button
                variant="light"
                size="sm"
                radius="lg"
                onClick={() => {
                  setEditingProfile(null);
                  setFormData({
                    name: 'My VPS',
                    host: '',
                    port: 22,
                    username: 'root',
                    authType: 'key',
                    password: '',
                    keyPath: '',
                    passphrase: '',
                  });
                  setShowForm(true);
                }}
                style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  color: '#3b82f6',
                }}
              >
                Add New Server
              </Button>
            </Group>

            <Stack gap="xs">
              {savedProfiles.map((profile) => (
                <Box
                  key={profile.id}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                    e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                  }}
                >
                  <Group justify="space-between">
                    <Group gap="sm">
                      <Box>
                        <Group gap="xs">
                          <Text fw={600} size="sm">{profile.name}</Text>
                          {profile.connect_on_startup && (
                            <Badge variant="light" size="xs" color="yellow" radius="sm">
                              Auto
                            </Badge>
                          )}
                        </Group>
                        <Text size="xs" c="dimmed" mt={2} style={{ fontFamily: 'var(--mantine-font-family-monospace)' }}>
                          {profile.username}@{profile.host}:{profile.port}
                        </Text>
                        <Group gap={6} mt={4}>
                          <IconClock size={11} color="#666" />
                          <Text size="xs" c="dimmed" style={{ fontSize: '11px' }}>
                            {formatLastConnected(profile.last_connected)}
                          </Text>
                        </Group>
                      </Box>
                    </Group>

                    <Group gap={6}>
                      <Tooltip label="Connect">
                        <ActionIcon
                          variant="filled"
                          size="lg"
                          radius="lg"
                          onClick={() => handleQuickConnect(profile)}
                          loading={loading}
                          style={{
                            background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                            border: 'none',
                          }}
                        >
                          <IconPlugConnected size={18} />
                        </ActionIcon>
                      </Tooltip>

                      <Tooltip label={profile.connect_on_startup ? 'Disable auto-connect' : 'Enable auto-connect'}>
                        <ActionIcon
                          variant="subtle"
                          color={profile.connect_on_startup ? 'yellow' : 'gray'}
                          radius="lg"
                          onClick={() => handleToggleConnectOnStartup(profile.id, profile.connect_on_startup)}
                        >
                          {profile.connect_on_startup ? <IconStar size={16} /> : <IconStarOff size={16} />}
                        </ActionIcon>
                      </Tooltip>

                      <Tooltip label="Edit">
                        <ActionIcon variant="subtle" color="blue" radius="lg" onClick={() => handleEditProfile(profile)}>
                          <IconEdit size={16} />
                        </ActionIcon>
                      </Tooltip>

                      <Tooltip label="Delete">
                        <ActionIcon variant="subtle" color="red" radius="lg" onClick={() => handleDeleteProfile(profile.id, profile.name)}>
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Group>
                </Box>
              ))}
            </Stack>
          </Paper>
        </motion.div>
      )}

      {(showForm || savedProfiles.length === 0) && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <Paper
            p="xl"
            radius="lg"
            className="glass-card-glow animated-border"
            style={{ border: '1px solid rgba(59, 130, 246, 0.12)' }}
          >
            <Stack gap="lg">
              <Group justify="space-between">
                <Box>
                  <Title order={3} fw={700}>
                    {editingProfile ? 'Edit Server' : 'Connect to Server'}
                  </Title>
                  <Text size="sm" c="dimmed" mt={4}>
                    Enter your SSH credentials to connect
                  </Text>
                </Box>
                {savedProfiles.length > 0 && (
                  <Button
                    variant="subtle"
                    size="sm"
                    radius="lg"
                    onClick={() => setShowForm(false)}
                    style={{ color: '#888' }}
                  >
                    Back to Saved
                  </Button>
                )}
              </Group>

              <Box className="gradient-line" />

              <form onSubmit={handleSubmit}>
                <Stack gap="md">
                  <TextInput
                    label="Server Name"
                    placeholder="My VPS"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    radius="lg"
                    styles={{
                      input: {
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        borderColor: 'rgba(255, 255, 255, 0.08)',
                      },
                      label: { fontWeight: 600, fontSize: '13px', marginBottom: '6px' },
                    }}
                  />

                  <Group grow>
                    <TextInput
                      label="Host"
                      placeholder="192.168.1.100"
                      value={formData.host}
                      onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                      required
                      radius="lg"
                      styles={{
                        input: {
                          backgroundColor: 'rgba(255, 255, 255, 0.03)',
                          borderColor: 'rgba(255, 255, 255, 0.08)',
                          fontFamily: 'var(--mantine-font-family-monospace)',
                        },
                        label: { fontWeight: 600, fontSize: '13px', marginBottom: '6px' },
                      }}
                    />
                    <NumberInput
                      label="Port"
                      placeholder="22"
                      value={formData.port}
                      onChange={(value) => setFormData({ ...formData, port: Number(value) || 22 })}
                      min={1}
                      max={65535}
                      radius="lg"
                      styles={{
                        input: {
                          backgroundColor: 'rgba(255, 255, 255, 0.03)',
                          borderColor: 'rgba(255, 255, 255, 0.08)',
                          fontFamily: 'var(--mantine-font-family-monospace)',
                        },
                        label: { fontWeight: 600, fontSize: '13px', marginBottom: '6px' },
                      }}
                    />
                  </Group>

                  <TextInput
                    label="Username"
                    placeholder="root"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                    radius="lg"
                    styles={{
                      input: {
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        borderColor: 'rgba(255, 255, 255, 0.08)',
                        fontFamily: 'var(--mantine-font-family-monospace)',
                      },
                      label: { fontWeight: 600, fontSize: '13px', marginBottom: '6px' },
                    }}
                  />

                  <Box>
                    <Text size="sm" fw={600} mb="xs" style={{ fontSize: '13px' }}>Authentication</Text>
                    <SegmentedControl
                      value={formData.authType}
                      onChange={(value) => setFormData({ ...formData, authType: value as 'password' | 'key' })}
                      data={[
                        { label: 'Password', value: 'password' },
                        { label: 'SSH Key', value: 'key' },
                      ]}
                      fullWidth
                      radius="lg"
                      styles={{
                        root: {
                          backgroundColor: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                        },
                        indicator: {
                          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(6, 182, 212, 0.15))',
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                          borderRadius: '10px',
                        },
                        label: {
                          fontWeight: 600,
                          fontSize: '13px',
                        },
                      }}
                    />
                  </Box>

                  {formData.authType === 'password' ? (
                    <PasswordInput
                      label="Password"
                      placeholder="Enter password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      radius="lg"
                      styles={{
                        input: {
                          backgroundColor: 'rgba(255, 255, 255, 0.03)',
                          borderColor: 'rgba(255, 255, 255, 0.08)',
                        },
                        label: { fontWeight: 600, fontSize: '13px', marginBottom: '6px' },
                      }}
                    />
                  ) : (
                    <>
                      <TextInput
                        label="Private Key Path"
                        placeholder="~/.ssh/id_ed25519"
                        value={formData.keyPath}
                        onChange={(e) => setFormData({ ...formData, keyPath: e.target.value })}
                        required
                        radius="lg"
                        leftSection={<IconKey size={16} color="#3b82f6" />}
                        rightSection={
                          !formData.keyPath && (
                            <Button
                              variant="subtle"
                              size="compact-xs"
                              onClick={fillDefaultKeyPath}
                              style={{ color: '#3b82f6', fontSize: '12px' }}
                            >
                              Use Default
                            </Button>
                          )
                        }
                        styles={{
                          input: {
                            backgroundColor: 'rgba(255, 255, 255, 0.03)',
                            borderColor: 'rgba(255, 255, 255, 0.08)',
                            fontFamily: 'var(--mantine-font-family-monospace)',
                            fontSize: '13px',
                          },
                          label: { fontWeight: 600, fontSize: '13px', marginBottom: '6px' },
                        }}
                      />
                      <PasswordInput
                        label="Key Passphrase (optional)"
                        placeholder="Enter passphrase"
                        value={formData.passphrase}
                        onChange={(e) => setFormData({ ...formData, passphrase: e.target.value })}
                        radius="lg"
                        leftSection={<IconLock size={16} color="#666" />}
                        styles={{
                          input: {
                            backgroundColor: 'rgba(255, 255, 255, 0.03)',
                            borderColor: 'rgba(255, 255, 255, 0.08)',
                          },
                          label: { fontWeight: 600, fontSize: '13px', marginBottom: '6px' },
                        }}
                      />
                    </>
                  )}

                  <Box className="gradient-line" style={{ marginTop: 8 }} />

                  <Group justify="space-between" mt="xs">
                    <Button
                      variant="default"
                      onClick={testConnection}
                      loading={loading}
                      radius="lg"
                      leftSection={<IconPlugConnected size={16} />}
                      style={{
                        background: 'transparent',
                        border: '1px solid rgba(59, 130, 246, 0.25)',
                        color: '#3b82f6',
                        transition: 'all 0.25s ease',
                      }}
                      onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                        e.currentTarget.style.background = 'rgba(59, 130, 246, 0.08)';
                        e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)';
                        e.currentTarget.style.boxShadow = '0 0 12px rgba(59, 130, 246, 0.1)';
                      }}
                      onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.25)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      Test Connection
                    </Button>
                    <Button
                      type="submit"
                      loading={loading}
                      radius="lg"
                      size="md"
                      rightSection={!loading && <IconArrowRight size={18} />}
                      loaderProps={{ type: loading ? 'dots' : 'oval' }}
                      style={{
                        background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                        border: 'none',
                        fontWeight: 700,
                        fontSize: '14px',
                        padding: '0 28px',
                        boxShadow: '0 2px 12px rgba(59, 130, 246, 0.25)',
                        transition: 'all 0.25s ease',
                      }}
                      onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 20px rgba(59, 130, 246, 0.35)';
                      }}
                      onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 12px rgba(59, 130, 246, 0.25)';
                      }}
                    >
                      {loading ? 'Connecting...' : editingProfile ? 'Save & Connect' : 'Connect'}
                    </Button>
                  </Group>
                </Stack>
              </form>
            </Stack>
          </Paper>
        </motion.div>
      )}
    </Stack>
  );
}
