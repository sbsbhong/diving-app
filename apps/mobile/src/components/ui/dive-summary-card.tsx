import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { Box, HStack, Text, VStack } from './primitives';
import type { InstrumentTone } from './theme';

type DiveSummaryCardProps = {
  children?: React.ReactNode;
  accent?: InstrumentTone;
  className?: string;
  style?: StyleProp<ViewStyle>;
};

type DiveSummaryCardHeaderProps = {
  title: string;
  eyebrow?: string;
  right?: React.ReactNode;
};

type DiveSummaryCardMetricProps = {
  label: string;
  value: string;
  unit?: string;
};

const cardStyles = tva({
  base: 'relative overflow-hidden rounded-lg border border-border bg-card p-4',
});

const accentStyles = tva({
  base: 'absolute bottom-3 left-0 top-3 w-1 rounded-full',
  variants: {
    tone: {
      primary: 'bg-primary',
      secondary: 'bg-secondary',
      success: 'bg-primary',
      warning: 'bg-accent',
      danger: 'bg-destructive',
      muted: 'bg-muted',
    },
  },
});

function DiveSummaryCardRoot(props: DiveSummaryCardProps): React.JSX.Element {
  return (
    <VStack gap={16} className={cardStyles({ class: props.className })} style={props.style}>
      {props.accent ? <Box className={accentStyles({ tone: props.accent })} /> : null}
      {props.children}
    </VStack>
  );
}

function DiveSummaryCardHeader(props: DiveSummaryCardHeaderProps): React.JSX.Element {
  return (
    <HStack className="items-center justify-between">
      <VStack gap={4} className="flex-1">
        {props.eyebrow ? (
          <Text className="font-mono text-xs font-extrabold uppercase text-muted-foreground">{props.eyebrow}</Text>
        ) : null}
        <Text className="text-2xl font-black text-card-foreground">{props.title}</Text>
      </VStack>
      {props.right}
    </HStack>
  );
}

function DiveSummaryCardBody(props: { children?: React.ReactNode }): React.JSX.Element {
  return <VStack gap={12}>{props.children}</VStack>;
}

function DiveSummaryCardMetric(props: DiveSummaryCardMetricProps): React.JSX.Element {
  return (
    <HStack className="min-h-9 items-center justify-between py-1">
      <Text className="flex-1 text-xs font-extrabold uppercase text-muted-foreground">{props.label}</Text>
      <HStack gap={4} className="items-baseline">
        <Text className="text-right font-mono text-xl font-black text-card-foreground">{props.value}</Text>
        {props.unit ? <Text className="font-mono text-sm font-extrabold text-muted-foreground">{props.unit}</Text> : null}
      </HStack>
    </HStack>
  );
}

function DiveSummaryCardFooter(props: { children?: React.ReactNode }): React.JSX.Element {
  return <VStack className="border-t border-border pt-3.5">{props.children}</VStack>;
}

export const DiveSummaryCard = Object.assign(DiveSummaryCardRoot, {
  Header: DiveSummaryCardHeader,
  Body: DiveSummaryCardBody,
  Metric: DiveSummaryCardMetric,
  Footer: DiveSummaryCardFooter,
});
