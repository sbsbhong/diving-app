# Mobile form validation and pressure metadata

Date: 2026-06-28
Source: user request in implementation session

## User request

The mobile Logbook and Planning forms need stronger validation and clearer input controls:

- Date/time should be selected with a calendar/date picker rather than free text.
- Each field should be validated with `react-hook-form` and `zodResolver`, with visible error messages.
- Required and optional fields should be visually distinguished.
- Duration/depth fields should support numeric entry and slider adjustment.
- Visibility and rating-like fields should be shown as star controls.
- Scuba gas is currently Air-only and should be displayed as such.
- CSV fields such as buddies, tags, and gear should commit comma-delimited values as removable badges.
- Scuba logs and plans should allow start/end pressure in `psi` or `bar`.

## Accepted implementation boundary

Pressure is stored only as log or planning metadata:

- Logbook scuba entries may store `manual.measuredValues.pressure` with `unit`, `start`, and `end`.
- Planbook scuba entries may store `plannedValues.plannedPressure` with `unit`, `start`, and `end`.
- Completed plans may copy planned pressure into the editable Logbook draft, but planned depth and planned duration are not copied into measured log values.

This pressure metadata is not air integration, gas remaining, reserve, turn pressure, emergency instruction, or certified dive-computer behavior. Any feature that interprets tank pressure for safety decisions remains out of scope until a separate product and validation decision exists.
