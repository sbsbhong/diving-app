import React from 'react';
import { SelectorPill } from '../../../components/ui/instrument';
import { HStack } from '../../../components/ui/hstack';
import { EditorField } from './editor-field';

type FixedOptionFieldProps = {
  label: string;
  value: string;
  testID: string;
};

export function FixedOptionField(props: FixedOptionFieldProps): React.JSX.Element {
  return (
    <EditorField label={props.label}>
      <HStack space="xs" className="rounded-full bg-muted p-1">
        <SelectorPill testID={props.testID} className="flex-1" label={props.value} selected onPress={() => undefined} />
      </HStack>
    </EditorField>
  );
}
