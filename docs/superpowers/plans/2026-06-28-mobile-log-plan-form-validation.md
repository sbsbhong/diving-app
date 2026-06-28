# Mobile Log And Plan Form Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert mobile Logbook and Planning editors to validated structured forms with date pickers, numeric sliders, star ratings, badge list inputs, fixed scuba Air gas labels, and scuba pressure metadata for logs and plans.

**Architecture:** Keep persistence boundaries unchanged: editors map domain objects to form values, validate with Zod through `react-hook-form`, then map valid values back to `DiveLogEntry` or `DivePlan`. Put reusable editor controls under `apps/mobile/src/screens/common/form/` so Logbook and Planning share behavior without introducing a new app-wide UI framework. Pressure is stored as ordinary metadata and never used for safety calculations.

**Tech Stack:** React Native 0.85, React 19, TypeScript, Jest, React Test Renderer, React Hook Form, Zod, `@hookform/resolvers`, existing gluestack UI primitives, i18next.

---

## Files

- Modify: `apps/mobile/package.json` to add `react-hook-form`, `@hookform/resolvers`, `zod`, `@react-native-community/datetimepicker`, and `@react-native-community/slider`.
- Modify: `yarn.lock` through Yarn 1.
- Modify: `apps/mobile/src/types/dive-log-entry.ts` to add `DivePressureUnit`, `DivePressureValues`, and optional manual measured pressure metadata.
- Modify: `apps/mobile/src/types/dive-plan.ts` to add `DivePressureUnit`, `DivePressureValues`, and optional planned pressure metadata.
- Create: `apps/mobile/src/screens/common/form/editor-field.tsx` for labels, required markers, and field errors.
- Create: `apps/mobile/src/screens/common/form/date-time-field.tsx` for DateTimePicker integration.
- Create: `apps/mobile/src/screens/common/form/numeric-slider-field.tsx` for numeric input plus slider.
- Create: `apps/mobile/src/screens/common/form/star-rating-field.tsx` for 1-5 star inputs.
- Create: `apps/mobile/src/screens/common/form/badge-list-field.tsx` for comma-to-badge list entry.
- Create: `apps/mobile/src/screens/common/form/fixed-option-field.tsx` for fixed Air gas display.
- Create: `apps/mobile/src/screens/common/form/pressure-fields.tsx` for unit/start/end pressure controls.
- Create: `apps/mobile/src/screens/logbook/log-entry-form-schema.ts` for Logbook form values, schema, and conversions.
- Modify: `apps/mobile/src/screens/logbook/log-entry-editor.tsx` to use `react-hook-form` and shared controls.
- Modify: `apps/mobile/src/screens/logbook/log-entry-mode-fields.tsx` to render controlled mode-specific fields.
- Create: `apps/mobile/src/screens/planning/plan-form-schema.ts` for Planning form values, schema, and conversions.
- Modify: `apps/mobile/src/screens/planning/plan-editor.tsx` to use `react-hook-form` validation for draft and planned saves.
- Modify: `apps/mobile/src/screens/planning/plan-mode-fields.tsx` to render controlled mode-specific fields.
- Modify: `apps/mobile/src/utils/dive-plan-to-log-entry.ts` to copy planned pressure as editable draft metadata.
- Modify: `apps/mobile/src/utils/watch-session-to-dive-log-entry.ts` only if type construction needs explicit empty pressure handling.
- Modify: `apps/mobile/src/i18n/resources.ts` for KO/EN labels.
- Modify: `.wiki/wiki/domains/dive-log.md`, `.wiki/wiki/domains/dive-planning.md`, `.wiki/wiki/domains/safety-rules.md`, `.wiki/wiki/index.md`, and `.wiki/wiki/log.md`.
- Add raw wiki source: `.wiki/raw/domains/2026-06-28-mobile-form-validation-pressure-metadata.md`.
- Modify tests: `apps/mobile/__tests__/logbook-manual-entry.test.tsx`.
- Modify tests: `apps/mobile/__tests__/planning-screen.test.tsx`.
- Modify tests: `apps/mobile/__tests__/dive-plan-to-log-entry.test.ts`.

## Baseline

- [ ] **Step 1: Install explicit form dependencies**

Run:

```bash
yarn workspace @repo/mobile add react-hook-form @hookform/resolvers zod @react-native-community/datetimepicker @react-native-community/slider
```

Expected: `apps/mobile/package.json` and `yarn.lock` change. Use Yarn 1 only.

- [ ] **Step 2: Verify baseline after dependency install**

Run:

```bash
yarn mobile:typecheck
```

Expected: pass before source changes, or fail only if the dependency install exposes an existing type issue. Record the exact failure before continuing.

## Task 1: Pressure Domain Types

**Files:**

- Modify: `apps/mobile/src/types/dive-log-entry.ts`
- Modify: `apps/mobile/src/types/dive-plan.ts`
- Modify: `apps/mobile/__tests__/dive-plan-to-log-entry.test.ts`

- [ ] **Step 1: Write RED test for planned pressure copy**

In `apps/mobile/__tests__/dive-plan-to-log-entry.test.ts`, add a test case:

```ts
it('copies planned scuba pressure as editable manual metadata without measured depth or duration', () => {
  const draft = divePlanToDiveLogEntryDraft(
    {
      localId: 'plan-pressure',
      status: 'completed',
      createdAt: 100,
      updatedAt: 200,
      diveMode: 'scuba',
      site: { name: 'Pressure Reef' },
      buddyIds: [],
      gearIds: [],
      tags: [],
      plannedValues: {
        gasLabel: 'Air',
        plannedPressure: { unit: 'bar', start: 200, end: 70 },
        plannedMaxDepthMeters: 24,
        plannedDurationMinutes: 45,
      },
      checklistItems: [],
    },
    { localId: 'draft-pressure', now: 300 },
  );

  expect(draft.manual.measuredValues.pressure).toEqual({ unit: 'bar', start: 200, end: 70 });
  expect(draft.manual.measuredValues.gasLabel).toBe('Air');
  expect(draft.manual.measuredValues.maxDepthMeters).toBeUndefined();
  expect(draft.manual.measuredValues.durationSeconds).toBeUndefined();
});
```

- [ ] **Step 2: Run RED test**

Run:

```bash
yarn workspace @repo/mobile test dive-plan-to-log-entry --runInBand
```

Expected: fail because `plannedPressure` and `pressure` are not typed or copied.

- [ ] **Step 3: Add pressure types**

In `apps/mobile/src/types/dive-log-entry.ts`, add:

```ts
export type DivePressureUnit = 'bar' | 'psi';

export type DivePressureValues = {
  unit?: DivePressureUnit;
  start?: number;
  end?: number;
};
```

Add to `DiveLogManualMeasuredValues`:

```ts
pressure?: DivePressureValues;
```

In `apps/mobile/src/types/dive-plan.ts`, import the pressure type from `./dive-log-entry`:

```ts
import type { DivePressureValues } from './dive-log-entry';
```

Add to `DivePlanValues`:

```ts
plannedPressure?: DivePressureValues;
```

- [ ] **Step 4: Copy pressure in plan-to-log mapping**

In `apps/mobile/src/utils/dive-plan-to-log-entry.ts`, inside `manual.measuredValues`, add:

```ts
pressure: plan.diveMode === 'scuba' ? plan.plannedValues.plannedPressure : undefined,
```

- [ ] **Step 5: Run GREEN test**

Run:

```bash
yarn workspace @repo/mobile test dive-plan-to-log-entry --runInBand
```

Expected: pass.

## Task 2: Shared Form Controls

**Files:**

- Create: `apps/mobile/src/screens/common/form/editor-field.tsx`
- Create: `apps/mobile/src/screens/common/form/date-time-field.tsx`
- Create: `apps/mobile/src/screens/common/form/numeric-slider-field.tsx`
- Create: `apps/mobile/src/screens/common/form/star-rating-field.tsx`
- Create: `apps/mobile/src/screens/common/form/badge-list-field.tsx`
- Create: `apps/mobile/src/screens/common/form/fixed-option-field.tsx`
- Create: `apps/mobile/src/screens/common/form/pressure-fields.tsx`
- Modify tests: `apps/mobile/__tests__/logbook-manual-entry.test.tsx`

- [ ] **Step 1: Write RED tests for badge and star behavior through Logbook**

In `apps/mobile/__tests__/logbook-manual-entry.test.tsx`, add or update tests that drive the editor:

```ts
it('commits comma-delimited logbook lists as removable badges', async () => {
  const repository = new LocalDiveLogRepository([], { now: () => 1781351000 });
  const renderer = await renderLogbook(repository);
  const root = renderer.root;

  await press(root, 'logbook-create-action');
  await changeDateTime(root, 'log-entry-editor-started-at', new Date('2026-06-20T09:30:00'));
  await changeText(root, 'log-entry-editor-site-name', 'Blue Corner');
  await changeText(root, 'log-entry-editor-duration', '47');
  await changeText(root, 'log-entry-editor-max-depth', '18.6');
  await changeText(root, 'log-entry-editor-buddies-input', 'Mina,');
  expect(root.findByProps({ testID: 'log-entry-editor-buddies-badge-Mina' })).toBeTruthy();
  await changeText(root, 'log-entry-editor-buddies-input', 'Alex,');
  await press(root, 'log-entry-editor-buddies-remove-Mina');
  await press(root, 'log-entry-editor-save');

  const [savedEntry] = await repository.list();
  expect(savedEntry.manual.buddyIds).toEqual(['Alex']);
});

it('saves star ratings from the logbook editor', async () => {
  const repository = new LocalDiveLogRepository([], { now: () => 1781351000 });
  const renderer = await renderLogbook(repository);
  const root = renderer.root;

  await press(root, 'logbook-create-action');
  await changeDateTime(root, 'log-entry-editor-started-at', new Date('2026-06-20T09:30:00'));
  await changeText(root, 'log-entry-editor-site-name', 'Blue Corner');
  await changeText(root, 'log-entry-editor-duration', '47');
  await changeText(root, 'log-entry-editor-max-depth', '18.6');
  await press(root, 'log-entry-editor-rating-star-5');
  await press(root, 'log-entry-editor-visibility-rating-star-4');
  await press(root, 'log-entry-editor-save');

  const [savedEntry] = await repository.list();
  expect(savedEntry.manual.rating).toBe(5);
  expect(savedEntry.manual.measuredValues.visibilityRating).toBe(4);
});
```

Add this helper near existing test helpers:

```ts
const changeDateTime = async (root: ReactTestRenderer.ReactTestInstance, testID: string, value: Date) => {
  await ReactTestRenderer.act(async () => {
    root.findByProps({ testID }).props.onChange(value);
  });
};
```

- [ ] **Step 2: Run RED tests**

Run:

```bash
yarn workspace @repo/mobile test logbook-manual-entry --runInBand
```

Expected: fail because the new test IDs and shared controls do not exist.

- [ ] **Step 3: Create `EditorField`**

Implement `EditorField` with:

```ts
type EditorFieldProps = {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
};
```

Use `FormControl`, `FormControlLabel`, `FormControlLabelText`, `FormControlLabelAstrick`, `FormControlError`, and `FormControlErrorText`. Use semantic tokens only.

- [ ] **Step 4: Create `DateTimeField`**

Implement props:

```ts
type DateTimeFieldProps = {
  label: string;
  value?: Date;
  onChange: (value: Date | undefined) => void;
  required?: boolean;
  error?: string;
  testID: string;
};
```

Render `DateTimePicker` with `mode="datetime"`, `format="YYYY-MM-DD HH:mm"`, `display="modal"`, `DateTimePickerTrigger`, and `DateTimePickerInput`. Put `testID` on the root field wrapper where tests can call `onChange`.

- [ ] **Step 5: Create `NumericSliderField`**

Implement props:

```ts
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
};
```

Render `Input` with `InputField keyboardType="numeric"` and a `Slider` with `SliderTrack`, `SliderFilledTrack`, and `SliderThumb`. Keep value parsing local: blank text becomes `undefined`, finite numeric text becomes `number`.

- [ ] **Step 6: Create `StarRatingField`**

Implement props:

```ts
type StarRatingFieldProps = {
  label: string;
  value?: number;
  onChange: (value: number | undefined) => void;
  required?: boolean;
  error?: string;
  testID: string;
};
```

Render five `Button` components with star text `★` for selected and `☆` for unselected. Use `ButtonText`, semantic tokens, and test IDs `${testID}-star-${rating}`.

- [ ] **Step 7: Create `BadgeListField`**

Implement props:

```ts
type BadgeListFieldProps = {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  required?: boolean;
  error?: string;
  inputTestID: string;
  badgeTestIDPrefix: string;
  placeholder?: string;
};
```

On comma in `onChangeText`, commit tokens before the comma. On submit editing, commit the current token. Ignore blanks and duplicates. Render each value as `Badge variant="outline"` with a small `Button size="icon" variant="ghost"` for removal using test ID `${badgeTestIDPrefix}-remove-${value}`.

- [ ] **Step 8: Create fixed Air and pressure controls**

`FixedOptionField` should display a selected `SelectorPill` or badge-like row for `Air`.

`PressureFields` props:

```ts
type PressureFieldsProps = {
  unit?: 'bar' | 'psi';
  start?: number;
  end?: number;
  onChange: (value: { unit?: 'bar' | 'psi'; start?: number; end?: number }) => void;
  errors?: { unit?: string; start?: string; end?: string };
  testIDPrefix: string;
};
```

Use `SelectorPill` for `bar` and `psi`. Render two `NumericSliderField`s with ranges based on unit.

- [ ] **Step 9: Run shared-control compile check through Logbook tests**

Run:

```bash
yarn workspace @repo/mobile test logbook-manual-entry --runInBand
```

Expected: still fail until Logbook editor wiring is complete, but TypeScript compilation inside Jest should reach component-level code without import errors.

## Task 3: Logbook React Hook Form Conversion

**Files:**

- Create: `apps/mobile/src/screens/logbook/log-entry-form-schema.ts`
- Modify: `apps/mobile/src/screens/logbook/log-entry-editor.tsx`
- Modify: `apps/mobile/src/screens/logbook/log-entry-mode-fields.tsx`
- Modify: `apps/mobile/src/i18n/resources.ts`
- Modify tests: `apps/mobile/__tests__/logbook-manual-entry.test.tsx`

- [ ] **Step 1: Write RED tests for required validation, fixed gas, and pressure**

Add Logbook tests:

```ts
it('blocks saving a manual log until required fields are valid', async () => {
  const repository = new LocalDiveLogRepository([], { now: () => 1781351000 });
  const renderer = await renderLogbook(repository);
  const root = renderer.root;

  await press(root, 'logbook-create-action');
  await press(root, 'log-entry-editor-save');

  expect(root.findByProps({ testID: 'log-entry-editor-site-name-error' }).props.children).toBe('Required');
  expect(root.findByProps({ testID: 'log-entry-editor-duration-error' }).props.children).toBe('Required');
  expect(await repository.list()).toEqual([]);
});

it('uses DateTimePicker values instead of typed date strings', async () => {
  const repository = new LocalDiveLogRepository([], { now: () => 1781351000 });
  const renderer = await renderLogbook(repository);
  const root = renderer.root;

  await press(root, 'logbook-create-action');
  await changeDateTime(root, 'log-entry-editor-started-at', new Date('2026-06-20T09:30:00'));
  await changeText(root, 'log-entry-editor-site-name', 'Blue Corner');
  await changeText(root, 'log-entry-editor-duration', '47');
  await changeText(root, 'log-entry-editor-max-depth', '18.6');
  await press(root, 'log-entry-editor-save');

  const [savedEntry] = await repository.list();
  expect(savedEntry.manual.measuredValues.startedAt).toBe(new Date('2026-06-20T09:30:00').getTime() / 1000);
});

it('shows fixed Air gas and saves scuba pressure metadata', async () => {
  const repository = new LocalDiveLogRepository([], { now: () => 1781351000 });
  const renderer = await renderLogbook(repository);
  const root = renderer.root;

  await press(root, 'logbook-create-action');
  await press(root, 'log-entry-editor-mode-scuba');
  expect(root.findByProps({ testID: 'log-entry-editor-gas-label-air' })).toBeTruthy();
  await changeDateTime(root, 'log-entry-editor-started-at', new Date('2026-06-20T09:30:00'));
  await changeText(root, 'log-entry-editor-site-name', 'Blue Corner');
  await changeText(root, 'log-entry-editor-duration', '47');
  await changeText(root, 'log-entry-editor-max-depth', '18.6');
  await press(root, 'log-entry-editor-pressure-unit-psi');
  await changeText(root, 'log-entry-editor-pressure-start', '3000');
  await changeText(root, 'log-entry-editor-pressure-end', '900');
  await press(root, 'log-entry-editor-save');

  const [savedEntry] = await repository.list();
  expect(savedEntry.manual.measuredValues.gasLabel).toBe('Air');
  expect(savedEntry.manual.measuredValues.pressure).toEqual({ unit: 'psi', start: 3000, end: 900 });
});
```

- [ ] **Step 2: Run Logbook RED tests**

Run:

```bash
yarn workspace @repo/mobile test logbook-manual-entry --runInBand
```

Expected: fail because Logbook still uses string state and free-text inputs.

- [ ] **Step 3: Implement Logbook schema and converters**

Create `log-entry-form-schema.ts` exporting:

```ts
export type LogEntryFormValues = {
  startedAt?: Date;
  diveMode: 'scuba' | 'freedive';
  entryStyle?: 'shore' | 'boat' | 'pool';
  siteName: string;
  durationMinutes?: number;
  maxDepthMeters?: number;
  gasLabel?: 'Air';
  gearIds: string[];
  waterCondition?: WatchSession['waterCondition'];
  visibilityRating?: number;
  perceivedExertion?: number;
  repetitionCount?: number;
  trainingFocus?: string;
  buddies: string[];
  tags: string[];
  observedMarineLife: string[];
  notes?: string;
  rating?: number;
  pressure: { unit?: 'bar' | 'psi'; start?: number; end?: number };
};
```

Export `logEntryFormSchema`, `entryToLogEntryFormValues`, and `logEntryFormValuesToEntry`. Move the existing provenance-preserving helper logic from `log-entry-editor.tsx` into this file and adapt it from strings to typed values.

- [ ] **Step 4: Wire `LogEntryEditor` to `useForm`**

Use:

```ts
const form = useForm<LogEntryFormValues>({
  defaultValues: entryToLogEntryFormValues(props.entry),
  resolver: zodResolver(logEntryFormSchema),
  mode: 'onSubmit',
});
```

Use `Controller` for custom controls. Submit with:

```ts
const save = form.handleSubmit(async values => {
  await props.onSave(logEntryFormValuesToEntry(props.entry, values, form.formState.dirtyFields));
});
```

Keep the existing local save failure banner.

- [ ] **Step 5: Wire mode-specific Logbook fields**

Change `ModeSpecificFields` props to receive `control`, `errors`, and the active `diveMode`. For scuba, render fixed Air, gear badges, water condition, visibility stars, exertion stars, and pressure fields. For freedive, render repetition count, exertion stars, and training focus.

- [ ] **Step 6: Run Logbook GREEN tests**

Run:

```bash
yarn workspace @repo/mobile test logbook-manual-entry --runInBand
```

Expected: pass.

## Task 4: Planning React Hook Form Conversion

**Files:**

- Create: `apps/mobile/src/screens/planning/plan-form-schema.ts`
- Modify: `apps/mobile/src/screens/planning/plan-editor.tsx`
- Modify: `apps/mobile/src/screens/planning/plan-mode-fields.tsx`
- Modify: `apps/mobile/src/i18n/resources.ts`
- Modify tests: `apps/mobile/__tests__/planning-screen.test.tsx`

- [ ] **Step 1: Write Planning RED tests**

Add tests:

```ts
it('blocks set planned until required planned fields are valid', async () => {
  const repository = new LocalDivePlanRepository([], { now: () => 1781354000 });
  const renderer = await renderPlanning(repository);
  const root = renderer.root;

  await press(root, 'planning-create-action');
  await press(root, 'planning-editor-save-planned');

  expect(root.findByProps({ testID: 'planning-editor-site-name-error' }).props.children).toBe('Required');
  expect(root.findByProps({ testID: 'planning-editor-planned-at-error' }).props.children).toBe('Required');
  expect(await repository.list()).toEqual([]);
});

it('allows draft save without planned required fields but rejects invalid filled values', async () => {
  const repository = new LocalDivePlanRepository([], { now: () => 1781354000 });
  const renderer = await renderPlanning(repository);
  const root = renderer.root;

  await press(root, 'planning-create-action');
  await changeText(root, 'planning-editor-planned-duration', '-5');
  await press(root, 'planning-editor-save-draft');
  expect(root.findByProps({ testID: 'planning-editor-planned-duration-error' }).props.children).toBe('Must be 0 or more');
  expect(await repository.list()).toEqual([]);

  await changeText(root, 'planning-editor-planned-duration', '');
  await changeText(root, 'planning-editor-plan-title', 'Loose draft');
  await press(root, 'planning-editor-save-draft');
  expect((await repository.list())[0].title).toBe('Loose draft');
});

it('saves planning badges, fixed Air gas, star values, and pressure metadata', async () => {
  const repository = new LocalDivePlanRepository([], { now: () => 1781354000 });
  const renderer = await renderPlanning(repository);
  const root = renderer.root;

  await press(root, 'planning-create-action');
  await changeDateTime(root, 'planning-editor-planned-at', new Date('2026-06-21T08:00:00'));
  await changeText(root, 'planning-editor-site-name', 'Blue Wall');
  await changeText(root, 'planning-editor-planned-max-depth', '24');
  await changeText(root, 'planning-editor-planned-duration', '45');
  await changeText(root, 'planning-editor-buddies-input', 'Mina,');
  await changeText(root, 'planning-editor-gear-input', 'bcd-1,');
  await press(root, 'planning-editor-visibility-expectation-star-4');
  await press(root, 'planning-editor-perceived-difficulty-star-3');
  await changeText(root, 'planning-editor-pressure-start', '200');
  await changeText(root, 'planning-editor-pressure-end', '70');
  await press(root, 'planning-editor-save-planned');

  const [savedPlan] = await repository.list();
  expect(savedPlan.buddyIds).toEqual(['Mina']);
  expect(savedPlan.gearIds).toEqual(['bcd-1']);
  expect(savedPlan.plannedValues.gasLabel).toBe('Air');
  expect(savedPlan.plannedValues.visibilityExpectation).toBe(4);
  expect(savedPlan.plannedValues.perceivedDifficulty).toBe(3);
  expect(savedPlan.plannedValues.plannedPressure).toEqual({ unit: 'bar', start: 200, end: 70 });
});
```

Add the same `changeDateTime` helper to this test file.

- [ ] **Step 2: Run Planning RED tests**

Run:

```bash
yarn workspace @repo/mobile test planning-screen --runInBand
```

Expected: fail because Planning still uses string state and free-text fields.

- [ ] **Step 3: Implement Planning schema and converters**

Create `plan-form-schema.ts` exporting:

```ts
export type PlanFormValues = {
  title?: string;
  plannedAt?: Date;
  diveMode: 'scuba' | 'freedive';
  entryStyle?: 'shore' | 'boat' | 'pool';
  siteName: string;
  buddies: string[];
  gearIds: string[];
  tags: string[];
  objective?: string;
  notes?: string;
  plannedMaxDepthMeters?: number;
  plannedDurationMinutes?: number;
  gasLabel?: 'Air';
  waterCondition?: WatchSession['waterCondition'];
  visibilityExpectation?: number;
  perceivedDifficulty?: number;
  trainingFocus?: string;
  repetitionTarget?: number;
  plannedPressure: { unit?: 'bar' | 'psi'; start?: number; end?: number };
};
```

Export `planDraftFormSchema`, `planPlannedFormSchema`, `planToFormValues`, and `formValuesToPlan`.

- [ ] **Step 4: Wire `PlanEditor` to `useForm`**

Use one `useForm<PlanFormValues>` instance. For `Save draft`, validate with the draft schema. For `Set planned`, validate with the planned schema. The simplest implementation is to keep `resolver: zodResolver(planDraftFormSchema)` and call `planPlannedFormSchema.safeParse(form.getValues())` inside the planned action, then set errors with `form.setError` when validation fails.

- [ ] **Step 5: Wire mode-specific Planning fields**

Change `PlanModeFields` props to receive `control`, `errors`, and `diveMode`. For scuba, render planned max depth, planned duration, fixed Air, water condition, visibility stars, difficulty stars, training focus, and planned pressure. For freedive, hide gas and pressure.

- [ ] **Step 6: Run Planning GREEN tests**

Run:

```bash
yarn workspace @repo/mobile test planning-screen --runInBand
```

Expected: pass.

## Task 5: I18n, Detail Compatibility, And Existing Flow Fixes

**Files:**

- Modify: `apps/mobile/src/i18n/resources.ts`
- Modify: `apps/mobile/src/screens/logbook/log-entry-detail.tsx` to display saved log pressure in scuba mode facts.
- Modify: `apps/mobile/src/screens/planning/plan-detail.tsx` to display planned pressure in scuba planned facts.
- Modify: `apps/mobile/__tests__/logbook-manual-entry.test.tsx`
- Modify: `apps/mobile/__tests__/planning-screen.test.tsx`

- [ ] **Step 1: Write RED checks for pressure display**

The existing Logbook and Planning detail screens already show mode-specific facts, so pressure should be visible after save. Add assertions that saved pressure appears as `200 bar -> 70 bar` or `3000 psi -> 900 psi` in the mode facts area.

- [ ] **Step 2: Add i18n resources**

Add KO/EN strings for:

```ts
validation: {
  required: 'Required',
  invalidNumber: 'Enter a valid number',
  minZero: 'Must be 0 or more',
  maxValue: 'Must be {{max}} or less',
  ratingRange: 'Choose 1 to 5 stars',
},
logbook: {
  pressureUnit: 'Pressure unit',
  startPressure: 'Start pressure',
  endPressure: 'End pressure',
  airGas: 'Air',
},
planning: {
  startPressure: 'Planned start pressure',
  endPressure: 'Planned end pressure',
}
```

Use matching Korean translations under `ko.translation`.

- [ ] **Step 3: Preserve existing tests**

Run:

```bash
yarn workspace @repo/mobile test logbook-manual-entry planning-screen dive-plan-to-log-entry --runInBand
```

Expected: pass.

## Task 6: Wiki Updates

**Files:**

- Add: `.wiki/raw/domains/2026-06-28-mobile-form-validation-pressure-metadata.md`
- Modify: `.wiki/wiki/domains/dive-log.md`
- Modify: `.wiki/wiki/domains/dive-planning.md`
- Modify: `.wiki/wiki/domains/safety-rules.md`
- Modify: `.wiki/wiki/index.md`
- Modify: `.wiki/wiki/log.md`

- [ ] **Step 1: Capture raw source**

Create `.wiki/raw/domains/2026-06-28-mobile-form-validation-pressure-metadata.md`:

```md
# Mobile form validation and pressure metadata

Source URL: Local implementation and user-approved design
Collected: 2026-06-28
Published: 2026-06-28

The mobile Logbook and Planning editors were strengthened with structured form validation. The accepted design stores scuba pressure as record or reminder metadata only:

- Logbook scuba entries may store `manual.measuredValues.pressure`.
- Planning scuba entries may store `plannedValues.plannedPressure`.
- Pressure values support `bar` and `psi`, plus optional start and end numbers.
- Pressure metadata must not drive gas sufficiency, reserve, decompression, ascent, no-fly, or emergency decisions.

Relevant local sources:

- `docs/superpowers/specs/2026-06-28-mobile-log-plan-form-validation-design.md`
- `apps/mobile/src/types/dive-log-entry.ts`
- `apps/mobile/src/types/dive-plan.ts`
- `apps/mobile/src/screens/logbook/log-entry-form-schema.ts`
- `apps/mobile/src/screens/planning/plan-form-schema.ts`
```

- [ ] **Step 2: Update compiled articles**

Update:

- `.wiki/wiki/domains/dive-log.md`: mention optional `DivePressureValues` in manual scuba measured metadata and that it is not a safety calculation.
- `.wiki/wiki/domains/dive-planning.md`: mention optional planned scuba pressure metadata and that it is reminder context.
- `.wiki/wiki/domains/safety-rules.md`: clarify that manual pressure entry is allowed as metadata, while gas remaining/reserve/turn pressure decisions remain out of scope.
- `.wiki/wiki/index.md`: refresh summaries/updated dates for touched articles.
- `.wiki/wiki/log.md`: append `## [2026-06-28] ingest | Mobile form validation and pressure metadata`.

- [ ] **Step 3: Run wiki-relevant verification later with codex check**

Do not run `yarn codex:check` until after source tests and typecheck are passing, because it includes generation, mobile typecheck, and watch build.

## Task 7: Final Verification

- [ ] **Step 1: Run targeted Jest tests**

Run:

```bash
yarn workspace @repo/mobile test logbook-manual-entry planning-screen dive-plan-to-log-entry --runInBand
```

Expected: pass.

- [ ] **Step 2: Run mobile typecheck**

Run:

```bash
yarn mobile:typecheck
```

Expected: pass.

- [ ] **Step 3: Run full handoff check**

Run:

```bash
yarn codex:check
```

Expected: pass. If `watch:build` fails due local Xcode/Simulator permissions, report the exact command and error summary instead of claiming success.

- [ ] **Step 4: Inspect changed files**

Run:

```bash
git status --short
```

Expected: only intended mobile, wiki, package, lockfile, and plan/spec files are changed, plus any pre-existing unrelated dirty files left untouched.
