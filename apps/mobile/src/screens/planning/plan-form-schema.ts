import { z } from 'zod';
import type { DiveEntryStyle, DivePlan, DivePlanStatus, DivePlanValues } from '../../types/dive-plan';
import type { DivePressureValues } from '../../types/dive-log-entry';
import type { WatchSession } from '../../types/dive-session';

export type PlanFormValues = {
  title?: string;
  plannedAt: Date | undefined;
  diveMode: NonNullable<WatchSession['diveMode']>;
  entryStyle?: DiveEntryStyle;
  siteName: string;
  buddies: string[];
  gearIds: string[];
  tags: string[];
  objective?: string;
  notes?: string;
  plannedMaxDepthMeters: number | undefined;
  plannedDurationMinutes: number | undefined;
  gasLabel?: 'Air';
  waterCondition?: WatchSession['waterCondition'];
  visibilityExpectation?: number;
  perceivedDifficulty?: number;
  trainingFocus?: string;
  repetitionTarget?: number;
  plannedPressure: DivePressureValues;
};

const waterConditions = ['calm', 'mild', 'choppy', 'surge', 'current', 'unknown'] as const;

const requiredNumber = (messages: NumberValidationMessages, max: number) =>
  z.union([z.number(), z.undefined()]).superRefine((value, context) => {
    if (value === undefined) {
      context.addIssue({ code: 'custom', message: messages.required });
      return;
    }

    addNumberIssues(value, context, messages, max);
  });

const optionalInteger = (messages: NumberValidationMessages, max: number) =>
  z.union([z.number(), z.undefined()]).superRefine((value, context) => {
    if (value === undefined) {
      return;
    }

    addNumberIssues(value, context, messages, max);

    if (!Number.isInteger(value)) {
      context.addIssue({ code: 'custom', message: `${messages.label}은 정수로 선택해주세요.` });
    }
  });

const optionalRating = z.union([z.number(), z.undefined()]).superRefine((value, context) => {
  if (value === undefined) {
    return;
  }

  if (!Number.isInteger(value) || value < 1 || value > 5) {
    context.addIssue({ code: 'custom', message: '별점은 1점부터 5점까지 선택해주세요.' });
  }
});

const pressureSchema = z
  .object({
    unit: z.enum(['bar', 'psi']).optional(),
    start: z.number().optional(),
    end: z.number().optional(),
  })
  .superRefine((value, context) => {
    const unit = value.unit ?? 'bar';
    const max = unit === 'psi' ? 4500 : 300;

    validatePressureValue(value.start, ['start'], context, makePressureMessages(unit, '시작 압력'), max);
    validatePressureValue(value.end, ['end'], context, makePressureMessages(unit, '종료 압력'), max);

    if ((value.start !== undefined || value.end !== undefined) && value.unit === undefined) {
      context.addIssue({ code: 'custom', path: ['unit'], message: '압력 단위를 선택해주세요.' });
    }
  });

export const planFormSchema = z.object({
  title: z.string().optional(),
  plannedAt: z.union([z.date(), z.undefined()]).superRefine((value, context) => {
    if (value === undefined) {
      context.addIssue({ code: 'custom', message: '계획 날짜와 시간을 선택해주세요.' });
    }
  }),
  diveMode: z.enum(['scuba', 'freedive']),
  entryStyle: z.enum(['shore', 'boat', 'pool']).optional(),
  siteName: z.string().trim().min(1, '사이트 이름을 입력해주세요.'),
  buddies: z.array(z.string()),
  gearIds: z.array(z.string()),
  tags: z.array(z.string()),
  objective: z.string().optional(),
  notes: z.string().optional(),
  plannedMaxDepthMeters: requiredNumber(makeNumberMessages('계획 최대 수심(m)', '선택'), 60),
  plannedDurationMinutes: requiredNumber(makeNumberMessages('계획 시간(분)', '선택'), 240),
  gasLabel: z.literal('Air').optional(),
  waterCondition: z.enum(waterConditions).optional(),
  visibilityExpectation: optionalRating,
  perceivedDifficulty: optionalRating,
  trainingFocus: z.string().optional(),
  repetitionTarget: optionalInteger(makeNumberMessages('반복 목표', '선택'), 200),
  plannedPressure: pressureSchema,
});

export function planToPlanFormValues(plan: DivePlan): PlanFormValues {
  const diveMode = plan.diveMode ?? 'scuba';

  return {
    title: plan.title ?? '',
    plannedAt: plan.plannedAt === undefined ? undefined : new Date(plan.plannedAt * 1000),
    diveMode,
    entryStyle: plan.entryStyle,
    siteName: plan.site.name ?? '',
    buddies: [...plan.buddyIds],
    gearIds: [...plan.gearIds],
    tags: [...plan.tags],
    objective: plan.objective ?? '',
    notes: plan.notes ?? '',
    plannedMaxDepthMeters: plan.plannedValues.plannedMaxDepthMeters,
    plannedDurationMinutes: plan.plannedValues.plannedDurationMinutes,
    gasLabel: diveMode === 'scuba' ? 'Air' : undefined,
    waterCondition: plan.plannedValues.waterCondition,
    visibilityExpectation: plan.plannedValues.visibilityExpectation,
    perceivedDifficulty: plan.plannedValues.perceivedDifficulty,
    trainingFocus: plan.plannedValues.trainingFocus ?? '',
    repetitionTarget: plan.plannedValues.repetitionTarget,
    plannedPressure: pressureToFormValue(plan.plannedValues.plannedPressure),
  };
}

export function planFormValuesToPlan(plan: DivePlan, values: PlanFormValues, status: DivePlanStatus): DivePlan {
  const timestamp = Date.now() / 1000;
  const diveMode = values.diveMode;

  return {
    ...plan,
    status,
    updatedAt: timestamp,
    plannedAt: values.plannedAt === undefined ? undefined : values.plannedAt.getTime() / 1000,
    title: emptyToUndefined(values.title ?? ''),
    diveMode,
    entryStyle: values.entryStyle,
    site: {
      ...plan.site,
      name: emptyToUndefined(values.siteName),
    },
    buddyIds: [...values.buddies],
    gearIds: diveMode === 'scuba' ? [...values.gearIds] : [],
    tags: [...values.tags],
    objective: emptyToUndefined(values.objective ?? ''),
    notes: emptyToUndefined(values.notes ?? ''),
    plannedValues: getPlannedValues(values, diveMode),
  };
}

function getPlannedValues(values: PlanFormValues, diveMode: NonNullable<WatchSession['diveMode']>): DivePlanValues {
  return {
    plannedMaxDepthMeters: values.plannedMaxDepthMeters,
    plannedDurationMinutes: values.plannedDurationMinutes,
    gasLabel: diveMode === 'scuba' ? 'Air' : undefined,
    waterCondition: values.waterCondition,
    visibilityExpectation: values.visibilityExpectation,
    perceivedDifficulty: values.perceivedDifficulty,
    trainingFocus: emptyToUndefined(values.trainingFocus ?? ''),
    repetitionTarget: diveMode === 'freedive' ? values.repetitionTarget : undefined,
    plannedPressure: diveMode === 'scuba' ? normalizePressure(values.plannedPressure) : undefined,
  };
}

type NumberValidationMessages = {
  label: string;
  required: string;
  invalid: string;
  min: string;
  max: string;
};

function makeNumberMessages(label: string, requiredVerb: '입력' | '선택'): NumberValidationMessages {
  return {
    label,
    required: `${label}을 ${requiredVerb}해주세요.`,
    invalid: `${label}은 숫자여야 합니다.`,
    min: `${label}은 0 이상이어야 합니다.`,
    max: `${label}은 {max} 이하로 ${requiredVerb}해주세요.`,
  };
}

function makePressureMessages(unit: 'bar' | 'psi', label: string): NumberValidationMessages {
  return {
    label,
    required: `${label}을 입력해주세요.`,
    invalid: `${label}은 숫자여야 합니다.`,
    min: `${label}은 0 이상이어야 합니다.`,
    max: `${label}은 {max}${unit} 이하로 입력해주세요.`,
  };
}

function addNumberIssues(value: number, context: z.RefinementCtx, messages: NumberValidationMessages, max: number): void {
  if (!Number.isFinite(value)) {
    context.addIssue({ code: 'custom', message: messages.invalid });
    return;
  }

  if (value < 0) {
    context.addIssue({ code: 'custom', message: messages.min });
    return;
  }

  if (value > max) {
    context.addIssue({ code: 'custom', message: messages.max.replace('{max}', `${max}`) });
  }
}

function validatePressureValue(
  value: number | undefined,
  path: Array<string | number>,
  context: z.RefinementCtx,
  messages: NumberValidationMessages,
  max: number,
): void {
  if (value === undefined) {
    return;
  }

  if (!Number.isFinite(value)) {
    context.addIssue({ code: 'custom', path, message: messages.invalid });
    return;
  }

  if (value < 0) {
    context.addIssue({ code: 'custom', path, message: messages.min });
    return;
  }

  if (value > max) {
    context.addIssue({ code: 'custom', path, message: messages.max.replace('{max}', `${max}`) });
  }
}

function normalizePressure(value: DivePressureValues): DivePressureValues | undefined {
  if (value.start === undefined && value.end === undefined) {
    return undefined;
  }

  return {
    unit: value.unit ?? 'bar',
    start: value.start,
    end: value.end,
  };
}

function pressureToFormValue(value: DivePressureValues | undefined): DivePressureValues {
  return {
    ...value,
    unit: value?.unit ?? 'bar',
  };
}

function emptyToUndefined(value: string): string | undefined {
  const trimmedValue = value.trim();
  return trimmedValue.length ? trimmedValue : undefined;
}
