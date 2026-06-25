import type { DiveLogEntry } from '../types/dive-log-entry';
import type { WatchSession } from '../types/dive-session';
import type { DivePlan } from '../types/dive-plan';
import { buildPlanNotes } from './dive-plan-to-log-entry';
import { firstNonBlankText } from './notes';

export function getWatchSessionSourcePlanLocalId(session: Pick<WatchSession, 'sourcePlanLocalId' | 'tags'>): string | undefined {
  const directId = session.sourcePlanLocalId?.trim();

  if (directId) {
    return directId;
  }

  return session.tags?.find(tag => tag.startsWith('plan-'))?.slice('plan-'.length);
}

export function enrichWatchLogWithSourcePlan(entry: DiveLogEntry, plan: DivePlan): DiveLogEntry {
  const planNotes = buildPlanNotes(plan);
  const notes = mergeNotes(planNotes, entry.manual.notes, entry.watchCapture?.session.notes);

  return {
    ...entry,
    manual: {
      ...entry.manual,
      title: firstNonBlankText(plan.title, entry.manual.title, entry.watchCapture?.session.planTitle),
      entryStyle: plan.entryStyle ?? entry.manual.entryStyle,
      site: {
        siteId: firstNonBlankText(plan.site.siteId, entry.manual.site.siteId),
        name: firstNonBlankText(plan.site.name, entry.manual.site.name, entry.watchCapture?.session.siteName),
      },
      buddyIds: mergeUnique(plan.buddyIds, entry.manual.buddyIds),
      gearIds: mergeUnique(plan.gearIds, entry.manual.gearIds),
      tags: mergeUnique(plan.tags, entry.manual.tags),
      notes,
      measuredValues: {
        ...entry.manual.measuredValues,
        diveMode: plan.diveMode ?? entry.manual.measuredValues.diveMode,
        gasLabel: firstNonBlankText(plan.plannedValues.gasLabel, entry.manual.measuredValues.gasLabel),
        waterCondition: plan.plannedValues.waterCondition ?? entry.manual.measuredValues.waterCondition,
        visibilityRating: plan.plannedValues.visibilityExpectation ?? entry.manual.measuredValues.visibilityRating,
        perceivedExertion: plan.plannedValues.perceivedDifficulty ?? entry.manual.measuredValues.perceivedExertion,
        trainingFocus: firstNonBlankText(plan.plannedValues.trainingFocus, entry.manual.measuredValues.trainingFocus),
        repetitionCount: plan.plannedValues.repetitionTarget ?? entry.manual.measuredValues.repetitionCount,
        poolLengthMeters: plan.plannedValues.poolLengthMeters ?? entry.manual.measuredValues.poolLengthMeters,
        lapCount: plan.plannedValues.lapTarget ?? entry.manual.measuredValues.lapCount,
      },
    },
  };
}

function mergeNotes(...values: Array<string | undefined>): string | undefined {
  const uniqueNotes = mergeUnique(
    values
      .map(value => value?.trim())
      .filter((value): value is string => Boolean(value)),
  );

  return uniqueNotes.length ? uniqueNotes.join('\n') : undefined;
}

function mergeUnique(...groups: string[][]): string[] {
  const seenValues = new Set<string>();
  const mergedValues: string[] = [];

  for (const value of groups.flat()) {
    const trimmedValue = value.trim();

    if (!trimmedValue || seenValues.has(trimmedValue)) {
      continue;
    }

    seenValues.add(trimmedValue);
    mergedValues.push(trimmedValue);
  }

  return mergedValues;
}
