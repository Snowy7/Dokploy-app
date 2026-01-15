export const colors = {
  // Background colors
  background: '#0a0a0a',
  surface: '#1a1a1a',
  surfaceElevated: '#2a2a2a',
  surfaceHighlight: '#3a3a3a',

  // Primary brand colors
  primary: '#3b82f6',
  primaryDark: '#2563eb',
  primaryLight: '#60a5fa',

  // Status colors
  success: '#10b981',
  successDark: '#059669',
  warning: '#f59e0b',
  warningDark: '#d97706',
  error: '#ef4444',
  errorDark: '#dc2626',
  info: '#06b6d4',
  infoDark: '#0891b2',

  // Text colors
  textPrimary: '#ffffff',
  textSecondary: '#a1a1aa',
  textTertiary: '#71717a',
  textDisabled: '#52525b',

  // Border colors
  border: '#27272a',
  borderLight: '#3f3f46',
  borderDark: '#18181b',

  // Special
  overlay: 'rgba(0, 0, 0, 0.7)',
  transparent: 'transparent',

  // Application status
  statusRunning: '#10b981',
  statusStopped: '#71717a',
  statusError: '#ef4444',
  statusBuilding: '#f59e0b',
  statusIdle: '#3b82f6',
};

export type ColorName = keyof typeof colors;
