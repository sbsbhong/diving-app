# Watch Dive Implementation Notes

## Implemented MVP Boundary

- The watch app captures recreational dive sessions with pre-dive metadata, large live metrics, post-dive ratings, local persistence, and sync-ready status.
- The mobile app imports generated watch sync fixtures into a local logbook, planning surface, and memory/premium preview surface.
- The shared contract includes optional metadata for site, gas, buddies, gear, notes, ratings, water condition, sync status, and entry/exit location placeholders.

## Safety Boundary

- This product is not a certified dive computer.
- Ascent, safety-stop, surface interval, and no-fly surfaces are non-certified assistants or manual planning reminders only.
- Decompression planning, air integration, tank pressure, emergency decisions, and medical guidance require separate research, validation, and approval.

## Manual Device Validation Required

- Apple Watch Ultra or supported hardware sensor behavior underwater.
- Haptic usability through wetsuits/gloves.
- Readability of live metrics underwater.
- Physical crown/touch operation while wet.
- Real WatchConnectivity pairing and entitlement setup.

## Deferred Premium Candidates

- Share card export rendering.
- Media import and color correction.
- Cloud backup and multi-device sync.
- Group trip logs and social sharing.
- Certified dive computer behavior, decompression planning, and air integration.

