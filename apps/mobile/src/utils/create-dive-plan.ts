import type { DivePlan, DivePlanChecklistItem } from '../types/dive-plan';

type CreateBlankDivePlanOptions = {
  localId?: string;
  now?: number;
};

export const createBlankDivePlan = (options: CreateBlankDivePlanOptions = {}): DivePlan => {
  const timestamp = options.now ?? Date.now() / 1000;
  const localId = options.localId ?? createLocalDivePlanId(timestamp);

  return {
    localId,
    status: 'draft',
    createdAt: timestamp,
    updatedAt: timestamp,
    site: {},
    buddyIds: [],
    gearIds: [],
    tags: [],
    plannedValues: {},
    checklistItems: createDefaultPlanChecklist(),
  };
};

export const createDefaultPlanChecklist = (): DivePlanChecklistItem[] => [
  { id: 'site', label: 'Review site conditions', completed: false },
  { id: 'buddy', label: 'Confirm buddy or observer', completed: false },
  { id: 'gear', label: 'Check gear list', completed: false },
];

const createLocalDivePlanId = (timestamp: number) => {
  return `plan:${Math.round(timestamp * 1000).toString(36)}:${Math.random().toString(36).slice(2, 10)}`;
};
