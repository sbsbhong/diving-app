# 모바일 구조

## 요약

`apps/mobile`은 watch에서 기록한 레크리에이션 다이빙 로그를 확인하기 위한 bare React Native 앱이다. 현재는 server, database, navigation library 없이 local React state, generated watch contract TypeScript type, Gluestack UI v4/NativeWind styling stack을 사용한다.

## 현재 상태

앱 package는 `@repo/mobile`이다. 현재 의존성은 React Native `0.85.3`, React `19.2.3`, TypeScript, Jest, Metro, `react-native-safe-area-context`, Gluestack UI v4 alpha package, NativeWind, Tailwind CSS, Reanimated, Worklets, React Native SVG를 포함한다.

주요 source 경계는 다음과 같다.

- `src/App.tsx`: 앱 UI entry.
- `src/providers.tsx`: top-level `SafeAreaProvider`, `GluestackUIProvider`, `StatusBar`.
- `src/components/navigation/index.tsx`: custom bottom-tab navigation state.
- `src/components/ui/`: 재사용 UI primitive, instrument control, session card, profile chart, tone type.
- `components/ui/gluestack-ui-provider/`: generated Gluestack provider, color-mode script, token bridge.
- `global.css`, `tailwind.config.js`: NativeWind/Tailwind entrypoint와 semantic token configuration.
- `src/screens/home`, `src/screens/logbook`, `src/screens/planning`, `src/screens/memory`: route-level 화면 container.
- `src/states/use-dive-logbook.ts`: local logbook state, search filter, fixture import action.
- `src/types/dive-session.ts`: generated watch contract type 기반 mobile session type.
- `src/utils/`: formatter, watch fixture 가져오기, 세션 summary 계산.

## 상세

현재 모바일 UI는 네 영역으로 구성된다.

- Home: 가장 최근 가져온 watch 세션, 주요 지표, 안전 assistant 문구.
- Logbook: 가져온 세션 목록, 검색, 동기화 상태 filter, 상세 지표, 수심 profile, 수온 profile, notes, tags, media placeholder.
- Planning: 가장 최근 가져온 세션을 맥락으로 쓰는 수동 계획 알림.
- Memory: 정적 share-card와 확인 전용 분석 미리보기.

Styling rule은 현재 코드 기준으로 다음과 같다.

- `className`과 semantic token을 우선 사용한다. 예: `bg-background`, `text-foreground`, `bg-card`, `text-card-foreground`, `border-border`, `text-muted-foreground`, `bg-primary`, `bg-secondary`, `bg-accent`, `bg-destructive`.
- 재사용 component 상태와 tone variant에는 local `tva` variant를 사용한다.
- Inline `style`은 safe-area inset, chart bar height, pressed-state transform처럼 runtime value가 필요한 경우로 제한한다.
- Mobile UI code에 raw hex color, numbered gray/slate/neutral palette, `typography-*` token, opacity utility를 다시 늘리지 않는다.

`importWatchMessages`는 가져온 세션을 `localSessionId`와 `endedAt` 기반 `importKey`로 deduplicate한다. 기존 `importedAt`은 보존하고, 누락된 동기화 상태는 `pending`으로 기본값을 넣으며, 결과는 `startedAt` 내림차순으로 정렬한다.

현재 제한은 다음과 같다.

- 인증 없음.
- Supabase client 없음.
- Direct SQL 없음.
- Production mobile persistence 없음.
- Live WatchConnectivity integration 없음.
- Certified dive-computer behavior 없음.

iOS project는 `apps/mobile/ios/DiveMobile.xcworkspace`에 있다. Build wrapper는 CocoaPods artifact를 확인하고 signing disabled 상태로 build한다. Android native project file은 `apps/mobile/android` 아래에 있다.

## 관련 문서

- [[architecture/sync-flow]]
- [[architecture/supabase]]
- [[domains/dive-log]]
- [[domains/safety-rules]]
