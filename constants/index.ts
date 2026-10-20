export const COLORS = {
  dark: {
    background: '#0a0b0d',
    surface: '#15181d',
    surfaceElevated: '#1c2026',
    border: '#2a2f37',
    primary: '#22c55e',
    primaryDim: '#16a34a',
    primaryGlow: 'rgba(34, 197, 94, 0.4)',
    danger: '#ef4444',
    dangerGlow: 'rgba(239, 68, 68, 0.4)',
    text: '#f3f4f6',
    textSecondary: '#9ca3af',
    textMuted: '#6b7280',
    accent: '#3b82f6',
    waveform: '#22c55e',
  },
  light: {
    background: '#f8fafc',
    surface: '#ffffff',
    surfaceElevated: '#f1f5f9',
    border: '#e2e8f0',
    primary: '#16a34a',
    primaryDim: '#15803d',
    primaryGlow: 'rgba(22, 163, 74, 0.3)',
    danger: '#dc2626',
    dangerGlow: 'rgba(220, 38, 38, 0.3)',
    text: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#94a3b8',
    accent: '#2563eb',
    waveform: '#16a34a',
  },
} as const;

export const QUALITY_SETTINGS = {
  low: { audioBitsPerSecond: 64000 },
  medium: { audioBitsPerSecond: 128000 },
  high: { audioBitsPerSecond: 256000 },
} as const;

export const STORAGE_KEYS = {
  settings: 'bird_recorder_settings',
  metadata: 'bird_recorder_metadata',
  audioPrefix: 'bird_recorder_audio_',
} as const;

export const APP_VERSION = '1.0.0';
export const BIRD_PRANK_DURATION = 12;
