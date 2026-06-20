# dive-app

## 프로젝트 목적
Apple Watch 수중 기록 앱의 초기 PoC를 위한 모노레포입니다.
현재 목표는 완성 앱 개발이 아니라, 향후 React Native 모바일 앱과 SwiftUI watchOS 앱을 함께 관리할 수 있는 공통 기반을 만드는 것입니다.

핵심 전제:
- 워치 앱은 로그인 없이 로컬 기록만 수행
- `userId`는 contract에 포함하지 않음
- 워치 데이터는 추후 모바일 앱 로그인 사용자 기준으로 서버 저장 예정
- 이번 단계에서 Supabase/인증/모바일 앱 구현은 제외

## 현재 구현 범위
- Yarn Workspaces 기반 모노레포 구조
- `packages/contracts`:
  - JSON Schema 원본 contract 3종
  - TypeScript 타입 생성(`json-schema-to-typescript`)
  - Swift Codable 타입 생성(`quicktype`)
- `apps/watch-ios/Sources`:
  - Mock 수심 센서 provider
  - 세션 기록기(recorder) 최소 구조
  - 실제 `CMWaterSubmersionManager` 연동은 placeholder만 제공
- `apps/watch-ios/DiveWatchApp`:
  - Xcode에서 바로 열 수 있는 SwiftUI watchOS 앱 PoC
  - Start/End 기록 흐름, 세션 요약, UserDefaults 기반 로컬 저장
  - 저장된 세션 목록/상세 화면

## 폴더 구조
```text
dive-app/
  apps/
    watch-ios/
      DiveWatchApp.xcodeproj/
      DiveWatchApp/
      Sources/
    mobile/
  packages/
    contracts/
      schemas/
      generated/
        typescript/
        swift/
    shared-utils/
  package.json
  turbo.json
```

## Contracts 생성 방법
의존성 설치:
```bash
yarn install
```

contracts 생성:
```bash
yarn workspace @repo/contracts generate
```

세부 명령:
```bash
yarn workspace @repo/contracts generate:ts
yarn workspace @repo/contracts generate:swift
```

생성 대상 파일:
- `packages/contracts/generated/typescript/index.ts`
- `packages/contracts/generated/swift/WatchContracts.swift`

## watch-ios 앱 구조
실행 가능한 watchOS 앱은 `apps/watch-ios/DiveWatchApp.xcodeproj`와 `apps/watch-ios/DiveWatchApp` 아래에 있습니다.

Xcode 실행:
```bash
open apps/watch-ios/DiveWatchApp.xcodeproj
```

CLI 빌드 확인:
```bash
xcodebuild -project apps/watch-ios/DiveWatchApp.xcodeproj -scheme DiveWatchApp -destination 'generic/platform=watchOS Simulator' -derivedDataPath /private/tmp/DiveWatchAppDerivedData CODE_SIGNING_ALLOWED=NO build
```

`apps/watch-ios/DiveWatchApp` 주요 구성:
- `Models`: `DepthSample`, `DiveSession`, `DiveSessionSummary`
- `Sensors`: `DepthSensorProvider`, `MockDepthSensorProvider`, `RealDepthSensorProvider`
- `Recording`: `DiveSessionRecorder`
- `Storage`: `DiveSessionStore`
- `Views`: Home, Recording, Summary, Session list/detail 화면

## 다음 단계
1. Apple Watch Ultra 실기기에서 앱 실행 확인
2. `CMWaterSubmersionManager` 기반 실제 센서 provider 구현
3. WatchConnectivity로 iPhone 앱 전송
4. React Native 모바일 앱 추가
