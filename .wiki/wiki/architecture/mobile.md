# 모바일 구조

## 요약

`apps/mobile`은 watch에서 기록한 레크리에이션 다이빙 로그를 확인하고 모바일에서 수동 로그를 작성하기 위한 bare React Native 앱이다. 현재는 server, database, navigation library 없이 React Query, in-memory repository, generated watch contract TypeScript type, Gluestack UI v4/NativeWind styling stack을 사용한다.

## 현재 상태

앱 package는 `@repo/mobile`이다. 현재 의존성은 React Native `0.85.3`, React `19.2.3`, TypeScript, Jest, Metro, `react-native-safe-area-context`, Gluestack UI v4 alpha package, NativeWind, Tailwind CSS, Reanimated, Worklets, React Native SVG를 포함한다.

주요 source 경계는 다음과 같다.

- `src/App.tsx`: 앱 UI entry.
- `src/providers.tsx`: top-level `QueryClientProvider`, `SafeAreaProvider`, `AppPreferencesProvider`, `GluestackUIProvider`, `StatusBar`.
- `src/components/navigation/index.tsx`: custom bottom-tab navigation state.
- `src/components/ui/`: 재사용 UI primitive, instrument control, session card, profile chart, tone type.
- `components/ui/gluestack-ui-provider/`: generated Gluestack provider, color-mode script, token bridge.
- `global.css`, `tailwind.config.js`: NativeWind/Tailwind entrypoint와 semantic token configuration.
- `src/screens/home`, `src/screens/logbook`, `src/screens/planning`, `src/screens/settings`: route-level 화면 container. Logbook은 목록, 수동 작성 editor, 상세 화면을 같은 tab 안의 local route state로 전환한다.
- `src/screens/memory`: 이전 memory/share preview source가 남아 있지만 현재 bottom tab route에는 연결되어 있지 않다.
- `src/states/app-preferences.tsx`: 앱 표시 선호를 관리하는 in-memory provider.
- `src/states/use-dive-logbook.ts`: React Query 기반 로그북 hook, search filter, fixture import action, 기존 화면을 위한 `MobileDiveSession` 호환 view.
- `src/states/use-dive-logbook-queries.ts`: `DiveLogRepository`를 호출하는 list/detail/save/delete/watch import query와 mutation hook.
- `src/repositories/`: `DiveLogRepository` 인터페이스와 in-memory `LocalDiveLogRepository`.
- `src/types/dive-log-entry.ts`: 모바일 로그북 항목인 `DiveLogEntry`와 source/provenance/sync status type.
- `src/types/dive-session.ts`: generated watch contract type 기반 compatibility type.
- `src/utils/`: formatter, watch fixture 가져오기, 세션 summary 계산.

## 상세

현재 모바일 UI는 네 영역으로 구성된다.

- Home: 가장 최근 가져온 watch 세션, 주요 지표, 안전 assistant 문구.
- Logbook: manual/watch 로그 목록, 검색, 동기화 상태 filter, 수동 로그 작성, 상세 지표, provenance 표시, 수심 profile, 수온 profile, notes, tags.
- Planning: 가장 최근 가져온 세션을 맥락으로 쓰는 수동 계획 알림.
- Settings: 테마와 언어 같은 앱 표시 선호를 grouped list로 관리한다.

Settings는 현재 다음 범위로 제한된다.

- 테마 선호는 `system`, `light`, `dark`를 지원한다. `system`은 device color scheme이 `dark`일 때만 dark mode로 해석하고, 그 외에는 light mode로 해석한다.
- `AppPreferencesProvider`가 `resolvedTheme`을 계산하고 `GluestackUIProvider` mode와 `StatusBar` style에 전달한다.
- 언어 선호는 `ko`, `en`만 지원한다. 선택 변경은 `i18next.changeLanguage`를 사용하며, 실패하면 이전 언어 상태를 유지한다.
- 설정 값은 현재 실행 중인 React state에만 저장된다. Production persistence와 migration behavior는 아직 없다.

Styling rule은 현재 코드 기준으로 다음과 같다.

- `className`과 semantic token을 우선 사용한다. 예: `bg-background`, `text-foreground`, `bg-card`, `text-card-foreground`, `border-border`, `text-muted-foreground`, `bg-primary`, `bg-secondary`, `bg-accent`, `bg-destructive`.
- 재사용 component 상태와 tone variant에는 local `tva` variant를 사용한다.
- Inline `style`은 safe-area inset, chart bar height, pressed-state transform처럼 runtime value가 필요한 경우로 제한한다.
- Mobile UI code에 raw hex color, numbered gray/slate/neutral palette, `typography-*` token, opacity utility를 다시 늘리지 않는다.

`LocalDiveLogRepository`는 `DiveLogEntry`를 in-memory map에 저장한다. Watch import는 `localSessionId`와 `endedAt` 기반 `importKey`로 deduplicate하고, 기존 manual/mobile field와 `importedAt`을 보존하며, watch capture와 sync status를 최신 payload로 갱신한다. 결과는 watch 시작 시간, 수동 입력 시작 시간, 생성 시간 기준으로 최신 항목이 먼저 오도록 정렬한다.

수동 로그 작성은 `LogbookScreen`의 create action에서 시작한다. 첫 editor는 date/time, dive mode, site name, duration, max depth, buddy names, tags, observed marine life, notes, rating을 다룬다. 저장된 수동 로그는 `source: 'manual'`, `syncStatus: 'localOnly'`이며, 비어 있거나 유효하지 않은 수치 field는 `0`이 아니라 `undefined`로 유지한다.

Home/Memory 같은 preview surface와 summary helper도 알 수 없는 duration/depth를 실제 `0`으로 집계하지 않는다. Manual log에 duration만 있고 `endedAt`이 없으면 compatibility `MobileDiveSession`에서 `endedAt`을 파생해 기존 preview가 입력된 duration을 표시할 수 있게 한다.

상세 화면은 manual value와 watch-captured value의 provenance를 표시한다. Watch 측정값은 raw `WatchSession`과 별도로 보존되며, 사용자가 수동으로 입력한 값과 같은 방식으로 보이지 않게 한다. 문구는 review/logging 범위에 머물고 인증된 dive computer 표현을 쓰지 않는다.

현재 제한은 다음과 같다.

- 인증 없음.
- Supabase client 없음.
- Direct SQL 없음.
- Production mobile persistence 없음. 현재 `LocalDiveLogRepository`는 앱 실행 중 메모리 저장소이며, app restart 뒤 유지되는 storage engine은 아직 없다.
- Live WatchConnectivity integration 없음.
- Certified dive-computer behavior 없음.

iOS project는 `apps/mobile/ios/DiveMobile.xcworkspace`에 있다. Build wrapper는 CocoaPods artifact를 확인하고 signing disabled 상태로 build한다. Android native project file은 `apps/mobile/android` 아래에 있다.

## 관련 문서

- [[architecture/sync-flow]]
- [[architecture/supabase]]
- [[domains/dive-log]]
- [[domains/safety-rules]]
- [[design/mobile-watch-ui-language]]
