# Watch App Agent Guide

이 파일은 `apps/watch-ios` 아래의 watchOS 앱 workspace에 적용된다. 루트 `AGENTS.md` 지침도 함께 따른다.

## 앱 목적

`apps/watch-ios`는 Apple Watch에서 다이빙 세션을 가볍게 기록하고, 세션 직후 summary와 저장된 기록을 확인하는 SwiftUI watchOS 앱이다. 현재 앱은 PoC이며 mock sensor provider로 recording flow를 검증한다.

watch 앱은 사용자 인증이나 전체 로그북 관리보다, watch-side capture, local temporary state, local persistence, sync-ready export payload에 집중한다. 실제 underwater sensor behavior는 지원 Apple Watch hardware에서 수동 검증되기 전까지 public-ready safety behavior로 취급하지 않는다.

## 현재 Project 상태

- Xcode project: `DiveWatchApp.xcodeproj`
- Target: `DiveWatchApp`
- Scheme: `DiveWatchApp`
- Active source: `DiveWatchApp/`
- Earlier standalone source: `Sources/`

`Sources/` 아래 Swift 파일은 현재 `DiveWatchApp.xcodeproj`에 포함되어 있지 않다. 컴파일되는 앱 코드를 바꿀 때는 기본적으로 `DiveWatchApp/` 아래 파일을 수정한다. `Sources/`를 사용하려면 Xcode project target membership을 명시적으로 확인하고 변경해야 한다.

## Active Source 구조

- `DiveWatchApp.swift`: app entry, `DiveSessionStore` 생성, `HomeView` 표시
- `Models/`: `DepthSample`, `DiveSession`, `DiveSessionSummary`, pre-dive/post-dive metadata, sync payload helper
- `Sensors/`: `DepthSensorProvider`, `MockDepthSensorProvider`, `RealDepthSensorProvider`
- `Recording/`: `DiveSessionRecorder`
- `Storage/`: `DiveSessionStore`, `UserDefaults` 기반 저장
- `Views/`: home, recording, summary, saved sessions, detail views, watch UI formatter

현재 flow:

1. Home에서 mode, gas label, site, buddy, note, planned max depth 같은 pre-dive metadata를 입력한다.
2. `RecordingView`가 나타나면 recording이 시작된다.
3. Recording은 현재 `MockDepthSensorProvider`를 사용한다.
4. Recorder는 sample, current depth, max depth, temperature, elapsed time, ascent reminder, safety-stop assistant state를 추적한다.
5. 종료 후 summary에서 rating, exertion, visibility, water condition, note를 기록한다.
6. 저장된 session은 `UserDefaults`의 `savedDiveSessions` key에 저장되고 list/detail에서 확인한다.

## 책임 범위

watch 앱이 담당한다.

- lightweight watch UI
- pre-dive metadata capture
- mock 또는 future real sensor provider 기반 live recording
- immediate but non-certified awareness UI
- post-dive summary
- offline local persistence와 sync state
- completed record를 mobile 또는 shared sync layer로 보낼 수 있는 payload 준비

watch 앱에 넣지 않는다.

- 복잡한 account management
- full dive history management
- Supabase schema-specific business logic
- direct server persistence
- 감압, 조직 loading, gas switching safety, emergency dive decision 계산
- certified dive computer 또는 life-support claim

Underwater watch UI는 current depth, elapsed time, max depth, water temperature, ascent awareness, safety-stop assistant status처럼 high-priority 정보만 보여야 한다.

## Xcode와 Swift 작업 지침

- Xcode GUI보다 CLI validation을 우선한다.
- scheme 이름을 사용하거나 변경하기 전에 `xcodebuild -list -project apps/watch-ios/DiveWatchApp.xcodeproj`로 확인한다.
- simulator build에는 가능하면 `CODE_SIGNING_ALLOWED=NO`를 사용한다.
- bundle identifier, signing style, provisioning profile, entitlement, Apple Developer 설정은 명시적 요청 없이는 변경하지 않는다.
- 새 Swift 파일을 추가할 때는 반드시 `DiveWatchApp.xcodeproj` target membership/build phases에 포함되는지 확인한다.
- project file 변경이 필요 없으면 기존 compiled Swift 파일을 확장하는 쪽을 선호한다.
- `RealDepthSensorProvider`와 `CMWaterSubmersionManager` 관련 작업은 simulator/mock 결과를 실제 underwater correctness의 증거로 쓰지 않는다.

## Contract와 Sync

- watch 앱에는 local Swift models와 `DiveSession.syncMessageData` encoder가 있다.
- `packages/contracts/generated/swift/WatchContracts.swift`는 현재 Xcode target에 포함되어 있지 않다.
- sync contract 의미를 바꾸려면 `packages/contracts/schemas/`를 수정하고 generation을 실행한다. generated Swift/TypeScript output은 직접 수정하지 않는다.
- `userId`는 watch contract에 넣지 않는다. 사용자 연결은 미래 mobile/server side responsibility다.

## Skill 사용

- Swift, watchOS, Xcode project, scheme, signing, entitlement, simulator build 작업에는 `xcode-harness`를 사용한다.
- Xcode build 속도 최적화가 목적이면 `xcode-build-orchestrator`를 사용한다.
- contract, sync behavior, app boundary, safety wording이 바뀌면 `wiki-writing`을 사용한다.
- Supabase/auth 관련 작업이 watch boundary에 걸리면 먼저 root boundary를 확인하고, 실제 Supabase 변경에는 `supabase` skill을 사용한다.

## Commands

루트에서 실행한다.

- `yarn watch:build`
- `yarn workspace @repo/watch-ios xcode:list`
- `yarn workspace @repo/watch-ios xcode:build`

직접 Xcode command가 필요하면:

```bash
xcodebuild -project apps/watch-ios/DiveWatchApp.xcodeproj -scheme DiveWatchApp -destination 'generic/platform=watchOS Simulator' -derivedDataPath /private/tmp/DiveWatchAppDerivedData CODE_SIGNING_ALLOWED=NO build
```

## Verification

- Swift/watch UI/native project 변경: `yarn watch:build`
- scheme/project membership 변경: `yarn workspace @repo/watch-ios xcode:list` 후 `yarn watch:build`
- contract schema나 generated output 영향이 있으면 `yarn check:quick`도 실행한다.
- real underwater sensor behavior는 자동화 gate로 검증됐다고 보고하지 않는다. 지원 Apple Watch hardware에서 별도 수동 검증이 필요하다고 적는다.
