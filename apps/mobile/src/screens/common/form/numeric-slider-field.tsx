import React from 'react';
import { Box } from '../../../components/ui/box';
import { Button, ButtonIcon, ButtonText } from '../../../components/ui/button';
import { HStack } from '../../../components/ui/hstack';
import { ChevronDownIcon, ChevronUpIcon } from '../../../components/ui/icon';
import { Pressable } from '../../../components/ui/pressable';
import { ScrollView } from '../../../components/ui/scroll-view';
import { Text } from '../../../components/ui/text';
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
  const [isOpen, setIsOpen] = React.useState(false);
  const options = React.useMemo(() => makeNumberOptions(props.min, props.max, props.step), [props.max, props.min, props.step]);
  const selectedValue = props.value === undefined ? undefined : roundToStep(clamp(props.value, props.min, props.max), props.step);
  const displayValue = selectedValue === undefined ? props.placeholder ?? '선택' : formatNumber(selectedValue, props.step);

  const adjust = React.useCallback(
    (direction: -1 | 1) => {
      const nextBaseValue = selectedValue ?? props.min;
      props.onChange(clamp(roundToStep(nextBaseValue + props.step * direction, props.step), props.min, props.max));
    },
    [props, selectedValue],
  );

  return (
    <EditorField
      label={props.label}
      required={props.required}
      error={props.error}
      errorTestID={`${props.testID}-error`}
      className={props.className}
    >
      <VStack space="sm">
        <Pressable
          testID={props.testID}
          accessibilityRole="button"
          accessibilityLabel={props.label}
          onPress={() => setIsOpen(currentValue => !currentValue)}
        >
          <HStack className="min-h-12 items-center rounded-xl border border-border bg-card px-3 py-2" space="sm">
            <Button
              testID={`${props.testID}-decrement`}
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-full bg-primary/10"
              onPress={() => adjust(-1)}
            >
              <ButtonIcon as={ChevronDownIcon} className="text-primary" />
            </Button>
            <Box className="flex-1 items-center">
              <Text testID={`${props.testID}-value`} className="text-xl font-semibold text-foreground">
                {displayValue}
              </Text>
            </Box>
            <Button
              testID={`${props.testID}-increment`}
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-full bg-primary/10"
              onPress={() => adjust(1)}
            >
              <ButtonIcon as={ChevronUpIcon} className="text-primary" />
            </Button>
          </HStack>
        </Pressable>
        {isOpen ? (
          <Box testID={`${props.testID}-wheel`} className="rounded-xl border border-border bg-card py-2">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="px-2">
              <HStack space="xs">
                {options.map(option => {
                  const isSelected = selectedValue === option;

                  return (
                    <Button
                      key={option}
                      testID={`${props.testID}-option-${numberOptionToken(option)}`}
                      variant="ghost"
                      className={isSelected ? 'min-h-10 rounded-full bg-primary/10 px-4' : 'min-h-10 rounded-full bg-muted px-4'}
                      onPress={() => {
                        props.onChange(option);
                        setIsOpen(false);
                      }}
                    >
                      <ButtonText className={isSelected ? 'text-primary' : 'text-muted-foreground'}>
                        {formatNumber(option, props.step)}
                      </ButtonText>
                    </Button>
                  );
                })}
              </HStack>
            </ScrollView>
          </Box>
        ) : (
          <Box testID={`${props.testID}-wheel`} className="hidden" />
        )}
      </VStack>
    </EditorField>
  );
}

function makeNumberOptions(min: number, max: number, step: number): number[] {
  const safeStep = step > 0 ? step : 1;
  const count = Math.floor((max - min) / safeStep);
  const options: number[] = [];

  for (let index = 0; index <= count; index += 1) {
    options.push(roundToStep(min + safeStep * index, safeStep));
  }

  const roundedMax = roundToStep(max, safeStep);
  if (options[options.length - 1] !== roundedMax) {
    options.push(roundedMax);
  }

  return options;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function roundToStep(value: number, step: number): number {
  if (step <= 0) {
    return value;
  }

  const precision = getStepPrecision(step);
  return Number((Math.round(value / step) * step).toFixed(precision));
}

function formatNumber(value: number, step: number): string {
  const precision = getStepPrecision(step);
  return value.toFixed(precision).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
}

function getStepPrecision(step: number): number {
  const decimalPart = `${step}`.split('.')[1];
  return decimalPart?.length ?? 0;
}

function numberOptionToken(value: number): string {
  return `${value}`.replace('.', '_');
}
