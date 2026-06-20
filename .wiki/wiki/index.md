# Dive App Wiki

## Summary

This wiki records durable project knowledge for the `diving-app` monorepo. It should help future agents and developers understand the current architecture, boundaries, contracts, safety rules, and known open questions without treating plans as implemented facts.

## Current state

- [[overview]] gives the project-level snapshot.
- [[architecture/monorepo]] covers workspace layout, package roles, and repo commands.
- [[architecture/mobile]] covers the React Native mobile app.
- [[architecture/watch-app]] covers the active watchOS app and Xcode project.
- [[architecture/sync-flow]] covers watch-to-mobile contract and import flow.
- [[architecture/supabase]] records the current Supabase absence and intended boundary.
- [[domains/dive-log]] defines the current dive log data model.
- [[domains/diving-glossary]] defines durable diving terms used in the app.
- [[domains/safety-rules]] records product safety boundaries.
- [[decisions/adr-index]] indexes accepted ADRs when they exist.
- [[questions/open-questions]] tracks uncertain or unimplemented areas.
- [[log]] records factual wiki update history.

## Details

Use code and explicit repository instructions as the primary sources. If a future update changes architecture, contracts, app boundaries, sync behavior, Supabase behavior, domain meaning, or safety language, update the smallest relevant wiki pages and append an entry to [[log]].

## Related pages

- [[overview]]
- [[architecture/monorepo]]
- [[domains/safety-rules]]
