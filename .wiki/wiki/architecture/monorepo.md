# Monorepo Architecture

## Summary

이 repository는 Turborepo로 관리되는 Yarn 1 workspace monorepo다. App workspace는 `apps/` 아래에 있고, shared package는 `packages/` 아래에 있다.

## Current state

Root `package.json`의 현재 선언은 다음과 같다.

- `packageManager`: `yarn@1.22.22`
- workspaces: `apps/*`, `packages/*`
- root dev dependency: `turbo`

Root script는 다음 역할을 한다.

- `yarn build`: `turbo run build`
- `yarn generate`: `turbo run generate`
- `yarn check:quick`: `yarn generate`를 통한 contract generation
- `yarn mobile:typecheck`: mobile TypeScript check
- `yarn ios:build`: mobile iOS build wrapper
- `yarn watch:build`: watchOS Xcode build wrapper
- `yarn codex:check`: `check:quick`, `mobile:typecheck`, `watch:build`

## Details

Workspace responsibility는 다음과 같다.

- `apps/mobile`: React Native mobile app, mobile review flow, planning reminder, memory preview, future auth/cloud user flow를 담당한다.
- `apps/watch-ios`: SwiftUI watchOS app, watch-side recording, local watch persistence, sync-ready export payload를 담당한다.
- `packages/contracts`: JSON Schema contract와 generated TypeScript/Swift contract output을 담당한다.
- `packages/shared-utils`: 현재 source implementation이 없는 reserved workspace다.

`packages/contracts/generated/` 아래 output은 generated artifact다. Schema나 generator를 수정한 뒤 generation을 실행해야 하며, generated output을 직접 수정하지 않는다.

Root `turbo.json`은 `build`, `generate`, `lint`, `test` task를 정의한다. `build`와 `generate`는 `generated/**` output을 만들 수 있다.

## Related pages

- [[architecture/mobile]]
- [[architecture/watch-app]]
- [[architecture/sync-flow]]
- [[architecture/supabase]]
