import React from 'react';
import { Button, ButtonText } from '../../../components/ui/button';
import { HStack } from '../../../components/ui/hstack';
import { Input, InputField } from '../../../components/ui/input';
import { Text } from '../../../components/ui/text';
import { VStack } from '../../../components/ui/vstack';
import { EditorField } from './editor-field';

type BadgeListFieldProps = {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  required?: boolean;
  error?: string;
  inputTestID: string;
  badgeTestIDPrefix: string;
  placeholder?: string;
  className?: string;
};

export function BadgeListField(props: BadgeListFieldProps): React.JSX.Element {
  const [pendingValue, setPendingValue] = React.useState('');

  const commitTokens = React.useCallback(
    (tokens: string[]) => {
      const nextValues = [...props.values];

      for (const token of tokens) {
        const normalizedToken = token.trim();
        if (normalizedToken.length && !nextValues.includes(normalizedToken)) {
          nextValues.push(normalizedToken);
        }
      }

      props.onChange(nextValues);
    },
    [props],
  );

  const handleChangeText = React.useCallback(
    (text: string) => {
      if (!text.includes(',')) {
        setPendingValue(text);
        return;
      }

      const parts = text.split(',');
      commitTokens(parts.slice(0, -1));
      setPendingValue(parts[parts.length - 1] ?? '');
    },
    [commitTokens],
  );

  const handleSubmitEditing = React.useCallback(() => {
    commitTokens([pendingValue]);
    setPendingValue('');
  }, [commitTokens, pendingValue]);

  const removeValue = React.useCallback(
    (value: string) => {
      props.onChange(props.values.filter(currentValue => currentValue !== value));
    },
    [props],
  );

  return (
    <EditorField
      label={props.label}
      required={props.required}
      error={props.error}
      errorTestID={`${props.inputTestID}-error`}
      className={props.className}
    >
      <VStack space="sm">
        {props.values.length ? (
          <HStack space="xs" className="flex-wrap">
            {props.values.map(value => (
              <HStack
                key={value}
                testID={`${props.badgeTestIDPrefix}-badge-${value}`}
                space="xs"
                className="mr-1 items-center rounded-full border border-border bg-background px-2 py-1"
              >
                <Text className="text-xs font-semibold text-card-foreground">{value}</Text>
                <Button
                  testID={`${props.badgeTestIDPrefix}-remove-${value}`}
                  size="icon"
                  variant="ghost"
                  className="ml-1 min-h-4 min-w-4 p-0"
                  onPress={() => removeValue(value)}
                >
                  <ButtonText className="text-xs text-muted-foreground">x</ButtonText>
                </Button>
              </HStack>
            ))}
          </HStack>
        ) : null}
        <Input className="h-11 rounded-xl bg-background">
          <InputField
            testID={props.inputTestID}
            value={pendingValue}
            onChangeText={handleChangeText}
            onSubmitEditing={handleSubmitEditing}
            placeholder={props.placeholder}
          />
        </Input>
      </VStack>
    </EditorField>
  );
}
