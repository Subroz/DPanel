import { Box, Group, Text, ActionIcon, Tooltip } from '@mantine/core';
import {
  IconWifi,
  IconWifiOff,
  IconSearch,
  IconBell,
  IconSettings,
} from '@tabler/icons-react';
import { useServer } from '../../context/ServerContext';

interface TopBarProps {
  onDisconnect: () => void;
}

export function TopBar({ onDisconnect }: TopBarProps) {
  const { isConnected, activeServer } = useServer();

  return (
    <Box
      style={{
        height: 64,
        background: 'rgba(10, 10, 15, 0.8)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <Box className="gradient-line" style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }} />

      <Group gap="md">
        {isConnected && activeServer && (
          <Box
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '8px 16px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <Box
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#10b981',
              }}
              className="status-pulse"
            />

            <div>
              <Text size="xs" c="dimmed" fw={500} style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Connected
              </Text>
              <Text size="sm" fw={600} c="white">
                {activeServer.name}
              </Text>
            </div>

            <Box
              style={{
                padding: '3px 10px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
              }}
            >
              <Text size="xs" fw={600} style={{ color: '#10b981', fontSize: '11px' }}>
                <IconWifi size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                Online
              </Text>
            </Box>
          </Box>
        )}
      </Group>

      <Group gap="sm">
        <Tooltip label="Search coming soon" position="bottom">
          <Box
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 16px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              minWidth: 260,
              opacity: 0.5,
              cursor: 'default',
              transition: 'all 0.2s ease',
            }}
          >
            <IconSearch size={16} color="#555" />
            <Text size="sm" c="dimmed" style={{ flex: 1, fontSize: '13px' }}>
              Search...
            </Text>
            <Box
              style={{
                padding: '3px 8px',
                background: 'rgba(255, 255, 255, 0.04)',
                borderRadius: '6px',
                fontSize: '11px',
                color: '#555',
                fontFamily: 'var(--mantine-font-family-monospace)',
              }}
            >
              ⌘K
            </Box>
          </Box>
        </Tooltip>

        <Tooltip label="Notifications coming soon" position="bottom">
          <ActionIcon
            size="lg"
            variant="subtle"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '12px',
              opacity: 0.5,
              cursor: 'default',
              width: 42,
              height: 42,
            }}
          >
            <IconBell size={18} color="#555" />
          </ActionIcon>
        </Tooltip>

        <Tooltip label="Settings coming soon" position="bottom">
          <ActionIcon
            size="lg"
            variant="subtle"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '12px',
              opacity: 0.5,
              cursor: 'default',
              width: 42,
              height: 42,
            }}
          >
            <IconSettings size={18} color="#555" />
          </ActionIcon>
        </Tooltip>

        {isConnected && (
          <Box
            onClick={onDisconnect}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.15)',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
              e.currentTarget.style.boxShadow = '0 0 15px rgba(239, 68, 68, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.15)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <IconWifiOff size={16} color="#ef4444" />
            <Text size="sm" fw={600} style={{ color: '#ef4444', fontSize: '13px' }}>
              Disconnect
            </Text>
          </Box>
        )}
      </Group>
    </Box>
  );
}
