# Safety Rules

## Summary

This app is a recreational dive logging and companion app. It is not a certified dive computer, decompression computer, medical device, emergency system, or replacement for certified dive equipment.

## Current state

Current app surfaces may record and review dive logs, display historical summaries, import watch-captured activity data, and show non-critical planning reminders. They must not present sensor data or derived summaries as safety-critical truth.

## Details

Do not describe the app as:

- calculating decompression obligations
- calculating tissue loading
- making gas switching safety decisions
- giving life-critical underwater instructions
- replacing a certified dive computer or certified dive equipment
- providing medical, legal, or emergency recommendations
- treating unverified Apple Watch sensor data as authoritative safety data

Allowed framing:

- recreational dive logging
- companion recording
- post-dive review
- historical summaries
- watch-captured activity sync
- non-certified planning reminders
- non-certified ascent and safety-stop assistant status

Current watch and mobile surfaces mention ascent, safety stop, surface interval, and no-fly concepts only as assistants, review states, or manual planning reminders. This boundary must stay explicit in UI copy and documentation.

Real underwater Apple Watch sensor behavior must be validated manually on supported hardware before public release. Simulator or mock sensor behavior is not evidence of real underwater correctness.

Features involving decompression planning, air integration, tank pressure, emergency decisions, or certified dive-computer behavior are separate high-risk work and require explicit product, validation, and liability decisions before implementation.

## Related pages

- [[overview]]
- [[architecture/watch-app]]
- [[architecture/mobile]]
- [[domains/dive-log]]
- [[questions/open-questions]]
