import { useColorScheme } from 'nativewind';
import { colors } from './config';

/**
 * Convert CSS variable name to camelCase
 * Example: '--primary-foreground' -> 'primaryForeground'
 */
function toCamelCase(str: string): string {
  return str
    .replace(/^--/, '') // Remove leading --
    .replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()); // Convert -x to X
}

function rgbToHex(rgbString: string): string {
  const parts = rgbString.trim().split(/\s+/);
  if (parts.length !== 3) return '';

  const [r, g, b] = parts.map((s) => {
    const num = parseInt(s, 10);
    return isNaN(num) ? 0 : num;
  });

  const toHex = (n: number) =>
    Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Hook to get all gluestack colors as hex values
 * Automatically converts all CSS variables to camelCase
 * Returns a dynamic object with all colors
 *
 * Usage: const palette = useGluestackColors();
 *          palette.primary
 *          palette.primaryForeground
 */
export function useGluestackColors(): Record<string, string> {
  const { colorScheme } = useColorScheme();
  const theme = colors[colorScheme || 'light'];

  // Dynamically convert all CSS variables to camelCase hex colors
  const result: Record<string, string> = {};

  Object.entries(theme).forEach(([key, value]) => {
    const camelKey = toCamelCase(key);
    result[camelKey] = rgbToHex(value as string);
  });

  return result;
}

/**
 * Hook to get calendar theme object for react-native-calendars
 * Automatically maps all available colors
 */
export function useCalendarTheme(): Record<string, string> {
  const palette = useGluestackColors();
  const fallback = {
    accent: rgbToHex(colors.light['--accent']),
    background: rgbToHex(colors.light['--background']),
    foreground: rgbToHex(colors.light['--foreground']),
    mutedForeground: rgbToHex(colors.light['--muted-foreground']),
    primary: rgbToHex(colors.light['--primary']),
    primaryForeground: rgbToHex(colors.light['--primary-foreground']),
  };

  return {
    backgroundColor: palette.background || fallback.background,
    calendarBackground: palette.background || fallback.background,
    textSectionTitleColor: palette.mutedForeground || fallback.mutedForeground,
    selectedDayBackgroundColor: palette.primary || fallback.primary,
    selectedDayTextColor: palette.primaryForeground || fallback.primaryForeground,
    todayTextColor: palette.primary || fallback.primary,
    todayBackgroundColor: palette.accent || fallback.accent,
    dayTextColor: palette.foreground || fallback.foreground,
    textDisabledColor: palette.mutedForeground || fallback.mutedForeground,
    dotColor: palette.primary || fallback.primary,
    selectedDotColor: palette.primaryForeground || fallback.primaryForeground,
    arrowColor: palette.foreground || fallback.foreground,
    monthTextColor: palette.foreground || fallback.foreground,
    indicatorColor: palette.primary || fallback.primary,
  };
}

// Type helper - you can use this to get typed colors if needed
export type GluestackColors = ReturnType<typeof useGluestackColors>;
