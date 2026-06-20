import React from 'react';
import { StyleSheet } from 'react-native';
import type { WatchDepthSample } from '../../types/dive-session';
import { HStack, Text, VStack } from './primitives';
import { diveTheme } from './theme';

type SessionProfileProps = {
  samples: WatchDepthSample[];
  title: string;
  kind: 'depth' | 'temperature';
};

function SessionProfileRoot(props: SessionProfileProps): React.JSX.Element {
  const values = props.samples.map(sample =>
    props.kind === 'depth' ? sample.depthMeters : sample.waterTemperatureCelsius ?? 0,
  );
  const maxValue = Math.max(...values, 1);
  const color = props.kind === 'depth' ? diveTheme.colors.primary : diveTheme.colors.secondary;

  return (
    <VStack gap={10} style={styles.root}>
      <Text style={styles.title}>{props.title.toUpperCase()}</Text>
      <HStack gap={4} style={styles.chart}>
        {values.map((value, index) => (
          <VStack key={`${props.title}-${index}`} style={styles.barSlot}>
            <VStack style={[styles.bar, { backgroundColor: color, height: Math.max(4, (value / maxValue) * 76) }]} />
          </VStack>
        ))}
      </HStack>
    </VStack>
  );
}

function SessionProfileLegend(props: { label: string; value: string }): React.JSX.Element {
  return (
    <HStack style={styles.legend}>
      <Text style={styles.legendLabel}>{props.label}</Text>
      <Text style={styles.legendValue}>{props.value}</Text>
    </HStack>
  );
}

export const SessionProfile = Object.assign(SessionProfileRoot, {
  Legend: SessionProfileLegend,
});

const styles = StyleSheet.create({
  root: {
    borderWidth: 1,
    borderColor: diveTheme.colors.outline,
    borderRadius: diveTheme.radii.control,
    backgroundColor: diveTheme.colors.surfaceRaised,
    padding: 12,
  },
  title: {
    color: diveTheme.colors.mutedText,
    fontFamily: diveTheme.fonts.metric,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  chart: {
    alignItems: 'flex-end',
    height: 84,
  },
  barSlot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: 8,
    opacity: 0.92,
  },
  legend: {
    justifyContent: 'space-between',
  },
  legendLabel: {
    color: diveTheme.colors.mutedText,
    fontSize: 13,
    fontWeight: '700',
  },
  legendValue: {
    color: diveTheme.colors.text,
    fontFamily: diveTheme.fonts.metric,
    fontSize: 13,
    fontWeight: '900',
  },
});
