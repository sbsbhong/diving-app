# Dive Planbook Local Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local, in-memory mobile Planbook that lets users create, edit, complete, and convert recreational dive plans into Logbook drafts without adding Supabase or production persistence.

**Architecture:** Add a dedicated `DivePlan` domain, repository, React Query state hooks, and mapping utility rather than overloading `DiveLogEntry`. Keep planned intent separate from measured log values, and connect Planning to Logbook through explicit navigation-level pending draft state.

**Tech Stack:** React Native 0.85, React 19, TypeScript, Jest, React Test Renderer, React Query, existing local Gluestack UI primitives, i18next.

---

## Files

- Create: `apps/mobile/src/types/dive-plan.ts` for plan status, entry style, planned values, checklist, and plan types.
- Create: `apps/mobile/src/repositories/dive-plan-repository.ts` for the repository interface.
- Create: `apps/mobile/src/repositories/local-dive-plan-repository.ts` for in-memory cloned plan storage and active relevance sorting.
- Create: `apps/mobile/src/states/use-dive-plan-queries.ts` for React Query keys and mutations.
- Create: `apps/mobile/src/states/use-dive-plans.ts` for Planning screen state wiring.
- Create: `apps/mobile/src/utils/create-dive-plan.ts` for blank plan creation and checklist defaults.
- Create: `apps/mobile/src/utils/dive-plan-to-log-entry.ts` for safe metadata-only plan-to-log draft mapping.
- Create: `apps/mobile/src/screens/planning/plan-editor.tsx` for shared create/edit plan form.
- Create: `apps/mobile/src/screens/planning/plan-detail.tsx` for plan summary, checklist, and actions.
- Create: `apps/mobile/src/screens/planning/plan-mode-fields.tsx` for mode-specific planned fields.
- Modify: `apps/mobile/src/screens/planning/screen.tsx` to become the Planbook route shell and active/list view.
- Modify: `apps/mobile/src/components/navigation/index.tsx` to own plan hook and plan-to-log pending draft handoff.
- Modify: `apps/mobile/src/screens/logbook/screen.tsx` to accept a pending draft and notify when saved.
- Modify: `apps/mobile/src/screens/logbook/log-entry-editor.tsx` and `log-entry-mode-fields.tsx` to support optional `entryStyle`.
- Modify: `apps/mobile/src/screens/logbook/log-entry-detail.tsx` to display optional `entryStyle`.
- Modify: `apps/mobile/src/types/dive-log-entry.ts` to add optional `manual.entryStyle`.
- Modify: `apps/mobile/src/i18n/resources.ts` for new KO/EN strings.
- Modify: `.wiki/wiki/architecture/mobile.md`, `.wiki/wiki/domains/dive-log.md`, `.wiki/wiki/domains/safety-rules.md`, `.wiki/wiki/index.md` if a planning page is added, and `.wiki/wiki/log.md`.
- Test: `apps/mobile/__tests__/local-dive-plan-repository.test.ts`.
- Test: `apps/mobile/__tests__/dive-plan-to-log-entry.test.ts`.
- Test: `apps/mobile/__tests__/planning-screen.test.tsx`.
- Modify tests: `apps/mobile/__tests__/logbook-manual-entry.test.tsx`.

## Baseline

- [x] **Step 1: Create isolated worktree**

Run: `git worktree add .worktrees/dive-planbook-local -b dive-planbook-local`

Observed: worktree created from `ca0bc48 Add dive planbook design spec`.

- [x] **Step 2: Install dependencies**

Run: `yarn install --frozen-lockfile`

Observed: exit 0 with existing peer dependency warnings.

- [x] **Step 3: Verify baseline mobile tests**

Run: `yarn workspace @repo/mobile test --runInBand`

Observed: 13 suites passed, 53 tests passed.

- [x] **Step 4: Verify baseline mobile typecheck**

Run: `yarn mobile:typecheck`

Observed: exit 0.

## Task 1: Plan Domain And Repository

- [ ] **Step 1: Write repository RED tests**

Add tests to `apps/mobile/__tests__/local-dive-plan-repository.test.ts`:

```ts
import { LocalDivePlanRepository } from '../src/repositories/local-dive-plan-repository';
import type { DivePlan } from '../src/types/dive-plan';

const plan = (overrides: Partial<DivePlan>): DivePlan => ({
  localId: 'plan-base',
  status: 'draft',
  createdAt: 100,
  updatedAt: 100,
  site: {},
  buddyIds: [],
  gearIds: [],
  tags: [],
  plannedValues: {},
  checklistItems: [],
  ...overrides,
});

describe('LocalDivePlanRepository', () => {
  it('clones plans on save and list so callers cannot mutate stored state', async () => {
    const repository = new LocalDivePlanRepository();
    const saved = await repository.save(
      plan({
        localId: 'plan-1',
        site: { name: 'Original Reef' },
        checklistItems: [{ id: 'gear', label: 'Gear', completed: false }],
      }),
    );

    saved.site.name = 'Mutated Reef';
    saved.checklistItems[0].completed = true;
    const [listed] = await repository.list();
    listed.site.name = 'Listed Mutation';

    expect((await repository.get('plan-1'))?.site.name).toBe('Original Reef');
    expect((await repository.get('plan-1'))?.checklistItems[0].completed).toBe(false);
  });

  it('sorts active planning relevance before completed plans', async () => {
    const repository = new LocalDivePlanRepository([
      plan({ localId: 'completed', status: 'completed', completedAt: 210, updatedAt: 210 }),
      plan({ localId: 'future-planned', status: 'planned', plannedAt: 500, updatedAt: 150 }),
      plan({ localId: 'draft', status: 'draft', updatedAt: 300 }),
      plan({ localId: 'near-planned', status: 'planned', plannedAt: 400, updatedAt: 180 }),
    ], { now: () => 350 });

    expect((await repository.list()).map(currentPlan => currentPlan.localId)).toEqual([
      'near-planned',
      'future-planned',
      'draft',
      'completed',
    ]);
  });

  it('deletes a saved plan', async () => {
    const repository = new LocalDivePlanRepository([plan({ localId: 'plan-1' })]);

    await repository.delete('plan-1');

    expect(await repository.get('plan-1')).toBeUndefined();
    expect(await repository.list()).toEqual([]);
  });
});
```

- [ ] **Step 2: Verify repository RED**

Run: `yarn workspace @repo/mobile test local-dive-plan-repository --runInBand`

Expected: fail because `local-dive-plan-repository` and `dive-plan` do not exist.

- [ ] **Step 3: Implement domain and repository**

Create the files listed for Task 1 with these exported APIs:

```ts
export type DivePlanStatus = 'draft' | 'planned' | 'completed';
export type DiveEntryStyle = 'shore' | 'boat' | 'pool';
export type DivePlanValues = { plannedMaxDepthMeters?: number; plannedDurationMinutes?: number; gasLabel?: string; waterCondition?: WatchSession['waterCondition']; visibilityExpectation?: number; perceivedDifficulty?: number; trainingFocus?: string; repetitionTarget?: number; poolLengthMeters?: number; lapTarget?: number };
export type DivePlanChecklistItem = { id: string; label: string; completed: boolean };
export type DivePlan = { localId: string; status: DivePlanStatus; createdAt: number; updatedAt: number; plannedAt?: number; completedAt?: number; convertedLogLocalId?: string; title?: string; diveMode?: WatchSession['diveMode']; entryStyle?: DiveEntryStyle; site: { siteId?: string; name?: string }; buddyIds: string[]; gearIds: string[]; tags: string[]; objective?: string; notes?: string; plannedValues: DivePlanValues; checklistItems: DivePlanChecklistItem[] };
```

Repository methods: `list`, `get`, `save`, `delete`, plus `listSync` and `getSync` on the local class.

- [ ] **Step 4: Verify repository GREEN**

Run: `yarn workspace @repo/mobile test local-dive-plan-repository --runInBand`

Expected: pass.

## Task 2: Plan Creation And Plan-To-Log Mapping

- [ ] **Step 1: Write mapping RED tests**

Add `apps/mobile/__tests__/dive-plan-to-log-entry.test.ts`:

```ts
import { divePlanToDiveLogEntryDraft } from '../src/utils/dive-plan-to-log-entry';
import type { DivePlan } from '../src/types/dive-plan';

const completedPlan: DivePlan = {
  localId: 'plan-1',
  status: 'completed',
  createdAt: 100,
  updatedAt: 200,
  completedAt: 200,
  title: 'Blue Wall plan',
  diveMode: 'scuba',
  entryStyle: 'boat',
  site: { siteId: 'site-1', name: 'Blue Wall' },
  buddyIds: ['Mina'],
  gearIds: ['bcd-1'],
  tags: ['training'],
  objective: 'Buoyancy check',
  notes: 'Review current before entering.',
  plannedValues: {
    plannedMaxDepthMeters: 24,
    plannedDurationMinutes: 45,
    gasLabel: 'EAN32',
    visibilityExpectation: 4,
    perceivedDifficulty: 3,
    trainingFocus: 'hovering',
  },
  checklistItems: [{ id: 'gear', label: 'Gear', completed: true }],
};

describe('divePlanToDiveLogEntryDraft', () => {
  it('copies safe metadata into a manual log draft', () => {
    const draft = divePlanToDiveLogEntryDraft(completedPlan, { localId: 'manual-from-plan', now: 300 });

    expect(draft).toMatchObject({
      localId: 'manual-from-plan',
      source: 'manual',
      syncStatus: 'localOnly',
      manual: {
        entryStyle: 'boat',
        site: { siteId: 'site-1', name: 'Blue Wall' },
        buddyIds: ['Mina'],
        gearIds: ['bcd-1'],
        tags: ['training'],
        measuredValues: {
          diveMode: 'scuba',
          gasLabel: 'EAN32',
        },
      },
    });
    expect(draft.manual.notes).toContain('Buoyancy check');
    expect(draft.manual.notes).toContain('hovering');
  });

  it('does not copy planned depth or duration into measured log values', () => {
    const draft = divePlanToDiveLogEntryDraft(completedPlan, { now: 300 });

    expect(draft.manual.measuredValues.maxDepthMeters).toBeUndefined();
    expect(draft.manual.measuredValues.durationSeconds).toBeUndefined();
    expect(draft.manual.measuredValues.visibilityRating).toBeUndefined();
    expect(draft.manual.measuredValues.perceivedExertion).toBeUndefined();
  });
});
```

- [ ] **Step 2: Verify mapping RED**

Run: `yarn workspace @repo/mobile test dive-plan-to-log-entry --runInBand`

Expected: fail because the utility does not exist.

- [ ] **Step 3: Implement blank plan and mapping utilities**

Create `createBlankDivePlan` and `divePlanToDiveLogEntryDraft`. Use `createBlankDiveLogEntry` for log drafts and only set safe metadata.

- [ ] **Step 4: Verify mapping GREEN**

Run: `yarn workspace @repo/mobile test dive-plan-to-log-entry --runInBand`

Expected: pass.

## Task 3: Planning State And Screen Flow

- [ ] **Step 1: Write Planning screen RED tests**

Add `apps/mobile/__tests__/planning-screen.test.tsx` covering:

```ts
it('creates a planned scuba boat plan with mode-specific fields');
it('edits an existing plan without creating a duplicate');
it('completes a plan and lets the user choose Later');
it('creates a log draft from a completed plan through the callback');
it('switches to pool mode and does not persist hidden planned max depth');
```

The tests should render `PlanningScreen` with `plans`, repository-backed callbacks, and test IDs:

- `planning-create-action`
- `planning-editor-title`
- `planning-editor-site-name`
- `planning-editor-status-planned`
- `planning-editor-mode-pool`
- `planning-editor-entry-style-boat`
- `planning-editor-planned-max-depth`
- `planning-editor-pool-length`
- `planning-editor-save-planned`
- `planning-plan-row-<site>`
- `planning-detail-complete`
- `planning-complete-later`
- `planning-detail-create-log`

- [ ] **Step 2: Verify Planning screen RED**

Run: `yarn workspace @repo/mobile test planning-screen --runInBand`

Expected: fail because new props and test IDs are not implemented.

- [ ] **Step 3: Implement planning hooks and UI files**

Implement `useDivePlans`, query hooks, `PlanningScreen`, `PlanEditor`, `PlanDetail`, and `PlanModeFields`. Keep status lifecycle to `draft | planned | completed`, show a non-blocking completion prompt, and do not add `cancelled`.

- [ ] **Step 4: Verify Planning screen GREEN**

Run: `yarn workspace @repo/mobile test planning-screen --runInBand`

Expected: pass.

## Task 4: Logbook Entry Style And Handoff

- [ ] **Step 1: Extend Logbook RED tests**

Modify `apps/mobile/__tests__/logbook-manual-entry.test.tsx` with tests that:

```ts
it('saves optional entry style from the manual editor');
it('does not show an entry style detail row for existing logs without entry style');
it('opens a pending plan draft in the logbook editor and reports the saved log id');
```

Use test IDs `log-entry-editor-entry-style-shore`, `log-entry-detail-mode-value-entry-style-shore`, and a `pendingDraft` prop object.

- [ ] **Step 2: Verify Logbook RED**

Run: `yarn workspace @repo/mobile test logbook-manual-entry --runInBand`

Expected: fail because `entryStyle` UI and pending draft handoff are not implemented.

- [ ] **Step 3: Implement Logbook metadata and navigation handoff**

Add `manual.entryStyle?: DiveEntryStyle`, update editor state, detail facts, screen pending draft effect, and root navigation pending plan/log state. After a plan-generated draft saves, update `convertedLogLocalId` on the source plan.

- [ ] **Step 4: Verify Logbook GREEN**

Run: `yarn workspace @repo/mobile test logbook-manual-entry --runInBand`

Expected: pass.

## Task 5: i18n And Wiki

- [ ] **Step 1: Add i18n strings**

Modify `apps/mobile/src/i18n/resources.ts` for all new Planning and Logbook labels in Korean and English. Keep safety copy in the non-certified reminder language.

- [ ] **Step 2: Update wiki**

Read existing `.wiki/wiki/index.md`, mobile architecture, dive-log domain, and safety page. Add/update the smallest pages for planbook facts and append `.wiki/wiki/log.md`.

- [ ] **Step 3: Run i18n focused tests**

Run: `yarn workspace @repo/mobile test i18n --runInBand`

Expected: pass.

## Task 6: Final Verification And Commit

- [ ] **Step 1: Run focused mobile tests**

Run:

```bash
yarn workspace @repo/mobile test local-dive-plan-repository dive-plan-to-log-entry planning-screen logbook-manual-entry --runInBand
```

Expected: pass.

- [ ] **Step 2: Run all mobile tests**

Run: `yarn workspace @repo/mobile test --runInBand`

Expected: pass.

- [ ] **Step 3: Run mobile typecheck**

Run: `yarn mobile:typecheck`

Expected: pass.

- [ ] **Step 4: Run repository handoff gate**

Run: `yarn codex:check`

Expected: pass, or report any external environment failure with command output.

- [ ] **Step 5: Commit**

Run:

```bash
git add docs/superpowers/plans/2026-06-23-dive-planbook-local.md apps/mobile .wiki
git commit -m "Add local dive planbook"
```

Expected: one feature commit on `dive-planbook-local`.

## Self-Review

- Spec coverage: The plan covers plan model/repository/hooks, list/create/detail/edit UI, completion prompt, plan-to-log draft mapping, optional `entryStyle` on plans/logs, tests, i18n, and wiki safety/domain updates.
- Placeholder scan: No `TBD` or deferred requirement remains. Mode-specific form schema refinements are intentionally outside this first implementation per the approved design.
- Type consistency: `DiveEntryStyle`, `DivePlan`, `plannedValues`, `manual.entryStyle`, `convertedLogLocalId`, and test IDs are named consistently across tasks.
