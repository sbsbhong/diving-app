import React from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { Box, HStack, Text, VStack } from './primitives';
import { diveTheme } from './theme';

type DiveSummaryCardProps = {
  children?: React.ReactNode;
  accent?: string;
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

function DiveSummaryCardRoot(props: DiveSummaryCardProps): React.JSX.Element {
  return (
    <VStack gap={16} style={[styles.root, props.style]}>
      {props.accent ? <Box style={[styles.accent, { backgroundColor: props.accent }]} /> : null}
      {props.children}
    </VStack>
  );
}

function DiveSummaryCardHeader(props: DiveSummaryCardHeaderProps): React.JSX.Element {
  return (
    <HStack style={styles.header}>
      <VStack gap={4} style={styles.headerText}>
        {props.eyebrow ? <Text style={styles.eyebrow}>{props.eyebrow}</Text> : null}
        <Text style={styles.title}>{props.title}</Text>
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
    <HStack style={styles.metric}>
      <Text style={styles.metricLabel}>{props.label}</Text>
      <HStack gap={4} style={styles.metricValueGroup}>
        <Text style={styles.metricValue}>{props.value}</Text>
        {props.unit ? <Text style={styles.metricUnit}>{props.unit}</Text> : null}
      </HStack>
    </HStack>
  );
}

function DiveSummaryCardFooter(props: { children?: React.ReactNode }): React.JSX.Element {
  return <VStack style={styles.footer}>{props.children}</VStack>;
}

export const DiveSummaryCard = Object.assign(DiveSummaryCardRoot, {
  Header: DiveSummaryCardHeader,
  Body: DiveSummaryCardBody,
  Metric: DiveSummaryCardMetric,
  Footer: DiveSummaryCardFooter,
});

const styles = StyleSheet.create({
  root: {
    position: 'relative',
    overflow: 'hidden',
    padding: diveTheme.spacing.card,
    borderRadius: diveTheme.radii.card,
    backgroundColor: diveTheme.colors.surfaceContainer,
    borderWidth: 1,
    borderColor: diveTheme.colors.outline,
  },
  accent: {
    position: 'absolute',
    left: 0,
    top: 12,
    bottom: 12,
    width: 3,
    borderRadius: 999,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerText: {
    flex: 1,
  },
  eyebrow: {
    color: diveTheme.colors.mutedText,
    fontFamily: diveTheme.fonts.metric,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  title: {
    color: diveTheme.colors.text,
    fontSize: 22,
    fontWeight: '900',
  },
  metric: {
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 34,
    paddingVertical: 5,
  },
  metricLabel: {
    flex: 1,
    color: diveTheme.colors.mutedText,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  metricValueGroup: {
    alignItems: 'baseline',
  },
  metricValue: {
    color: diveTheme.colors.text,
    fontFamily: diveTheme.fonts.metric,
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'right',
  },
  metricUnit: {
    color: diveTheme.colors.mutedText,
    fontFamily: diveTheme.fonts.metric,
    fontSize: 13,
    fontWeight: '800',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: diveTheme.colors.outline,
    paddingTop: 14,
  },
});
