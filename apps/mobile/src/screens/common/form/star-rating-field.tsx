import React from 'react';
import { Button, ButtonText } from '../../../components/ui/button';
import { HStack } from '../../../components/ui/hstack';
import { EditorField } from './editor-field';

type StarRatingFieldProps = {
  label: string;
  value?: number;
  onChange: (value: number | undefined) => void;
  required?: boolean;
  error?: string;
  testID: string;
};

export function StarRatingField(props: StarRatingFieldProps): React.JSX.Element {
  return (
    <EditorField
      label={props.label}
      required={props.required}
      error={props.error}
      errorTestID={`${props.testID}-error`}
    >
      <HStack space="xs">
        {[1, 2, 3, 4, 5].map(rating => {
          const selected = props.value !== undefined && rating <= props.value;

          return (
            <Button
              key={rating}
              testID={`${props.testID}-star-${rating}`}
              size="icon"
              variant="ghost"
              className={selected ? 'bg-primary/10' : 'bg-muted'}
              onPress={() => props.onChange(props.value === rating ? undefined : rating)}
            >
              <ButtonText className={selected ? 'text-primary' : 'text-muted-foreground'}>
                {selected ? '★' : '☆'}
              </ButtonText>
            </Button>
          );
        })}
      </HStack>
    </EditorField>
  );
}
