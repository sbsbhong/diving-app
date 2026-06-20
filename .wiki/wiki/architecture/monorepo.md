# Monorepo 구조

## 요약

이 저장소는 Turborepo로 관리되는 Yarn 1 workspace monorepo다. 앱 workspace는 `apps/` 아래에 있고, 공유 package는 `packages/` 아래에 있다.

## 현재 상태

Root `package.json`의 현재 선언은 다음과 같다.

- `packageManager`: `yarn@1.22.22`
- workspaces: `apps/*`, `packages/*`
- root 개발 의존성: `turbo`

Root script는 다음 역할을 한다.

- `yarn build`: `turbo run build`
- `yarn generate`: `turbo run generate`
- `yarn check:quick`: `yarn generate`를 통한 계약 생성
- `yarn mobile:typecheck`: mobile TypeScript check
- `yarn ios:build`: mobile iOS build wrapper
- `yarn watch:build`: watchOS Xcode build wrapper
- `yarn codex:check`: `check:quick`, `mobile:typecheck`, `watch:build`

## 상세

Workspace 책임은 다음과 같다.

- `apps/mobile`: React Native 모바일 앱, 모바일 확인 흐름, 계획 알림, 기억 미리보기, 향후 인증/cloud 사용자 흐름을 담당한다.
- `apps/watch-ios`: SwiftUI watchOS 앱, watch 쪽 기록, 로컬 watch 저장, 동기화 가능한 export payload를 담당한다.
- `packages/contracts`: JSON Schema contract와 generated TypeScript/Swift contract output을 담당한다.
- `packages/shared-utils`: 현재 source implementation이 없는 예약된 workspace다.

`packages/contracts/generated/` 아래 output은 생성된 산출물이다. Schema나 generator를 수정한 뒤 generation을 실행해야 하며, generated output을 직접 수정하지 않는다.

Root `turbo.json`은 `build`, `generate`, `lint`, `test` task를 정의한다. `build`와 `generate`는 `generated/**` output을 만들 수 있다.

## 관련 문서

- [[architecture/mobile]]
- [[architecture/watch-app]]
- [[architecture/sync-flow]]
- [[architecture/supabase]]
