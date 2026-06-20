import React from 'react';
import type { WatchDepthSample } from '../../types/dive-session';
import { HStack, Text, VStack } from './primitives';

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
  const barClassName = props.kind === 'depth' ? 'bg-primary' : 'bg-secondary';

  return (
    <VStack gap={10} className="rounded-md border border-border bg-muted p-3">
      <Text className="font-mono text-xs font-extrabold uppercase text-muted-foreground">{props.title}</Text>
      <HStack gap={4} className="h-20 items-end">
        {values.map((value, index) => (
          <VStack key={`${props.title}-${index}`} className="flex-1 justify-end">
            <VStack className={`w-full rounded-md ${barClassName}`} style={{ height: Math.max(4, (value / maxValue) * 76) }} />
          </VStack>
        ))}
      </HStack>
    </VStack>
  );
}

function SessionProfileLegend(props: { label: string; value: string }): React.JSX.Element {
  return (
    <HStack className="justify-between">
      <Text className="text-sm font-bold text-muted-foreground">{props.label}</Text>
      <Text className="font-mono text-sm font-black text-foreground">{props.value}</Text>
    </HStack>
  );
}

export const SessionProfile = Object.assign(SessionProfileRoot, {
  Legend: SessionProfileLegend,
});
