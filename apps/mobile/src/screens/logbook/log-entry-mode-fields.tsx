import React from 'react';
import { useTranslation } from 'react-i18next';
import { SelectorPill } from '../../components/ui/instrument';
import { HStack } from '../../components/ui/hstack';
import { Input, InputField } from '../../components/ui/input';
import { Text } from '../../components/ui/text';
import { VStack } from '../../components/ui/vstack';
import type { WatchSession } from '../../types/dive-session';

export type LogEntryEditorState = {
  startedAt: string;
  diveMode: WatchSession['diveMode'] | undefined;
  siteName: string;
  duration: string;
  maxDepth: string;
  gasLabel: string;
  gearIds: string;
  waterCondition: string;
  visibilityRating: string;
  perceivedExertion: string;
  repetitionCount: string;
  trainingFocus: string;
  poolLength: string;
  lapCount: string;
  buddies: string;
  tags: string;
  observedMarineLife: string;
  notes: string;
  rating: string;
};

type ModeSpecificFieldsProps = {
  draft: LogEntryEditorState;
  diveMode: NonNullable<WatchSession['diveMode']>;
  setValue: (key: keyof LogEntryEditorState, value: string) => void;
};

const waterConditionOptions: NonNullable<WatchSession['waterCondition']>[] = ['calm', 'mild', 'choppy', 'surge', 'current', 'unknown'];

export function EditorField(props: { label: string; children: React.ReactNode; className?: string }): React.JSX.Element {
  return (
    <VStack space="xs" className={props.className}>
      <Text className="text-xs font-semibold uppercase text-muted-foreground">{props.label}</Text>
      {props.children}
    </VStack>
  );
}

export function ModeSpecificFields(props: ModeSpecificFieldsProps): React.JSX.Element | null {
  const { t } = useTranslation();

  if (props.diveMode === 'scuba') {
    return (
      <ModeSection title={t('logbook.scubaSection')}>
        <EditorField label={t('logbook.gasLabel')}>
          <Input className="h-11 rounded-xl bg-background">
            <InputField
              testID="log-entry-editor-gas-label"
              value={props.draft.gasLabel}
              onChangeText={value => props.setValue('gasLabel', value)}
              placeholder="Air"
            />
          </Input>
        </EditorField>
        <EditorField label={t('logbook.gear')}>
          <Input className="h-11 rounded-xl bg-background">
            <InputField
              testID="log-entry-editor-gear"
              value={props.draft.gearIds}
              onChangeText={value => props.setValue('gearIds', value)}
              placeholder={t('logbook.commaSeparatedPlaceholder')}
            />
          </Input>
        </EditorField>
        <WaterConditionPicker value={props.draft.waterCondition} onChange={value => props.setValue('waterCondition', value)} />
        <HStack space="md">
          <EditorField className="flex-1" label={t('logbook.visibilityRating')}>
            <Input className="h-11 rounded-xl bg-background">
              <InputField
                testID="log-entry-editor-visibility-rating"
                value={props.draft.visibilityRating}
                onChangeText={value => props.setValue('visibilityRating', value)}
                keyboardType="numeric"
                placeholder="4"
              />
            </Input>
          </EditorField>
        </HStack>
        <EditorField label={t('logbook.perceivedExertion')}>
          <Input className="h-11 rounded-xl bg-background">
            <InputField
              testID="log-entry-editor-perceived-exertion"
              value={props.draft.perceivedExertion}
              onChangeText={value => props.setValue('perceivedExertion', value)}
              keyboardType="numeric"
              placeholder="3"
            />
          </Input>
        </EditorField>
      </ModeSection>
    );
  }

  if (props.diveMode === 'freedive') {
    return (
      <ModeSection title={t('logbook.freediveSection')}>
        <HStack space="md">
          <EditorField className="flex-1" label={t('logbook.repetitionCount')}>
            <Input className="h-11 rounded-xl bg-background">
              <InputField
                testID="log-entry-editor-repetition-count"
                value={props.draft.repetitionCount}
                onChangeText={value => props.setValue('repetitionCount', value)}
                keyboardType="numeric"
                placeholder="8"
              />
            </Input>
          </EditorField>
          <EditorField className="flex-1" label={t('logbook.perceivedExertion')}>
            <Input className="h-11 rounded-xl bg-background">
              <InputField
                testID="log-entry-editor-perceived-exertion"
                value={props.draft.perceivedExertion}
                onChangeText={value => props.setValue('perceivedExertion', value)}
                keyboardType="numeric"
                placeholder="3"
              />
            </Input>
          </EditorField>
        </HStack>
        <EditorField label={t('logbook.trainingFocus')}>
          <Input className="h-11 rounded-xl bg-background">
            <InputField
              testID="log-entry-editor-training-focus"
              value={props.draft.trainingFocus}
              onChangeText={value => props.setValue('trainingFocus', value)}
              placeholder={t('logbook.trainingFocusPlaceholder')}
            />
          </Input>
        </EditorField>
      </ModeSection>
    );
  }

  if (props.diveMode === 'snorkel') {
    return (
      <ModeSection title={t('logbook.snorkelSection')}>
        <WaterConditionPicker value={props.draft.waterCondition} onChange={value => props.setValue('waterCondition', value)} />
        <HStack space="md">
          <EditorField className="flex-1" label={t('logbook.visibilityRating')}>
            <Input className="h-11 rounded-xl bg-background">
              <InputField
                testID="log-entry-editor-visibility-rating"
                value={props.draft.visibilityRating}
                onChangeText={value => props.setValue('visibilityRating', value)}
                keyboardType="numeric"
                placeholder="4"
              />
            </Input>
          </EditorField>
        </HStack>
      </ModeSection>
    );
  }

  if (props.diveMode === 'pool') {
    return (
      <ModeSection title={t('logbook.poolSection')}>
        <HStack space="md">
          <EditorField className="flex-1" label={t('logbook.poolLengthMeters')}>
            <Input className="h-11 rounded-xl bg-background">
              <InputField
                testID="log-entry-editor-pool-length"
                value={props.draft.poolLength}
                onChangeText={value => props.setValue('poolLength', value)}
                keyboardType="numeric"
                placeholder="25"
              />
            </Input>
          </EditorField>
          <EditorField className="flex-1" label={t('logbook.lapCount')}>
            <Input className="h-11 rounded-xl bg-background">
              <InputField
                testID="log-entry-editor-lap-count"
                value={props.draft.lapCount}
                onChangeText={value => props.setValue('lapCount', value)}
                keyboardType="numeric"
                placeholder="20"
              />
            </Input>
          </EditorField>
        </HStack>
        <EditorField label={t('logbook.trainingFocus')}>
          <Input className="h-11 rounded-xl bg-background">
            <InputField
              testID="log-entry-editor-training-focus"
              value={props.draft.trainingFocus}
              onChangeText={value => props.setValue('trainingFocus', value)}
              placeholder={t('logbook.trainingFocusPlaceholder')}
            />
          </Input>
        </EditorField>
      </ModeSection>
    );
  }

  return null;
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
    <EditorField label={t('logbook.waterCondition')}>
      <VStack space="xs">
        <HStack space="xs">
          {waterConditionOptions.slice(0, 3).map(condition => (
            <SelectorPill
              key={condition}
              testID={`log-entry-editor-water-condition-${condition}`}
              className="flex-1"
              label={condition}
              selected={props.value === condition}
              onPress={() => props.onChange(condition)}
            />
          ))}
        </HStack>
        <HStack space="xs">
          {waterConditionOptions.slice(3).map(condition => (
            <SelectorPill
              key={condition}
              testID={`log-entry-editor-water-condition-${condition}`}
              className="flex-1"
              label={condition}
              selected={props.value === condition}
              onPress={() => props.onChange(condition)}
            />
          ))}
        </HStack>
      </VStack>
    </EditorField>
  );
}
