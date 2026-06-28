import React from 'react';
import { SelectorPill } from '../../../components/ui/instrument';
import { HStack } from '../../../components/ui/hstack';
import type { DivePressureUnit, DivePressureValues } from '../../../types/dive-log-entry';
import { EditorField } from './editor-field';
import { NumericSliderField } from './numeric-slider-field';

type PressureFieldErrors = {
  unit?: string;
  start?: string;
  end?: string;
};

type PressureFieldsProps = {
  unit?: DivePressureUnit;
  start?: number;
  end?: number;
  onChange: (value: DivePressureValues) => void;
  errors?: PressureFieldErrors;
  testIDPrefix: string;
  labels: {
    unit: string;
    start: string;
    end: string;
  };
};

export function PressureFields(props: PressureFieldsProps): React.JSX.Element {
  const unit = props.unit ?? 'bar';
  const range = getPressureRange(unit);

  const update = React.useCallback(
    (nextValue: Partial<DivePressureValues>) => {
      props.onChange({ unit, start: props.start, end: props.end, ...nextValue });
    },
    [props, unit],
  );

  return (
    <>
      <EditorField label={props.labels.unit} error={props.errors?.unit} errorTestID={`${props.testIDPrefix}-unit-error`}>
        <HStack space="xs" className="rounded-full bg-muted p-1">
          {(['bar', 'psi'] as const).map(nextUnit => (
            <SelectorPill
              key={nextUnit}
              testID={`${props.testIDPrefix}-unit-${nextUnit}`}
              className="flex-1"
              label={nextUnit}
              selected={unit === nextUnit}
              onPress={() => update({ unit: nextUnit })}
            />
          ))}
        </HStack>
      </EditorField>
      <HStack space="md">
        <NumericSliderField
          className="flex-1"
          label={props.labels.start}
          value={props.start}
          onChange={value => update({ start: value })}
          min={range.min}
          max={range.max}
          step={range.step}
          unitLabel={unit}
          valueType="int"
          error={props.errors?.start}
          testID={`${props.testIDPrefix}-start`}
        />
        <NumericSliderField
          className="flex-1"
          label={props.labels.end}
          value={props.end}
          onChange={value => update({ end: value })}
          min={range.min}
          max={range.max}
          step={range.step}
          unitLabel={unit}
          valueType="int"
          error={props.errors?.end}
          testID={`${props.testIDPrefix}-end`}
        />
      </HStack>
    </>
  );
}

function getPressureRange(unit: DivePressureUnit): { min: number; max: number; step: number } {
  return unit === 'psi' ? { min: 0, max: 4500, step: 50 } : { min: 0, max: 300, step: 1 };
}
