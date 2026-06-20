import React from 'react';
import { Pressable, PressableProps, StyleProp, TextStyle, ViewStyle } from 'react-native';
import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { Text } from './primitives';
import type { InstrumentTone } from './theme';

type StatusPillProps = {
  label: string;
  tone?: InstrumentTone;
  className?: string;
  style?: StyleProp<TextStyle>;
};

const pillStyles = tva({
  base: 'self-start overflow-hidden rounded-full border px-2 py-1 font-mono text-xs font-extrabold uppercase',
  variants: {
    tone: {
      primary: 'border-primary bg-primary/15 text-primary',
      secondary: 'border-secondary bg-secondary/15 text-secondary',
      success: 'border-primary bg-primary/15 text-primary',
      warning: 'border-accent bg-accent/15 text-accent-foreground',
      danger: 'border-destructive bg-destructive/15 text-destructive',
      muted: 'border-border bg-muted text-muted-foreground',
    },
  },
  defaultVariants: {
    tone: 'primary',
  },
});

export function StatusPill(props: StatusPillProps): React.JSX.Element {
  return (
    <Text className={pillStyles({ tone: props.tone, class: props.className })} style={props.style}>
      {props.label.toUpperCase()}
    </Text>
  );
}

type InstrumentButtonProps = Omit<PressableProps, 'style'> & {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger';
  className?: string;
  style?: StyleProp<ViewStyle>;
};

const buttonStyles = tva({
  base: 'min-h-12 items-center justify-center rounded-lg border px-4 py-3',
  variants: {
    variant: {
      primary: 'border-primary bg-primary',
      secondary: 'border-primary bg-card',
      danger: 'border-destructive bg-destructive/10',
    },
  },
  defaultVariants: {
    variant: 'secondary',
  },
});

const buttonTextStyles = tva({
  base: 'text-center text-sm font-black',
  variants: {
    variant: {
      primary: 'text-primary-foreground',
      secondary: 'text-primary',
      danger: 'text-destructive',
    },
  },
  defaultVariants: {
    variant: 'secondary',
  },
});

export function InstrumentButton({
  label,
  variant = 'secondary',
  className,
  style,
  ...pressableProps
}: InstrumentButtonProps): React.JSX.Element {
  return (
    <Pressable
      {...pressableProps}
      className={buttonStyles({ variant, class: className })}
      style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.98 : 1 }] }, style]}>
      <Text className={buttonTextStyles({ variant })}>{label}</Text>
    </Pressable>
  );
}

type SafetyTextProps = {
  children: string;
};

export function SafetyText(props: SafetyTextProps): React.JSX.Element {
  return <Text className="text-center text-xs font-extrabold uppercase leading-4 text-muted-foreground">{props.children}</Text>;
}
