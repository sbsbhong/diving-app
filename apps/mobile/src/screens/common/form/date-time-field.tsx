import DateTimePickerNative, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React from 'react';
import { Platform } from 'react-native';
import { Input, InputField } from '../../../components/ui/input';
import { EditorField } from './editor-field';

type DateTimeFieldProps = {
  label: string;
  value?: Date;
  onChange: (value: Date | undefined) => void;
  required?: boolean;
  error?: string;
  testID: string;
};

export function DateTimeField(props: DateTimeFieldProps): React.JSX.Element {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleChange = React.useCallback(
    (event: DateTimePickerEvent, selectedDate?: Date) => {
      if (Platform.OS !== 'ios') {
        setIsOpen(false);
      }

      if (event.type === 'dismissed') {
        return;
      }

      if (selectedDate) {
        props.onChange(selectedDate);
      }
    },
    [props],
  );

  return (
    <EditorField
      label={props.label}
      required={props.required}
      error={props.error}
      errorTestID={`${props.testID}-error`}
    >
      <Input className="h-11 rounded-xl bg-background" onTouchEnd={() => setIsOpen(true)}>
        <InputField
          testID={props.testID}
          value={props.value ? formatDateTime(props.value) : ''}
          editable={false}
          onFocus={() => setIsOpen(true)}
          onChange={props.onChange as never}
        />
      </Input>
      {isOpen ? (
        <DateTimePickerNative
          value={props.value ?? new Date()}
          mode="datetime"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
        />
      ) : null}
    </EditorField>
  );
}

export function formatDateTime(value: Date): string {
  const pad = (input: number) => `${input}`.padStart(2, '0');

  return [
    `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`,
    `${pad(value.getHours())}:${pad(value.getMinutes())}`,
  ].join(' ');
}
