import { motion } from 'framer-motion';
import { Box, Stack, Text } from '@mantine/core';
import logo from '../../assets/logo.png';

export function LoadingScreen() {
  return (
    <Box
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0f',
        zIndex: 9999,
        overflow: 'hidden',
      }}
    >
      <Box
        style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, rgba(6, 182, 212, 0.04) 40%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
      />

      <motion.div
        style={{
          position: 'absolute',
          top: '20%',
          left: '10%',
          width: 3,
          height: 3,
          background: 'rgba(59, 130, 246, 0.3)',
          borderRadius: '50%',
        }}
        animate={{ y: [0, -20, 0], opacity: [0.3, 0.8, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        style={{
          position: 'absolute',
          top: '60%',
          right: '15%',
          width: 2,
          height: 2,
          background: 'rgba(6, 182, 212, 0.3)',
          borderRadius: '50%',
        }}
        animate={{ y: [0, -15, 0], opacity: [0.2, 0.6, 0.2] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />
      <motion.div
        style={{
          position: 'absolute',
          top: '40%',
          right: '30%',
          width: 2,
          height: 2,
          background: 'rgba(59, 130, 246, 0.2)',
          borderRadius: '50%',
        }}
        animate={{ y: [0, -25, 0], opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      />

      <Stack align="center" gap="xl" style={{ position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            duration: 0.6,
            type: 'spring',
            stiffness: 200,
            damping: 15,
          }}
        >
          <Box
            style={{
              width: 72,
              height: 72,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <Box
              style={{
                position: 'absolute',
                inset: -16,
                background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
                borderRadius: '50%',
                pointerEvents: 'none',
              }}
            />
            <img
              src={logo}
              alt="DPanel"
              style={{
                width: 72,
                height: 72,
                objectFit: 'contain',
                position: 'relative',
                zIndex: 1,
              }}
            />
          </Box>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Text
            size="4xl"
            fw={800}
            style={{ letterSpacing: '-2px' }}
            className="gradient-text"
          >
            DPanel
          </Text>
        </motion.div>

        <Box style={{ width: 200, height: 3, background: 'rgba(255, 255, 255, 0.04)', borderRadius: 2, overflow: 'hidden' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
            style={{
              height: '100%',
              background: 'linear-gradient(90deg, #3b82f6, #06b6d4)',
              borderRadius: 2,
              boxShadow: '0 0 12px rgba(59, 130, 246, 0.3)',
            }}
          />
        </Box>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <Text c="dimmed" size="sm" fw={500} className="text-shimmer">
            Initializing...
          </Text>
        </motion.div>
      </Stack>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        style={{
          position: 'absolute',
          bottom: 40,
          left: '50%',
          transform: 'translateX(-50%)',
        }}
      >
        <Text c="dimmed" size="xs" style={{ opacity: 0.4 }}>
          v0.1.0
        </Text>
      </motion.div>
    </Box>
  );
}
