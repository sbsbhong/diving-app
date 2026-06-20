# Mobile App Agent Guide

이 파일은 `apps/mobile` 아래의 React Native 모바일 앱에 적용된다. 루트 `AGENTS.md` 지침도 함께 따른다.

## 앱 목적

`apps/mobile`은 다이빙 로그를 탐색하고 watch-captured 세션을 리뷰하는 모바일 surface다. 현재는 production backend가 없는 scaffold 상태이며, generated watch contract type과 fixture import를 사용해 앱 구조와 UX boundary를 잡고 있다.

장기적으로 모바일 앱은 authentication, user profile, dive log list/detail, manual dive creation, Supabase sync, statistics, search, planning, memory/share, backup flow의 중심이 된다. watch 앱에서 온 원본 기록은 손실 없이 보존하고, server/user 연결은 향후 모바일 또는 backend layer에서 처리한다.

## 현재 Stack

- Bare React Native app, React Native `0.85.3`
- React `19.2.3`
- TypeScript, Jest, ESLint, Metro
- `react-native-safe-area-context`
- Custom bottom-tab navigation in app code
- 별도 navigation library, UI library, icon library, styling framework는 현재 없다.

새 dependency나 UI framework를 추가하려면 명시적 필요성과 기존 패턴으로 해결할 수 없는 이유가 있어야 한다.

## Source 구조

- `src/App.tsx`: app UI entry
- `src/providers.tsx`: `SafeAreaProvider`와 top-level status bar
- `src/components/navigation/index.tsx`: custom bottom-tab navigation state
- `src/components/ui/`: reusable primitives, instruments, cards, session profile, theme tokens
- `src/screens/home/screen.tsx`: latest session과 high-level metrics
- `src/screens/logbook/screen.tsx`: imported session list, search/filter, detail review
- `src/screens/planning/screen.tsx`: non-certified planning reminder UI
- `src/screens/memory/screen.tsx`: static memory/share preview
- `src/states/use-dive-logbook.ts`: local in-memory logbook state와 fixture import action
- `src/types/dive-session.ts`: generated watch contract type 기반 mobile session type
- `src/utils/`: formatter, watch fixture import, summary 계산
- `ios/`, `android/`: native projects

## 책임 범위

모바일 앱이 담당한다.

- 로그인과 사용자 profile, 해당 layer가 구현된 뒤의 session ownership
- dive log list/detail, review, search, filtering
- manual dive log creation과 future editing flow
- watch sync payload import와 imported values 보존
- Supabase layer가 생긴 뒤의 sync orchestration
- non-certified planning reminder, memory/share preview, statistics

모바일 앱에 넣지 않는다.

- direct SQL
- duplicated Supabase schema type
- watch-only sensor capture logic
- raw watch sample을 삭제하거나 재계산해 원본 의미를 잃는 rewrite
- 감압, 조직 loading, gas switching safety, emergency dive decision 계산
- certified dive computer 또는 medical/emergency recommendation copy

## 작업 지침

- React Native UI 작업 전 실제 framework, component 구조, styling token, package script를 확인한다.
- 현재 앱은 custom navigation과 local UI primitive를 쓴다. 새 navigation/UI/styling library는 승인 없이 추가하지 않는다.
- 화면 변경은 `src/screens/<area>/screen.tsx`에 두고, 재사용되는 표현만 `src/components/ui/`로 올린다.
- app-wide provider 변경은 `src/providers.tsx`에서 처리한다.
- watch sync contract type은 `packages/contracts/generated/typescript`에서 가져온다. generated output은 직접 수정하지 않는다.
- Supabase나 auth가 들어오면 mobile 코드에 직접 SQL을 넣지 말고, 별도 package/repository boundary를 먼저 확인한다.
- 안전 관련 copy는 항상 non-certified assistant, reminder, review wording으로 제한한다.

## Skill 사용

- React Native component, state, performance, native bridge 관련 작업에는 `vercel-react-native-skills`를 사용한다.
- React component API나 architecture refactor가 중심이면 Vercel React skill을 추가로 사용한다.
- iOS native project, CocoaPods, Xcode build, signing, native module 관련 작업에는 `xcode-harness`를 사용한다.
- Supabase/auth/RLS/repository 변경에는 `supabase` skill을 사용한다.
- app boundary, sync behavior, domain model, safety wording이 바뀌면 `wiki-writing`을 사용한다.

## Commands

루트에서 실행한다.

- `yarn workspace @repo/mobile start`
- `yarn workspace @repo/mobile typecheck`
- `yarn workspace @repo/mobile test`
- `yarn workspace @repo/mobile lint`
- `yarn workspace @repo/mobile ios`
- `yarn workspace @repo/mobile android`

루트 alias:

- `yarn mobile:typecheck`
- `yarn ios:build`

iOS native build 전 CocoaPods workspace가 필요하다.

- `yarn workspace @repo/mobile ios:pods`
- `yarn workspace @repo/mobile ios:xcode`

Xcode를 열 때는 `ios/DiveMobile.xcworkspace`를 사용한다. `ios/DiveMobile.xcodeproj`를 직접 열면 React pod module resolution이 깨질 수 있다.

## Verification

- TypeScript/mobile-only 변경: `yarn mobile:typecheck`
- mobile test 대상 변경: `yarn workspace @repo/mobile test`
- iOS native 변경: `yarn ios:build`를 실행하되, Pods나 local Xcode setup이 없으면 그 상태를 정확히 보고한다.
- cross-package contract import 변경: 먼저 `yarn check:quick`, 그 다음 `yarn mobile:typecheck`
