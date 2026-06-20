# Diving Glossary

## Summary

This glossary defines durable domain terms as they are used in the current app. Definitions are scoped to recreational logging and review, not certified dive-computer behavior.

## Current state

The app uses these terms in watch capture, mobile review, planning reminders, and sync contracts.

## Details

- Dive log: a historical record of a recreational dive session.
- Watch capture: session data recorded on the watch, currently through mock depth samples in the app.
- Depth sample: a timestamped measurement containing depth in meters, with optional pressure and water temperature in the shared contract.
- Bottom time: elapsed session duration shown for review; it is not a decompression calculation.
- Max depth: deepest recorded depth sample in a session.
- Average depth: arithmetic average of recorded depth samples.
- Water temperature: temperature value attached to samples or summarized for review.
- Ascent-rate reminder: non-certified assistant state derived from changes between depth samples.
- Safety-stop assistant: non-certified reminder state around a shallow-depth stop window; it is not mandatory safety guidance.
- Surface interval: elapsed time since the previous logged dive, shown as planning context only.
- No-fly reminder: manual planning reminder, not a medical or certified aviation/diving recommendation.
- Sync status: local state describing whether a session is `pending`, `synced`, or `failed`.
- Dive mode: session category such as scuba, freedive, snorkel, pool, or unknown.
- Water condition: subjective post-dive condition such as calm, mild, choppy, surge, current, or unknown.

## Related pages

- [[domains/dive-log]]
- [[domains/safety-rules]]
- [[architecture/sync-flow]]
