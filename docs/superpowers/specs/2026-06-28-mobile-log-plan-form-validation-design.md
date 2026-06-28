# Mobile Log And Plan Form Validation Design

## Goal

Strengthen the mobile Logbook and Planning editor forms so users enter structured, validated recreational dive metadata instead of freeform strings. The feature remains limited to logging, review, and non-critical planning reminders. It must not calculate decompression obligations, gas safety, emergency guidance, air consumption recommendations, no-fly timing, or any certified dive-computer behavior.

## Scope

In scope:

- Convert the Logbook editor and Planning editor to `react-hook-form`.
- Use `zodResolver` and per-editor Zod schemas for validation.
- Add direct mobile dependencies for `react-hook-form`, `@hookform/resolvers`, and `zod`.
- Replace free-text date/time fields with the existing mobile `DateTimePicker`.
- Show required markers and field-level validation errors.
- Add reusable form controls for:
  - required labels and error text,
  - numeric input plus slider,
  - 1-5 star rating input,
  - comma-to-badge list input with removable badges,
  - fixed single-option gas label display for scuba.
- Add scuba pressure metadata to both saved logs and plans.
- Update tests for Logbook, Planning, and plan-to-log draft conversion.
- Update the wiki because the mobile dive-log and plan domain models gain pressure metadata.

Out of scope:

- Watch contract/schema changes.
- Watch app UI or WatchConnectivity payload changes.
- Supabase schema, auth, cloud sync, or generated database types.
- Gas switching, decompression, reserve calculation, SAC/RMV calculation, or equipment safety advice.
- Reworking navigation or replacing the existing gluestack UI primitives.

## Dependencies

`apps/mobile/package.json` should declare the requested validation stack directly:

- `react-hook-form`
- `@hookform/resolvers`
- `zod`

`zod` is currently present only transitively in the root lockfile. It should be made explicit for the mobile workspace before mobile source imports it.

The existing `DateTimePicker`, `Slider`, `Badge`, `FormControl`, `Input`, `Textarea`, `HStack`, and `VStack` primitives should be reused. No additional UI package is needed.

## Required Fields

Required status should be visible in the label and enforced by Zod.

Logbook required fields:

- `startedAt`
- `diveMode`
- `siteName`
- `durationMinutes`
- `maxDepthMeters`

Planning required fields when saving as `planned`:

- `plannedAt`
- `diveMode`
- `siteName`
- `plannedDurationMinutes`
- `plannedMaxDepthMeters`

Planning required fields when saving as `draft`:

- No metadata field is required beyond the existing local id/status shape.
- Any field the user has filled must still pass validation.

## Field Behavior

### Date And Time

The Logbook `startedAt` and Planning `plannedAt` controls should use `DateTimePicker` in `datetime` mode. The form value should be a `Date | undefined` inside the editor and converted to seconds since epoch only in the existing save transformation boundary.

The input should not accept arbitrary date strings. This removes the current `YYYY-MM-DD HH:mm` parser from user-facing editing.

### Numeric Input Plus Slider

Duration, depth, and pressure controls should combine a numeric `Input` with a horizontal `Slider`. Editing either control updates the same form field.

Recommended ranges:

- duration minutes: `0` to `240`, step `1`
- max depth meters: `0` to `60`, step `0.5`
- bar pressure: `0` to `300`, step `1`
- psi pressure: `0` to `4500`, step `50`

The schema should reject negative values, non-finite numbers, and values above the unit range. Depth and duration remain ordinary records or reminders, not safety limits.

### Star Ratings

Ratings should use a reusable 1-5 star control:

- Logbook `rating`
- Logbook scuba `visibilityRating`
- Logbook `perceivedExertion`
- Planning `visibilityExpectation`
- Planning `perceivedDifficulty`

The control stores `number | undefined`. Pressing a selected star again may clear the optional field. Required star fields are not part of the first implementation.

### Gas Label

For scuba, `gasLabel` is fixed to `Air`. The UI should display one selected option and should not allow free text entry or alternate gas labels in this implementation.

For freedive, gas label is hidden and not persisted.

### Badge Lists

Comma-separated string fields should become list inputs:

- Logbook `buddies`
- Logbook scuba `gearIds`
- Logbook `tags`
- Logbook `observedMarineLife`
- Planning `buddies`
- Planning `gearIds`
- Planning `tags`

Typing a comma commits the text before the comma as a badge. Pressing the keyboard submit action should also commit the pending token. Empty tokens and duplicate tokens should be ignored. Each badge should expose an `x` press target that removes that value.

The saved model remains string arrays; only the editor interaction changes.

### Scuba Pressure

The mobile domain models should add a lightweight pressure value:

```ts
export type DivePressureUnit = 'bar' | 'psi';

export type DivePressureValues = {
  unit?: DivePressureUnit;
  start?: number;
  end?: number;
};
```

Logbook scuba pressure stores actual recorded metadata:

```ts
type DiveLogManualMeasuredValues = {
  pressure?: DivePressureValues;
};
```

Planning scuba pressure stores reminder metadata:

```ts
type DivePlanValues = {
  plannedPressure?: DivePressureValues;
};
```

The editor should expose a `bar`/`psi` segmented control plus start and end pressure numeric-slider controls. The unit defaults to `bar` for new records. Pressure fields are optional; if either value is entered, the unit must be set. If both values are entered, the end value may be lower than start, but no safety interpretation is displayed.

When a plan is converted into a log draft, planned pressure may be copied into the manual draft as editable starting values with manual provenance. It must remain user-editable and must not be treated as watch-captured truth.

## Data Flow

The editors should keep form state in `react-hook-form` and convert to existing domain objects only after validation passes.

Logbook flow:

1. Convert `DiveLogEntry` to `LogEntryFormValues`.
2. Render controlled fields via `Controller` or `useController`.
3. Validate with `logEntrySchema`.
4. Convert valid form values to `DiveLogEntry` using the existing provenance-preserving save logic.
5. Preserve watch fallback behavior for untouched watch-captured fields where it currently exists.

Planning flow:

1. Convert `DivePlan` to `PlanFormValues`.
2. Render controlled fields via `Controller` or `useController`.
3. Validate with a schema selected by save action: draft or planned.
4. Convert valid form values to `DivePlan`.
5. Keep planned values clearly labeled as planning reminders.

## Error Handling

Field-level errors should render below the affected control through `FormControlErrorText`. Submit-level local save errors should continue using the existing editor error banner.

Validation error messages should be concrete:

- required field: `Required`
- invalid number: `Enter a valid number`
- value below range: `Must be 0 or more`
- value above range: `Must be {{max}} or less`
- invalid rating: `Choose 1 to 5 stars`

Korean and English resource entries should be added for user-facing labels and validation messages.

## Testing

Tests should follow TDD for each behavior slice.

Minimum tests:

- Logbook submit blocks invalid required fields and shows field errors.
- Logbook date/time value is saved from the picker value, not a typed string.
- Logbook duration/depth numeric controls save numbers after validation.
- Logbook scuba gas label is fixed to `Air`.
- Logbook badge input commits comma-separated values and removes badges.
- Logbook scuba pressure saves unit/start/end values.
- Planning planned save blocks missing required fields.
- Planning draft save allows missing planned fields but rejects invalid filled fields.
- Planning badge and pressure values persist.
- Plan-to-log draft conversion carries safe metadata, including editable pressure, without adding safety calculations.

Verification gates:

- targeted Jest tests for Logbook/Planning behavior,
- `yarn mobile:typecheck`,
- `yarn codex:check` after wiki/domain updates when feasible.

## Safety Boundary

All pressure, gas, depth, duration, visibility, and rating fields are record or reminder metadata. The UI must not use these values to compute whether a dive is safe, whether gas is sufficient, whether a stop is required, whether a diver may ascend, or whether a diver may fly.

Any explanatory copy should continue to use the existing non-certified assistant and planning-reminder language.
