import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Stack, UnstyledButton, Group, Text, Tooltip, Divider } from '@mantine/core';
import {
  IconLayoutDashboard,
  IconBrandDocker,
  IconSettings,
  IconWorld,
  IconClock,
  IconFileStack,
  IconTerminal,
  IconShield,
  IconUsers,
  IconTopologyStar,
} from '@tabler/icons-react';
import { useServer } from '../../context/ServerContext';
import logo from '../../assets/logo.png';

type View = 'dashboard' | 'docker' | 'services' | 'nginx' | 'cron' | 'logs' | 'commands' | 'firewall' | 'users' | 'infrastructure';

interface NavigationRailProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

const menuItems: { id: View; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <IconLayoutDashboard size={20} /> },
  { id: 'docker', label: 'Docker', icon: <IconBrandDocker size={20} /> },
  { id: 'services', label: 'Services', icon: <IconSettings size={20} /> },
  { id: 'nginx', label: 'Nginx', icon: <IconWorld size={20} /> },
  { id: 'cron', label: 'Cron', icon: <IconClock size={20} /> },
  { id: 'logs', label: 'Logs', icon: <IconFileStack size={20} /> },
  { id: 'commands', label: 'Commands', icon: <IconTerminal size={20} /> },
  { id: 'firewall', label: 'Firewall', icon: <IconShield size={20} /> },
  { id: 'users', label: 'Users', icon: <IconUsers size={20} /> },
  { id: 'infrastructure', label: 'Infrastructure', icon: <IconTopologyStar size={20} /> },
];

const SIDEBAR_TRANSITION = {
  duration: 0.2,
  ease: [0.4, 0.0, 0.2, 1],
};

export function NavigationRail({ currentView, onViewChange }: NavigationRailProps) {
  const [expanded, setExpanded] = useState(false);
  const { isConnected } = useServer();

  return (
    <motion.div
      style={{
        width: expanded ? 240 : 72,
        height: '100vh',
        background: 'linear-gradient(180deg, #0c0c16 0%, #0a0a0f 100%)',
        borderRight: '1px solid rgba(255, 255, 255, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
      animate={{ width: expanded ? 240 : 72 }}
      transition={SIDEBAR_TRANSITION}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <Box style={{ padding: '16px', display: 'flex', justifyContent: 'center' }}>
        <Group gap="md" justify="center" wrap="nowrap">
          <Box
            style={{
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              position: 'relative',
            }}
          >
            <Box
              style={{
                position: 'absolute',
                inset: -8,
                background: 'radial-gradient(circle, rgba(59, 130, 246, 0.12) 0%, transparent 70%)',
                borderRadius: '50%',
                pointerEvents: 'none',
              }}
            />
            <img
              src={logo}
              alt="DPanel"
              style={{
                width: 40,
                height: 40,
                objectFit: 'contain',
                position: 'relative',
                zIndex: 1,
              }}
            />
          </Box>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={SIDEBAR_TRANSITION}
                style={{ overflow: 'hidden' }}
              >
                <Text
                  size="xl"
                  fw={800}
                  style={{ letterSpacing: '-1px', whiteSpace: 'nowrap' }}
                  className="gradient-text"
                >
                  DPanel
                </Text>
              </motion.div>
            )}
          </AnimatePresence>
        </Group>
      </Box>

      <Divider my="xs" style={{ borderColor: 'rgba(255, 255, 255, 0.04)' }} />

      <Stack gap={4} style={{ padding: '8px', flex: 1 }}>
        {menuItems.map((item) => {
          const isActive = currentView === item.id;

          return (
            <Tooltip
              key={item.id}
              label={!expanded ? item.label : ''}
              position="right"
              withArrow
              arrowSize={6}
              disabled={expanded}
              styles={{
                tooltip: {
                  background: 'rgba(17, 17, 24, 0.95)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  color: '#e2e8f0',
                  fontSize: '13px',
                  fontWeight: 500,
                },
              }}
            >
              <UnstyledButton
                onClick={() => isConnected && onViewChange(item.id)}
                disabled={!isConnected}
                style={{ width: '100%' }}
              >
                <Box
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: expanded ? 'flex-start' : 'center',
                    gap: '12px',
                    padding: '10px',
                    borderRadius: '12px',
                    background: isActive
                      ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(6, 182, 212, 0.06) 100%)'
                      : 'transparent',
                    cursor: isConnected ? 'pointer' : 'not-allowed',
                    opacity: isConnected ? 1 : 0.4,
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    minHeight: 44,
                    position: 'relative',
                    borderLeft: isActive ? '3px solid #3b82f6' : '3px solid transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (isConnected && !isActive) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (isConnected && !isActive) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  {isActive && (
                    <Box
                      style={{
                        position: 'absolute',
                        left: -3,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 3,
                        height: 20,
                        background: 'linear-gradient(180deg, #3b82f6, #06b6d4)',
                        borderRadius: '0 4px 4px 0',
                        boxShadow: '0 0 8px rgba(59, 130, 246, 0.5)',
                      }}
                    />
                  )}

                  <Box
                    style={{
                      width: 36,
                      height: 36,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '10px',
                      background: isActive
                        ? 'linear-gradient(135deg, #3b82f6, #06b6d4)'
                        : 'transparent',
                      flexShrink: 0,
                      transition: 'all 0.2s ease',
                      boxShadow: isActive ? '0 2px 8px rgba(59, 130, 246, 0.3)' : 'none',
                    }}
                  >
                    <Box style={{
                      color: isActive ? '#ffffff' : '#666',
                      transition: 'color 0.2s ease',
                    }}>
                      {item.icon}
                    </Box>
                  </Box>

                  <AnimatePresence>
                    {expanded && (
                      <motion.div
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={SIDEBAR_TRANSITION}
                        style={{ overflow: 'hidden' }}
                      >
                        <Text
                          size="sm"
                          fw={isActive ? 600 : 500}
                          c={isActive ? 'white' : 'dimmed'}
                          style={{ whiteSpace: 'nowrap' }}
                        >
                          {item.label}
                        </Text>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Box>
              </UnstyledButton>
            </Tooltip>
          );
        })}
      </Stack>
    </motion.div>
  );
}
