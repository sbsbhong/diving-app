import React from 'react';
import { HStack } from '../../../components/ui/hstack';
import { Text } from '../../../components/ui/text';
import { VStack } from '../../../components/ui/vstack';

type EditorFieldProps = {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
  errorTestID?: string;
};

export function EditorField(props: EditorFieldProps): React.JSX.Element {
  return (
    <VStack space="xs" className={props.className}>
      <HStack space="xs" className="items-center">
        <Text className="text-xs font-semibold uppercase text-muted-foreground">{props.label}</Text>
        {props.required ? (
          <Text className="text-xs font-semibold text-destructive">*</Text>
        ) : null}
      </HStack>
      {props.children}
      {props.error ? (
        <Text testID={props.errorTestID} className="text-xs font-semibold text-destructive">
          {props.error}
        </Text>
      ) : null}
    </VStack>
  );
}
