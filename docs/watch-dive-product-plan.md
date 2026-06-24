# Watch Dive Product Plan

This is a product planning document, not an implementation spec. It summarizes what divers appear to value in Apple Watch diving, what paid dive apps retain users with, and how this repository could phase features across the watchOS app and future React Native mobile app.

## Research Summary

Sources checked on 2026-06-13:

- Apple Watch product page: https://www.apple.com/watch/
- Oceanic+ features: https://www.oceanicworldwide.com/oceanic-plus/
- Oceanic+ subscription: https://www.oceanicworldwide.com/oceanicplus-subscription/
- Lifewire Oceanic+ launch coverage: https://www.lifewire.com/take-your-apple-watch-ultra-to-greater-depths-with-this-new-app-6833117
- Vogue Apple Watch Ultra overview: https://www.vogue.com/article/apple-watch-ultra-what-you-need-to-know
- Suunto Ocean product page: https://www.suunto.com/Products/dive-computers-and-instruments/suunto-ocean/suunto-ocean-all-black/
- TechRadar Garmin Descent Mk3i review: https://www.techradar.com/health-fitness/smartwatches/garmin-descent-mk3i-review
- General dive computer function reference: https://en.wikipedia.org/wiki/Dive_computer

## What Attracts Divers

1. Reliable underwater core metrics
   - Current depth, max depth, elapsed dive time, water temperature, ascent awareness, no-stop/no-decompression context, and safety stop support are table stakes for scuba.
   - For this app, do not promise decompression-computer behavior until algorithm, validation, liability, and platform limits are explicitly handled.

2. Apple Watch convenience
   - Divers are attracted to a device they already wear daily.
   - The strongest Apple Watch angle is "good enough dive capture without a separate device" for recreational or casual use, especially when paired with simple post-dive logs.

3. Underwater readability and low-friction controls
   - Large, high-contrast numbers, few screens, haptic alerts, and glove/wetsuit-friendly operation matter more than dense UI.
   - The watch should show only immediately useful underwater information; mobile can hold analysis and editing.

4. Planning and post-dive confidence
   - Paid apps retain users through pre-dive planning, no-fly/surface interval tracking, location/weather/marine context, logs, maps, media, and sharing.
   - Repeated dive trips create retention when users can see dive history, streaks, sites, buddies, gear, and conditions.

5. Rich memory layer
   - Oceanic+ and Suunto emphasize maps, activity history, media, heatmaps, sharing, and automatic color correction.
   - A differentiated app can focus less on replacing pro dive computers and more on making each dive easy to remember, review, and share.

## Product Positioning

Recommended positioning:

"A lightweight Apple Watch dive logger for recreational divers that captures depth/time context on the watch and turns each dive into a rich, searchable mobile logbook."

Avoid positioning in early versions:

- Full certified dive computer
- Technical diving computer
- Primary life-support/safety device
- Air integration or decompression planner without validated hardware and algorithm work

## Feature Allocation

### watchOS App

- Pre-dive: select mode, gas label for log metadata, planned site, expected max depth, buddy, and quick notes.
- During dive: current depth, elapsed time, max depth, water temperature, simple ascent-rate indicator, safety-stop timer, large warnings, haptics.
- Post-dive: summary, perceived exertion/rating, visibility, water condition, quick note, save/sync state.
- Offline-first: keep local records if iPhone is unavailable.

### Mobile App

- Dive logbook: list, detail, search, filters, site grouping, buddy/gear tags.
- Visual review: depth-over-time chart, water temperature chart, map entry/exit when available, session timeline.
- Planning: site notes, recent conditions, packing checklist, no-fly/surface interval display.
- Memory: photos/videos linked to dives, color correction/import workflow, share card export.
- Account/server later: backup, multi-device sync, social sharing, dive shop/trip integration.

## Priority Matrix

### P0 Foundation

- Make existing watch session model explicit and durable.
- Add sync-ready contract fields for depth samples, temperature, start/end, location placeholders, mode, tags, notes, and ratings.
- Keep all safety language conservative.

### P1 Watch Capture

- Improve underwater recording UX: readable metrics, haptic alerts, post-dive summary, local persistence.
- Add a non-certified safety-stop assistant and ascent-rate warning only if sensor access is reliable.

### P2 Mobile Logbook

- Scaffold mobile app around dive history, charts, tags, notes, and media attachment.
- Mobile owns browsing, editing, and sharing; watch owns capture.

### P3 Planning and Retention

- Add trip/site planning, surface interval/no-fly display, gear/buddy history, and recurring dive insights.
- Build features that reward repeated use without requiring real-time underwater risk computation.

### P4 Premium Candidates

- Advanced log analytics, export/share templates, media color correction, site condition history, cloud backup, family/group trip logs.
- Decompression planning, air integration, and certified dive computer behavior are separate high-risk epics.

## Epic Plan: Watch-first Recreational Dive Logger

### Phase 0 Investigation

- Goal: Decide exact MVP boundary and validate available watchOS sensor APIs in this repo.
- Files to inspect: `apps/mobile/ios/DiveWatchApp`, `apps/mobile`, `packages/contracts/schemas`, `packages/contracts/generated`.
- Implementation: no feature code; inspect current models, sensor placeholders, storage, and contract shape.
- Gate: written MVP boundary with explicit "not a certified dive computer" safety scope.
- Risk: Apple Watch underwater sensor behavior may not be accessible in simulator and may require real device validation.

### Phase 1 Contract

- Goal: Define cross-platform dive-session contract before UI work.
- Files: `packages/contracts/schemas/*.schema.json`, generator scripts only if required.
- Implementation: add fields for samples, temperature, dive mode, surface metadata, user notes, ratings, site/buddy/gear IDs, sync status.
- Gate: `yarn check:quick`.
- Risk: schema changes can force watch/mobile migration decisions.

### Phase 2 Core Implementation

- Goal: Improve watch capture and local log quality without introducing certified dive-computer claims.
- Files: `apps/mobile/ios/DiveWatchApp/Models`, `Recording`, `Storage`, `Views`.
- Implementation: large metric UI, robust session lifecycle, haptic events, summary, local persistence and sync-ready export.
- Gate: `yarn watch:build`.
- Risk: simulator cannot validate real underwater sensor accuracy or haptic usability through wetsuits.

### Phase 3 Integration

- Goal: Add mobile logbook as the primary review and retention surface.
- Files: future `apps/mobile` app, `packages/contracts`, shared utilities only after real reuse exists.
- Implementation: session list, dive detail charts, tags, notes, media attachment placeholders, import from watch contract.
- Gate: mobile scaffold-specific build/test command plus `yarn codex:check`.
- Risk: mobile app is currently placeholder; framework and UI system are manual setup required.

### Phase 4 Cleanup/Review

- Goal: Convert MVP into repeatable product workflow.
- Files: docs and AGENTS updates if new commands exist.
- Implementation: document safety copy, manual device test checklist, data migration notes, and next premium candidates.
- Gate: `yarn codex:check` plus manual Apple Watch device test checklist.
- Risk: legal/safety positioning must be reviewed before public release.

## Stop Rule

If `yarn check:quick`, `yarn watch:build`, or the future mobile build gate fails three times with the same cause, stop and report a blocker instead of widening scope.
