import React from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { Button, ButtonText } from './button';
import { Text } from './text';
import type { InstrumentTone } from './theme';

type StatusPillProps = {
  label: string;
  tone?: InstrumentTone;
  className?: string;
  style?: StyleProp<TextStyle>;
};

const pillStyles = tva({
  base: 'self-start overflow-hidden rounded-full px-3 py-1 text-xs font-semibold uppercase',
  variants: {
    tone: {
      primary: 'bg-primary text-primary-foreground',
      secondary: 'bg-secondary text-secondary-foreground',
      success: 'bg-primary text-primary-foreground',
      warning: 'bg-secondary text-primary',
      danger: 'bg-destructive/10 text-destructive',
      muted: 'bg-muted text-muted-foreground',
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

type InstrumentButtonProps = Omit<React.ComponentProps<typeof Button>, 'children' | 'className' | 'style' | 'variant'> & {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger';
  className?: string;
  style?: StyleProp<ViewStyle>;
};

const buttonStyles = tva({
  base: 'min-h-12 items-center justify-center rounded-full px-5 py-3',
  variants: {
    variant: {
      primary: 'bg-primary',
      secondary: 'bg-secondary',
      danger: 'bg-destructive/10',
    },
  },
  defaultVariants: {
    variant: 'secondary',
  },
});

const buttonTextStyles = tva({
  base: 'text-center text-base font-normal',
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

const instrumentButtonVariant = {
  primary: 'default',
  secondary: 'secondary',
  danger: 'ghost',
} as const;

export function InstrumentButton({
  label,
  variant = 'secondary',
  className,
  style,
  ...pressableProps
}: InstrumentButtonProps): React.JSX.Element {
  return (
    <Button
      {...pressableProps}
      variant={instrumentButtonVariant[variant]}
      className={buttonStyles({ variant, class: className })}
      style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.95 : 1 }] }, style]}>
      <ButtonText className={buttonTextStyles({ variant })}>{label}</ButtonText>
    </Button>
  );
}

type SelectorPillProps = Omit<React.ComponentProps<typeof Button>, 'children' | 'className' | 'style' | 'variant'> & {
  label: string;
  selected: boolean;
  className?: string;
  style?: StyleProp<ViewStyle>;
};

const selectorPillStyles = tva({
  base: 'min-h-10 items-center justify-center rounded-full px-3 py-2',
  variants: {
    selected: {
      true: 'bg-card',
      false: 'bg-transparent',
    },
  },
  defaultVariants: {
    selected: false,
  },
});

const selectorPillTextStyles = tva({
  base: 'text-xs font-semibold uppercase',
  variants: {
    selected: {
      true: 'text-foreground',
      false: 'text-muted-foreground',
    },
  },
  defaultVariants: {
    selected: false,
  },
});

export function SelectorPill({
  label,
  selected,
  className,
  style,
  ...pressableProps
}: SelectorPillProps): React.JSX.Element {
  return (
    <Button
      {...pressableProps}
      variant="ghost"
      className={selectorPillStyles({ selected, class: className })}
      style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.95 : 1 }] }, style]}>
      <ButtonText className={selectorPillTextStyles({ selected })}>{label}</ButtonText>
    </Button>
  );
}

type SafetyTextProps = {
  children: string;
};

export function SafetyText(props: SafetyTextProps): React.JSX.Element {
  return <Text className="text-center text-xs font-semibold uppercase leading-4 text-muted-foreground">{props.children}</Text>;
}
