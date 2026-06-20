# Monorepo Architecture

## Summary

The repository is a Yarn 1 workspace monorepo managed by Turborepo. App workspaces live under `apps/`; shared packages live under `packages/`.

## Current state

Root `package.json` declares:

- `packageManager`: `yarn@1.22.22`
- workspaces: `apps/*` and `packages/*`
- Turborepo as the root dev dependency

Root scripts:

- `yarn build`: `turbo run build`
- `yarn generate`: `turbo run generate`
- `yarn check:quick`: contract generation through `yarn generate`
- `yarn mobile:typecheck`: mobile TypeScript check
- `yarn ios:build`: mobile iOS build wrapper
- `yarn watch:build`: watchOS Xcode build wrapper
- `yarn codex:check`: `check:quick`, `mobile:typecheck`, and `watch:build`

## Details

Workspace responsibilities:

- `apps/mobile` owns the React Native mobile app, mobile review flows, planning reminders, memory preview, and future auth/cloud user flows.
- `apps/watch-ios` owns the watchOS SwiftUI app, watch-side recording, local watch persistence, and sync-ready export payloads.
- `packages/contracts` owns JSON Schema contracts and generated TypeScript/Swift contract outputs.
- `packages/shared-utils` is currently reserved and has no source implementation.

Generated contract outputs under `packages/contracts/generated/` are derived artifacts. Update schemas or generators, then run generation; do not hand-edit generated outputs.

The root `turbo.json` defines `build`, `generate`, `lint`, and `test` tasks. `build` and `generate` can write `generated/**` outputs.

## Related pages

- [[architecture/mobile]]
- [[architecture/watch-app]]
- [[architecture/sync-flow]]
- [[architecture/supabase]]
