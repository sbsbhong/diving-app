# Dive Planbook Design

## Goal

Build a mobile Planning feature that lets users create, review, edit, complete, and later convert recreational dive plans into logbook drafts. This is a non-certified planning reminder surface, not a dive computer, decompression planner, medical tool, emergency system, or equipment replacement.

The first implementation will use an in-memory local repository, matching the current Logbook repository maturity. It will not add Supabase, authentication, production persistence, WatchConnectivity, or new native storage dependencies.

## Product Position

Planning is for deliberate users who want structured preparation, not a lightweight note widget. The feature should feel like a planbook:

- keep the next active plan prominent,
- keep older draft/planned/completed plans accessible,
- support rich mode-specific fields,
- let users complete a plan without forcing immediate log writing,
- provide a later path to create a Logbook draft from a completed plan.

Planning values represent intent and preparation context. Logbook values represent actual post-dive records. The implementation must preserve that distinction.

## Scope

In scope:

- New `DivePlan` domain model in mobile code.
- New in-memory `DivePlanRepository` and default local repository.
- React Query hooks for list/save/delete plan operations.
- Planning screen local routes: list, create, detail, edit.
- Active plan panel plus plan list.
- Plan editor with common and mode-specific sections.
- Plan detail with summary, checklist, and actions.
- Status lifecycle: `draft`, `planned`, `completed`.
- `entryStyle` support for both Plans and Logbook entries.
- Optional `entryStyle` values: `shore`, `boat`, `pool`.
- Optional `entryStyle` display and editor controls in Logbook.
- Complete-plan dialog on first transition to `completed`.
- `Create log from plan` action on completed plan detail.
- Tests for repository behavior, Planning UI flows, Logbook `entryStyle`, and safe plan-to-log draft mapping.
- Wiki updates for mobile architecture, dive-log domain, planning domain, and safety boundary.

Out of scope:

- Supabase storage or sync.
- Production device persistence.
- Live WatchConnectivity.
- Automatic creation of completed Logbook entries.
- Decompression, tissue loading, NDL, gas switching safety, air consumption, no-fly calculation, emergency advice, or certified dive-computer behavior.
- Direct SQL or duplicated Supabase schema types.

## Data Model

Add a dedicated plan model rather than overloading `DiveLogEntry`.

```ts
export type DivePlanStatus = 'draft' | 'planned' | 'completed';
export type DiveEntryStyle = 'shore' | 'boat' | 'pool';

export type DivePlan = {
  localId: string;
  status: DivePlanStatus;
  createdAt: number;
  updatedAt: number;
  plannedAt?: number;
  completedAt?: number;
  convertedLogLocalId?: string;

  title?: string;
  diveMode?: WatchSession['diveMode'];
  entryStyle?: DiveEntryStyle;

  site: {
    siteId?: string;
    name?: string;
  };
  buddyIds: string[];
  gearIds: string[];
  tags: string[];
  objective?: string;
  notes?: string;

  plannedValues: DivePlanValues;
  checklistItems: DivePlanChecklistItem[];
};
```

`DivePlanValues` stores planned intent, not measured records:

```ts
export type DivePlanValues = {
  plannedMaxDepthMeters?: number;
  plannedDurationMinutes?: number;
  gasLabel?: string;
  waterCondition?: WatchSession['waterCondition'];
  visibilityExpectation?: number;
  perceivedDifficulty?: number;
  trainingFocus?: string;
  repetitionTarget?: number;
  poolLengthMeters?: number;
  lapTarget?: number;
};
```

Checklist items are local, user-editable reminder state:

```ts
export type DivePlanChecklistItem = {
  id: string;
  label: string;
  completed: boolean;
};
```

`entryStyle` should also be added to Logbook manual metadata, not to measured values. The intended shape is `DiveLogManualFields.entryStyle?: DiveEntryStyle`. It stays optional. Existing manual logs and watch imports must not receive a default value. Unknown entry style and `shore` are different facts.

## Mode-Specific Fields

The editor uses `diveMode` as the primary form axis and `entryStyle` as a separate route/context axis.

Common fields:

- title
- planned date/time
- status action: save draft or set planned
- dive mode
- entry style
- site
- buddies
- gear
- tags
- objective
- notes
- checklist items

Scuba fields:

- planned max depth
- planned duration
- gas label
- water condition
- visibility expectation
- perceived difficulty
- gear
- objective

Freedive fields:

- planned max depth
- planned session duration
- repetition target
- training focus
- perceived difficulty
- water condition
- buddy or safety observer reminder through checklist

Snorkel fields:

- site
- entry style
- water condition
- visibility expectation
- objective or marine-life notes
- gear

Pool fields:

- pool length
- lap target
- planned session duration
- training focus
- gear

Pool plans do not need a planned max depth field. If the user changes a plan to a different mode, hidden mode-specific fields should not be persisted as active values unless still relevant to the selected mode.

## Screen Flow

`PlanningScreen` gains local route state:

```ts
type LocalRoute = 'list' | 'create' | 'detail' | 'edit';
```

### List Route

The top of the screen shows an Active Plan panel. Selection priority:

1. nearest future `planned` plan by `plannedAt`,
2. latest `planned` plan if no future date exists,
3. latest `draft`,
4. empty state with a create action.

The panel shows:

- title or generated fallback,
- site,
- planned date,
- status,
- dive mode,
- entry style when set,
- checklist progress,
- key planned values that are clearly labeled as planned values.

The plan list below supports filters:

- All
- Draft
- Planned
- Completed

Rows show title/site/date/status/dive mode/entry style. Pressing a row opens detail.

### Detail Route

Detail displays:

- common metadata,
- mode-specific planned values,
- checklist state,
- non-certified reminder copy,
- actions.

Actions:

- Edit
- Complete, for draft/planned plans
- Delete
- Create log from plan, for completed plans

### Editor Route

Create and edit share the same editor. Save actions:

- Save draft
- Set planned

The editor keeps invalid numeric values as `undefined` rather than saving `0`. Date parsing should follow the existing Logbook editor pattern for now.

### Complete Dialog

When a plan first transitions from non-completed to `completed`, show a lightweight dialog:

- Create log from this plan
- Later

The dialog must not block completion. Choosing Later leaves the plan completed. Completed plan detail continues to show `Create log from plan`.

## Plan-To-Log Draft Mapping

Creating a log from a completed plan opens the Logbook manual editor with a draft entry. It does not save a completed log automatically.

Safe metadata copied into the Logbook draft:

- site
- buddy IDs
- gear IDs
- tags
- dive mode
- entry style
- gas label
- objective/training focus folded into notes

Not copied into measured Logbook fields:

- planned max depth
- planned duration
- visibility expectation
- perceived difficulty
- checklist state

The handoff can carry the source plan id in temporary app state while opening the Logbook editor. This first implementation does not need a persisted plan id on the log entry. After the user saves the generated log draft, the source plan should update `convertedLogLocalId` to the saved log entry id.

## Architecture

Add a planning repository boundary similar to Logbook:

- `src/types/dive-plan.ts`
- `src/repositories/dive-plan-repository.ts`
- `src/repositories/local-dive-plan-repository.ts`
- `src/states/use-dive-plans.ts`
- `src/states/use-dive-plan-queries.ts`

The local repository stores cloned `DivePlan` values in a `Map` by `localId`, exposes `list`, `get`, `save`, and `delete`, and sorts by active planning relevance. It should be deterministic and dependency-light.

Planning UI can be split into focused files if `screen.tsx` becomes too large:

- `plan-editor.tsx`
- `plan-detail.tsx`
- `plan-list.tsx`
- `plan-mode-fields.tsx`

This follows the recent Logbook editor split and keeps mode-specific fields isolated.

`App` or navigation state should pass the planning hook into `PlanningScreen`, similar to Logbook. If plan-to-log draft creation needs to open Logbook editor with a prefilled draft, the app-level navigation boundary must support an optional pending log draft. Keep this explicit rather than coupling the repositories.

## UI Copy And Safety

Use wording such as:

- planning reminder
- planned value
- confirm with training and certified equipment
- non-certified assistant

Avoid wording that implies:

- decompression advice,
- safe ascent instruction,
- no-fly calculation,
- emergency recommendation,
- certified equipment replacement.

No calculations should be introduced for safety stop, no-fly, NDL, tissue loading, or gas-switching safety.

## Testing

Add focused tests before implementation:

- Repository list/save/delete and clone behavior.
- Plan list shows active plan priority.
- Creating a plan stores draft/planned status.
- Editing an existing plan does not duplicate it.
- Completing a plan sets `completedAt` and shows the log prompt.
- Later keeps the completed plan without opening Logbook.
- Create log from completed plan opens Logbook editor with safe metadata.
- Planned max depth/duration do not become Logbook measured values.
- Plan editor hides and does not persist irrelevant mode-specific fields.
- Logbook editor can set optional `entryStyle`.
- Existing watch/manual entries without `entryStyle` do not receive false defaults.

Verification gates:

- `yarn workspace @repo/mobile test planning --runInBand` or the closest focused Jest target.
- `yarn workspace @repo/mobile test logbook-manual-entry --runInBand`.
- `yarn mobile:typecheck`.
- `yarn codex:check` after wiki/domain updates.

## Documentation Updates

Update `.wiki/wiki/architecture/mobile.md` to describe Planbook repository and local route behavior.

Update or add a planning domain page that states:

- plan values are intent,
- log values are actual records,
- plan-to-log copies safe metadata only,
- safety-critical calculations remain out of scope.

Update `.wiki/wiki/domains/dive-log.md` for optional `entryStyle` on Logbook entries.

Update `.wiki/wiki/domains/safety-rules.md` if any new copy touches ascent, safety stop, no-fly, or similar concepts.

## Concerns

- The first implementation remains in-memory like Logbook. Plans will not survive app restart until a shared production persistence layer is introduced.
- Adding both `diveMode` and `entryStyle` increases form complexity. The editor should keep the visual hierarchy tight and avoid turning every field into a required decision.
- `Create log from plan` needs an explicit app-level handoff into Logbook editor. This should be designed as a small navigation/data handoff, not a hidden repository side effect.
- Planned depth/duration must stay visually and structurally separate from actual measured log values, or data quality will degrade.
- Rich mode-specific plan fields will likely need a schema refinement later, especially for scuba gas/gear and freedive training terminology.
