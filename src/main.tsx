import React from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider, createTheme } from '@mantine/core';
import { NavigationProgress } from '@mantine/nprogress';
import { Notifications } from '@mantine/notifications';
import App from './App';
import { ToastProvider } from './context/ToastContext';
import '@mantine/core/styles.css';
import '@mantine/nprogress/styles.css';
import '@mantine/notifications/styles.css';

const theme = createTheme({
  colors: {
    dark: [
      '#C1C2C5',
      '#A6A7A8',
      '#909296',
      '#5c5f66',
      '#373A40',
      '#2C2E33',
      '#25262B',
      '#1A1B1E',
      '#141517',
      '#101113',
    ],
    blue: [
      '#e7f5ff',
      '#d0ebff',
      '#a5d8ff',
      '#74c0fc',
      '#4dabf7',
      '#339af0',
      '#228be6',
      '#1c7ed6',
      '#1971c2',
      '#1864ab',
    ],
  },
  primaryColor: 'blue',
  fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  fontFamilyMonospace: 'JetBrains Mono, ui-monospace, monospace',
  defaultRadius: 'lg',
  headings: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    fontWeight: '700',
  },
  components: {
    Button: {
      defaultProps: {
        radius: 'lg',
      },
      styles: {
        root: {
          fontWeight: 600,
          transition: 'all 0.2s ease',
        },
      },
    },
    Paper: {
      styles: {
        root: {
          backgroundColor: 'rgba(17, 17, 17, 0.7)',
          backdropFilter: 'blur(12px)',
          borderColor: 'rgba(255, 255, 255, 0.06)',
        },
      },
    },
    TextInput: {
      styles: {
        input: {
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
          borderColor: 'rgba(255, 255, 255, 0.08)',
          transition: 'all 0.2s ease',
          '&:focus': {
            borderColor: '#3b82f6',
            boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.15)',
          },
        },
      },
    },
    PasswordInput: {
      styles: {
        input: {
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
          borderColor: 'rgba(255, 255, 255, 0.08)',
          transition: 'all 0.2s ease',
        },
      },
    },
    NumberInput: {
      styles: {
        input: {
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
          borderColor: 'rgba(255, 255, 255, 0.08)',
          transition: 'all 0.2s ease',
        },
      },
    },
    ActionIcon: {
      styles: {
        root: {
          transition: 'all 0.2s ease',
        },
      },
    },
    Badge: {
      styles: {
        root: {
          fontWeight: 600,
          letterSpacing: '0.02em',
        },
      },
    },
    SegmentedControl: {
      styles: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
          borderRadius: '12px',
        },
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <NavigationProgress />
      <Notifications position="top-right" />
      <ToastProvider>
        <App />
      </ToastProvider>
    </MantineProvider>
  </React.StrictMode>
);
