import CommunitySlider from '@react-native-community/slider';
import React from 'react';
import { Input, InputField } from '../../../components/ui/input';
import { VStack } from '../../../components/ui/vstack';
import { EditorField } from './editor-field';

type NumericSliderFieldProps = {
  label: string;
  value?: number;
  onChange: (value: number | undefined) => void;
  min: number;
  max: number;
  step: number;
  required?: boolean;
  error?: string;
  testID: string;
  placeholder?: string;
  className?: string;
};

export function NumericSliderField(props: NumericSliderFieldProps): React.JSX.Element {
  const inputValue = props.value === undefined ? '' : `${props.value}`;
  const sliderValue = clamp(props.value ?? props.min, props.min, props.max);

  return (
    <EditorField
      label={props.label}
      required={props.required}
      error={props.error}
      errorTestID={`${props.testID}-error`}
      className={props.className}
    >
      <VStack space="sm">
        <Input className="h-11 rounded-xl bg-background">
          <InputField
            testID={props.testID}
            value={inputValue}
            onChangeText={text => props.onChange(textToNumber(text))}
            keyboardType="numeric"
            placeholder={props.placeholder}
          />
        </Input>
        <CommunitySlider
          testID={`${props.testID}-slider`}
          value={sliderValue}
          minimumValue={props.min}
          maximumValue={props.max}
          step={props.step}
          onValueChange={nextValue => props.onChange(roundToStep(nextValue, props.step))}
        />
      </VStack>
    </EditorField>
  );
}

function textToNumber(value: string): number | undefined {
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return undefined;
  }

  const parsedValue = Number(trimmedValue);
  return Number.isFinite(parsedValue) ? parsedValue : undefined;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function roundToStep(value: number, step: number): number {
  if (step <= 0) {
    return value;
  }

  return Math.round(value / step) * step;
}
