import React from 'react';
import { Pressable, PressableProps, StyleProp, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { Text } from './primitives';
import { diveTheme, InstrumentTone, toneColor } from './theme';

type StatusPillProps = {
  label: string;
  tone?: InstrumentTone;
  style?: StyleProp<TextStyle>;
};

export function StatusPill(props: StatusPillProps): React.JSX.Element {
  const color = toneColor(props.tone);

  return (
    <Text
      style={[
        styles.pill,
        {
          borderColor: color,
          backgroundColor: `${color}24`,
          color,
        },
        props.style,
      ]}>
      {props.label.toUpperCase()}
    </Text>
  );
}

type InstrumentButtonProps = Omit<PressableProps, 'style'> & {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger';
  style?: StyleProp<ViewStyle>;
};

export function InstrumentButton({
  label,
  variant = 'secondary',
  style,
  ...pressableProps
}: InstrumentButtonProps): React.JSX.Element {
  const isPrimary = variant === 'primary';
  const isDanger = variant === 'danger';

  return (
    <Pressable
      {...pressableProps}
      style={({ pressed }) => [
        styles.button,
        isPrimary && styles.buttonPrimary,
        isDanger && styles.buttonDanger,
        pressed && styles.buttonPressed,
        style,
      ]}>
      <Text style={[styles.buttonText, isPrimary && styles.buttonTextPrimary, isDanger && styles.buttonTextDanger]}>
        {label}
      </Text>
    </Pressable>
  );
}

type SafetyTextProps = {
  children: string;
};

export function SafetyText(props: SafetyTextProps): React.JSX.Element {
  return <Text style={styles.safetyText}>{props.children}</Text>;
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: diveTheme.radii.pill,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontFamily: diveTheme.fonts.metric,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  button: {
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: diveTheme.colors.primary,
    borderRadius: diveTheme.radii.card,
    backgroundColor: diveTheme.colors.surfaceContainer,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  buttonPrimary: {
    backgroundColor: diveTheme.colors.primary,
  },
  buttonDanger: {
    borderColor: diveTheme.colors.danger,
    backgroundColor: '#2b1717',
  },
  buttonPressed: {
    opacity: 0.78,
  },
  buttonText: {
    color: diveTheme.colors.primary,
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
  },
  buttonTextPrimary: {
    color: diveTheme.colors.primaryText,
  },
  buttonTextDanger: {
    color: diveTheme.colors.danger,
  },
  safetyText: {
    color: `${diveTheme.colors.mutedText}d6`,
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 15,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
});
