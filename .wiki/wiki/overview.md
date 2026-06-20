# Project Overview

## Summary

`diving-app`은 recreational dive logging companion을 위한 Yarn 1/Turborepo monorepo다. 현재 구현은 bare React Native mobile app, SwiftUI watchOS app, shared watch sync contract, 비어 있는 shared utility package를 함께 관리한다.

## Current state

이 앱은 certified dive computer, decompression computer, medical device, life-support system이 아니다. 현재 product surface는 watch-captured session recording, local review, mobile logbook preview, planning reminder, memory/share preview에 집중한다.

Active workspace는 다음과 같다.

- `apps/mobile`: React Native `0.85.3` app. Custom tab navigation, local in-memory logbook state, watch fixture import, planning reminder, memory preview screen을 포함한다.
- `apps/watch-ios`: `DiveWatchApp.xcodeproj`를 사용하는 SwiftUI watchOS app. Target과 scheme은 `DiveWatchApp`이다.
- `packages/contracts`: watch sync message의 JSON Schema source of truth와 generated TypeScript/Swift output을 관리한다.
- `packages/shared-utils`: 현재 source implementation이 없는 reserved shared workspace다.

현재 code에는 Supabase layer, authentication flow, cloud backup, mobile production persistence, WatchConnectivity bridge가 구현되어 있지 않다.

## Details

watch app recording flow는 현재 `MockDepthSensorProvider`를 사용한다. `RealDepthSensorProvider`는 future `CMWaterSubmersionManager` 연동을 위한 placeholder이며, public release 전에 supported Apple Watch hardware에서 manual validation이 필요하다.

mobile app은 generated TypeScript watch contract type과 local watch fixture message를 import한다. Imported session은 실행 중인 React state에만 보관되며 device database나 server에 persist되지 않는다.

sync contract는 의도적으로 `userId`를 포함하지 않는다. User association은 이후 mobile/server side에서 authentication이 생긴 뒤 붙이는 responsibility다.

## Related pages

- [[architecture/monorepo]]
- [[architecture/mobile]]
- [[architecture/watch-app]]
- [[architecture/sync-flow]]
- [[domains/safety-rules]]
