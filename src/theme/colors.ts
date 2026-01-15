export const colors = {
  // Background colors - deeper, richer blacks
  background: '#09090b',
  surface: '#111113',
  surfaceElevated: '#18181b',
  surfaceHighlight: '#27272a',

  // Primary brand colors - softer indigo
  primary: '#6366f1',
  primaryDark: '#4f46e5',
  primaryLight: '#818cf8',
  primaryMuted: 'rgba(99, 102, 241, 0.1)',

  // Status colors - softer variants
  success: '#22c55e',
  successDark: '#16a34a',
  successMuted: 'rgba(34, 197, 94, 0.1)',
  warning: '#eab308',
  warningDark: '#ca8a04',
  warningMuted: 'rgba(234, 179, 8, 0.1)',
  error: '#ef4444',
  errorDark: '#dc2626',
  errorMuted: 'rgba(239, 68, 68, 0.1)',
  info: '#3b82f6',
  infoDark: '#2563eb',
  infoMuted: 'rgba(59, 130, 246, 0.1)',

  // Text colors - refined hierarchy
  textPrimary: '#fafafa',
  textSecondary: '#a1a1aa',
  textTertiary: '#71717a',
  textDisabled: '#52525b',

  // Border colors - very subtle
  border: '#27272a',
  borderLight: '#3f3f46',
  borderSubtle: '#1f1f23',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.8)',
  transparent: 'transparent',

  // Application status
  statusRunning: '#22c55e',
  statusStopped: '#71717a',
  statusError: '#ef4444',
  statusBuilding: '#eab308',
  statusIdle: '#6366f1',
};

export type ColorName = keyof typeof colors;
