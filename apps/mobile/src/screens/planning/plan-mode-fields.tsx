import React from 'react';
import { useTranslation } from 'react-i18next';
import { SelectorPill } from '../../components/ui/instrument';
import { HStack } from '../../components/ui/hstack';
import { Input, InputField } from '../../components/ui/input';
import { Text } from '../../components/ui/text';
import { VStack } from '../../components/ui/vstack';
import type { WatchSession } from '../../types/dive-session';
import { EditorField, type PlanEditorState } from './plan-editor';

type PlanModeFieldsProps = {
  draft: PlanEditorState;
  diveMode: NonNullable<WatchSession['diveMode']>;
  setValue: (key: keyof PlanEditorState, value: string) => void;
};

const waterConditionOptions: NonNullable<WatchSession['waterCondition']>[] = ['calm', 'mild', 'choppy', 'surge', 'current', 'unknown'];

export function PlanModeFields(props: PlanModeFieldsProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <ModeSection title={t(`planning.${props.diveMode}Section`, { defaultValue: `${props.diveMode} plan details` })}>
      <HStack space="md">
        <EditorField className="flex-1" label={t('planning.plannedMaxDepthMeters', { defaultValue: 'Planned max (m)' })}>
          <Input className="h-11 rounded-xl bg-background">
            <InputField
              testID="planning-editor-planned-max-depth"
              value={props.draft.plannedMaxDepth}
              onChangeText={value => props.setValue('plannedMaxDepth', value)}
              keyboardType="numeric"
              placeholder="18"
            />
          </Input>
        </EditorField>
        <EditorField className="flex-1" label={t('planning.plannedDurationMinutes', { defaultValue: 'Planned duration (min)' })}>
          <Input className="h-11 rounded-xl bg-background">
            <InputField
              testID="planning-editor-planned-duration"
              value={props.draft.plannedDuration}
              onChangeText={value => props.setValue('plannedDuration', value)}
              keyboardType="numeric"
              placeholder="45"
            />
          </Input>
        </EditorField>
      </HStack>
      {props.diveMode === 'scuba' ? (
        <EditorField label={t('planning.gasLabel', { defaultValue: 'Gas label' })}>
          <Input className="h-11 rounded-xl bg-background">
            <InputField
              testID="planning-editor-gas-label"
              value={props.draft.gasLabel}
              onChangeText={value => props.setValue('gasLabel', value)}
              placeholder="Air"
            />
          </Input>
        </EditorField>
      ) : null}
      {props.diveMode === 'freedive' ? (
        <HStack space="md">
          <EditorField className="flex-1" label={t('planning.repetitionTarget', { defaultValue: 'Repetition target' })}>
            <Input className="h-11 rounded-xl bg-background">
              <InputField
                testID="planning-editor-repetition-target"
                value={props.draft.repetitionTarget}
                onChangeText={value => props.setValue('repetitionTarget', value)}
                keyboardType="numeric"
                placeholder="8"
              />
            </Input>
          </EditorField>
          <EditorField className="flex-1" label={t('planning.perceivedDifficulty', { defaultValue: 'Difficulty' })}>
            <Input className="h-11 rounded-xl bg-background">
              <InputField
                testID="planning-editor-perceived-difficulty"
                value={props.draft.perceivedDifficulty}
                onChangeText={value => props.setValue('perceivedDifficulty', value)}
                keyboardType="numeric"
                placeholder="3"
              />
            </Input>
          </EditorField>
        </HStack>
      ) : null}
      <WaterConditionPicker value={props.draft.waterCondition} onChange={value => props.setValue('waterCondition', value)} />
      <EditorField label={t('planning.visibilityExpectation', { defaultValue: 'Visibility expectation' })}>
        <Input className="h-11 rounded-xl bg-background">
          <InputField
            testID="planning-editor-visibility-expectation"
            value={props.draft.visibilityExpectation}
            onChangeText={value => props.setValue('visibilityExpectation', value)}
            keyboardType="numeric"
            placeholder="4"
          />
        </Input>
      </EditorField>
      <EditorField label={t('planning.trainingFocus', { defaultValue: 'Training focus' })}>
        <Input className="h-11 rounded-xl bg-background">
          <InputField
            testID="planning-editor-training-focus"
            value={props.draft.trainingFocus}
            onChangeText={value => props.setValue('trainingFocus', value)}
            placeholder={t('planning.trainingFocusPlaceholder', { defaultValue: 'e.g. buoyancy check' })}
          />
        </Input>
      </EditorField>
    </ModeSection>
  );
}

function ModeSection(props: { title: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <VStack space="sm" className="rounded-2xl bg-muted px-4 py-4">
      <Text className="text-xs font-semibold uppercase text-muted-foreground">{props.title}</Text>
      {props.children}
    </VStack>
  );
}

function WaterConditionPicker(props: { value: string; onChange: (value: string) => void }): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <EditorField label={t('planning.waterCondition', { defaultValue: 'Water condition' })}>
      <HStack space="xs">
        {waterConditionOptions.slice(0, 3).map(condition => (
          <SelectorPill
            key={condition}
            testID={`planning-editor-water-condition-${condition}`}
            className="flex-1"
            label={condition}
            selected={props.value === condition}
            onPress={() => props.onChange(condition)}
          />
        ))}
      </HStack>
    </EditorField>
  );
}
