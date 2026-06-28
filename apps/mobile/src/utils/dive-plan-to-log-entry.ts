import type { DiveLogEntry } from '../types/dive-log-entry';
import type { DivePlan } from '../types/dive-plan';
import { createBlankDiveLogEntry } from './create-dive-log-entry';

type DivePlanToDiveLogEntryDraftOptions = {
  localId?: string;
  now?: number;
};

export const divePlanToDiveLogEntryDraft = (
  plan: DivePlan,
  options: DivePlanToDiveLogEntryDraftOptions = {},
): DiveLogEntry => {
  const entry = createBlankDiveLogEntry(options);

  return {
    ...entry,
    manual: {
      ...entry.manual,
      title: plan.title,
      entryStyle: plan.entryStyle,
      site: {
        siteId: plan.site.siteId,
        name: plan.site.name,
      },
      buddyIds: [...plan.buddyIds],
      gearIds: [...plan.gearIds],
      tags: [...plan.tags],
      notes: buildPlanNotes(plan),
      measuredValues: {
        ...entry.manual.measuredValues,
        diveMode: plan.diveMode,
        gasLabel: plan.plannedValues.gasLabel,
        trainingFocus: plan.plannedValues.trainingFocus,
        pressure: plan.diveMode === 'scuba' ? plan.plannedValues.plannedPressure : undefined,
      },
    },
  };
};

export function buildPlanNotes(plan: DivePlan): string | undefined {
  const notes = [plan.objective, plan.plannedValues.trainingFocus, plan.notes]
    .map(value => value?.trim())
    .filter((value): value is string => Boolean(value));

  return notes.length ? notes.join('\n') : undefined;
}
