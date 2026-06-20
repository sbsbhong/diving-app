import { Platform } from 'react-native';

export const diveTheme = {
  colors: {
    background: '#000000',
    surface: '#121414',
    surfaceContainer: '#1c1e1e',
    surfaceRaised: '#282a2b',
    primary: '#00ffff',
    secondary: '#76d6d5',
    success: '#98ffd9',
    warning: '#ffbf00',
    danger: '#ff6b61',
    text: '#ffffff',
    mutedText: '#b8caca',
    outline: '#3b4a49',
    primaryText: '#002020',
  },
  radii: {
    card: 16,
    control: 12,
    pill: 999,
  },
  spacing: {
    screen: 16,
    card: 16,
  },
  fonts: {
    metric: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
  },
} as const;

export type InstrumentTone = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'muted';

export const toneColor = (tone: InstrumentTone = 'primary') => {
  if (tone === 'muted') {
    return diveTheme.colors.mutedText;
  }

  return diveTheme.colors[tone];
};
