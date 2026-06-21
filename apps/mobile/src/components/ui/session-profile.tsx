import React from 'react';
import type { WatchDepthSample } from '../../types/dive-session';
import { HStack } from './hstack';
import { Text } from './text';
import { VStack } from './vstack';

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
  const barClassName = props.kind === 'depth' ? 'bg-primary' : 'bg-primary/70';

  return (
    <VStack space="md" className="rounded-2xl bg-muted px-4 py-4">
      <Text className="text-xs font-semibold uppercase text-muted-foreground">{props.title}</Text>
      <HStack space="xs" className="h-24 items-end">
        {values.map((value, index) => (
          <VStack key={`${props.title}-${index}`} className="flex-1 justify-end">
            <VStack className={`w-full rounded-sm ${barClassName}`} style={{ height: Math.max(4, (value / maxValue) * 88) }} />
          </VStack>
        ))}
      </HStack>
    </VStack>
  );
}

function SessionProfileLegend(props: { label: string; value: string }): React.JSX.Element {
  return (
    <HStack className="justify-between">
      <Text className="text-sm font-semibold text-muted-foreground">{props.label}</Text>
      <Text className="text-sm font-semibold text-foreground">{props.value}</Text>
    </HStack>
  );
}

export const SessionProfile = Object.assign(SessionProfileRoot, {
  Legend: SessionProfileLegend,
});
