# 프로젝트 개요

## 요약

`diving-app`은 레크리에이션 다이빙 로그 보조 앱을 위한 Yarn 1/Turborepo monorepo다. 현재 구현은 bare React Native 모바일 앱, SwiftUI watchOS 앱, 공유 watch 동기화 계약, 비어 있는 공유 utility package를 함께 관리한다.

## 현재 상태

이 앱은 certified dive computer, 감압 컴퓨터, 의료기기, 생명 유지 장치가 아니다. 현재 화면은 watch에서 기록한 세션, 로컬 확인, 모바일 로그북 미리보기, 계획 알림, 앱 표시 설정에 집중한다.

현재 사용하는 workspace는 다음과 같다.

- `apps/mobile`: React Native `0.85.3` 앱. 자체 tab navigation, local in-memory logbook state, watch fixture 가져오기, 계획 알림, 앱 표시 설정 화면을 포함한다.
- `apps/watch-ios`: `DiveWatchApp.xcodeproj`를 사용하는 SwiftUI watchOS 앱. Target과 scheme은 `DiveWatchApp`이다.
- `packages/contracts`: watch sync message의 JSON Schema 기준과 generated TypeScript/Swift output을 관리한다.
- `packages/shared-utils`: 현재 source implementation이 없는 예약된 공유 workspace다.

현재 코드에는 Supabase layer, 인증 흐름, cloud backup, 모바일 production 저장, WatchConnectivity bridge가 구현되어 있지 않다.

## 상세

watch 앱의 기록 흐름은 현재 `MockDepthSensorProvider`를 사용한다. `RealDepthSensorProvider`는 향후 `CMWaterSubmersionManager` 연동을 위한 자리 표시자이며, 공개 배포 전 지원되는 Apple Watch hardware에서 수동 검증이 필요하다.

모바일 앱은 generated TypeScript watch contract type과 로컬 watch fixture message를 import한다. 가져온 세션은 실행 중인 React state에만 보관되며 device database나 server에 저장되지 않는다.

모바일 설정은 현재 테마 선호와 언어 선호를 실행 중인 React state에만 보관한다. 테마는 `system`, `light`, `dark` 선호를 지원하고, 언어는 `ko`, `en`을 지원한다. Production persistence는 아직 없다.

동기화 계약은 의도적으로 `userId`를 포함하지 않는다. 사용자 연결은 이후 모바일 또는 server 쪽에 인증이 생긴 뒤 붙이는 책임이다.

## 관련 문서

- [[architecture/monorepo]]
- [[architecture/mobile]]
- [[architecture/watch-app]]
- [[architecture/sync-flow]]
- [[domains/safety-rules]]
