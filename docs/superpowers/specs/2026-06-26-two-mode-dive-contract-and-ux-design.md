# Two-Mode Dive Contract And UX Design

## Goal

Reduce the product model to two dive modes, `scuba` and `freedive`, and align the watch, mobile Logbook, Planning, schema, generated types, validation, and UI around those two modes.

This is a PoC reset. Existing local Logbook and Planbook data may be discarded instead of migrated.

## Scope

In scope:

- Change the watch sync contract `diveMode` enum to `scuba | freedive`.
- Remove `snorkel`, `pool`, and `unknown` from generated TypeScript/Swift, runtime validator, fixtures, mobile editors, watch enum, watch picker, and i18n.
- Bump local storage namespace or schema version so existing v1 Logbook and Planbook entries are not read.
- Redesign scuba and freedive editor sections in Logbook and Planning.
- Redesign watch recording first viewport per mode.
- Preserve the safety boundary: scuba information is non-certified reference data, not a dive-computer calculation.

Out of scope:

- Data migration for existing local logs or plans.
- Supabase schema or remote data migration.
- Decompression obligation, tissue loading, gas switching safety, emergency instruction, tank pressure, or certified dive computer behavior.
- Real Apple Watch underwater sensor implementation.

## Contract

`packages/contracts/schemas/watch-session.schema.json` should allow only:

```json
["scuba", "freedive"]
```

After schema change:

- Regenerate TypeScript and Swift contract output.
- Update `watch-sync-message-validation.ts` enum validation.
- Update fixtures to use only supported values.
- Update Swift `DiveMode` to only include `scuba` and `freedive`.
- Remove UI fallback copy that exposes `unknown` as a user-selectable or display mode.

Any local storage reset must be explicit in code and documentation. Since this is a PoC, failing to migrate v1 mode values is acceptable only if the app starts with empty v2 stores.

## Mobile UX

Logbook editor:

- Show only Scuba and Freedive mode choices.
- Scuba fields: date/time, site, entry style, planned or actual duration, max depth, gas label defaulting to air where appropriate, buddy, gear, water condition, visibility, exertion, notes, rating.
- Freedive fields: date/time, site, entry style, session duration, max depth, repetition count, training focus, exertion, buddy/safety observer notes, notes, rating.
- Hide pool length, lap count, snorkel section, and any pool-specific entry style assumptions.

Planning:

- Show only Scuba and Freedive plans.
- Scuba plan values: planned max depth, planned duration, gas label, gear, checklist, objective, notes.
- Freedive plan values: target max depth, session duration, repetition target, training focus, buddy/safety observer reminder, objective, notes.
- Planned values remain intent and must not become measured Logbook values without user confirmation or watch capture.

Detail/review:

- Show watch-measured fields as locked/provenance `watch`.
- Show scuba reference assistant values as review data, not certified safety output.
- Avoid any copy that suggests decompression obligation or equipment replacement.

## Watch UX

Mode picker:

- Show Scuba and Freedive only.
- Default to Scuba unless user preference stores Freedive.

Scuba recording first viewport must show without scrolling:

- current depth
- elapsed time
- max depth
- ascent-rate reference
- safety-stop reference state and remaining time when active
- compact non-certified reference wording

Lower priority scuba details can scroll below:

- water temperature
- site/plan title
- gas label
- longer disclaimer
- end action placement as long as it remains reachable

Freedive recording first viewport must show without scrolling:

- current depth
- session time
- max depth
- repetition or session context when available
- concise training/reference wording

Freedive should not show scuba-only safety stop or gas information.

## Safety Boundary

Scuba mode may display an "air scuba reference assistant" for ascent-rate and safety-stop reminders. It must not calculate decompression obligation, tissue saturation, no-decompression limits, gas switching safety, emergency actions, or certified equipment replacement guidance.

Recommended copy pattern:

- "Reference only. Use training and certified equipment."
- "Air scuba reminder, not a dive computer."

Avoid:

- "Safe to ascend"
- "No decompression required"
- "Required stop"
- "Emergency instruction"

## Testing

- Run contract generation and `yarn check:quick`.
- Add tests proving validator rejects removed dive modes.
- Add tests for storage reset/version behavior.
- Add mobile Logbook and Planning tests for two-mode editor behavior.
- Add watch source tests or source scans that removed modes are absent from active picker/model code.
- Run `yarn mobile:typecheck`.
- Run `yarn watch:build`.
- Run `yarn workspace @repo/mobile watch:ui:check`.
- Run `yarn codex:check`.

## Sources

- User-approved direction on 2026-06-26.
- `packages/contracts/schemas/watch-session.schema.json`
- `apps/mobile/src/utils/watch-sync-message-validation.ts`
- `apps/mobile/src/types/dive-log-entry.ts`
- `apps/mobile/src/types/dive-plan.ts`
- `apps/mobile/src/screens/logbook/log-entry-editor.tsx`
- `apps/mobile/src/screens/planning/plan-mode-fields.tsx`
- `apps/mobile/ios/DiveWatchApp/Models/DiveSession.swift`
- `apps/mobile/ios/DiveWatchApp/Views/RecordingView.swift`
- `.wiki/wiki/domains/safety-rules.md`
