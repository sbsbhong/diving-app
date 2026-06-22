# Wiki 기록

## 2026-06-22 - 구조 - mobile local-first logbook Phase 2

- 수정:
  - `.wiki/wiki/overview.md`
  - `.wiki/wiki/architecture/mobile.md`
  - `.wiki/wiki/architecture/sync-flow.md`
  - `.wiki/wiki/architecture/mobile-logbook-roadmap.md`
  - `.wiki/wiki/domains/dive-log.md`
  - `.wiki/wiki/questions/open-questions.md`
  - `.wiki/wiki/log.md`
- 근거:
  - `apps/mobile/src/types/dive-log-entry.ts`
  - `apps/mobile/src/repositories/dive-log-repository.ts`
  - `apps/mobile/src/repositories/local-dive-log-repository.ts`
  - `apps/mobile/src/states/use-dive-logbook.ts`
  - `apps/mobile/src/states/use-dive-logbook-queries.ts`
  - `apps/mobile/src/screens/logbook/screen.tsx`
  - `apps/mobile/src/screens/logbook/log-entry-editor.tsx`
  - `apps/mobile/src/screens/logbook/log-entry-detail.tsx`
- 요약:
  - 모바일 로그북이 `DiveLogEntry`, `DiveLogRepository`, React Query hook을 사용하고, 로그인 없이 수동 로그를 작성해 watch import와 같은 목록에 표시하는 현재 구현 사실을 기록했다. 현재 저장소는 production persistence가 아니라 in-memory `LocalDiveLogRepository`라는 제한도 함께 명시했다.

## 2026-06-21 - 결정 - React Query for mobile logbook data access

- 수정:
  - `.wiki/wiki/architecture/mobile-logbook-roadmap.md`
  - `.wiki/wiki/decisions/adr-local-first-mobile-logbook.md`
  - `.wiki/wiki/log.md`
- 근거:
  - 사용자 승인: React Query는 사용하는 방향으로 잡고, Zustand는 당장 불필요하다는 판단
  - `docs/superpowers/specs/2026-06-21-mobile-logbook-local-first-design.md`
  - `docs/superpowers/plans/2026-06-21-mobile-logbook-local-first.md`
- 요약:
  - 모바일 로그북 조회와 변경은 React Query cache/mutation 계층으로 다루고, 실제 저장 책임은 local repository와 future Supabase repository에 둔다. Zustand는 첫 구현 범위에서 제외하고 편집 상태가 복잡해질 때 재검토한다.

## 2026-06-21 - 결정 - local-first mobile logbook roadmap

- 수정:
  - `.wiki/wiki/index.md`
  - `.wiki/wiki/overview.md`
  - `.wiki/wiki/architecture/mobile-logbook-roadmap.md`
  - `.wiki/wiki/architecture/supabase.md`
  - `.wiki/wiki/domains/dive-log.md`
  - `.wiki/wiki/decisions/adr-index.md`
  - `.wiki/wiki/decisions/adr-local-first-mobile-logbook.md`
  - `.wiki/wiki/questions/open-questions.md`
  - `.wiki/wiki/log.md`
- 근거:
  - 사용자 승인: local-first 모바일 로그북을 먼저 만들고 Supabase sync를 나중에 붙이는 방향
  - `apps/mobile/src/states/use-dive-logbook.ts`
  - `apps/mobile/src/types/dive-session.ts`
  - `apps/mobile/src/utils/import-watch-session.ts`
  - `apps/watch-ios/DiveWatchApp/Models/DiveSession.swift`
  - `packages/contracts/schemas/watch-session.schema.json`
  - `docs/superpowers/specs/2026-06-21-mobile-logbook-local-first-design.md`
  - `docs/superpowers/plans/2026-06-21-mobile-logbook-local-first.md`
- 요약:
  - 모바일 로그북을 local-first로 만들고, 수동 로그와 watch 기반 로그를 모두 `DiveLogEntry`로 다루며, 이후 로그인과 Supabase sync를 저장소 경계 뒤에 붙이는 승인된 방향을 기록했다.

## 2026-06-21 - 구조 - mobile settings tab

- 수정:
  - `.wiki/wiki/overview.md`
  - `.wiki/wiki/architecture/mobile.md`
  - `.wiki/wiki/log.md`
- 근거:
  - `apps/mobile/src/components/navigation/index.tsx`
  - `apps/mobile/src/providers.tsx`
  - `apps/mobile/src/states/app-preferences.tsx`
  - `apps/mobile/src/screens/settings/screen.tsx`
  - `apps/mobile/src/i18n/resources.ts`
  - `apps/mobile/src/types/dive-session.ts`
- 요약:
  - 모바일 앱의 활성 bottom tab이 Home, Logbook, Planning, Settings로 바뀐 사실을 기록했다. Settings는 테마와 언어 선호를 관리하지만, 현재 값은 실행 중인 React state에만 저장되고 production persistence는 아직 없다.

## 2026-06-20 - 디자인 - mobile/watch UI 언어

- 수정:
  - `.wiki/wiki/design/mobile-watch-ui-language.md`
  - `.wiki/wiki/index.md`
  - `.wiki/wiki/architecture/mobile.md`
  - `.wiki/wiki/architecture/watch-app.md`
  - `.wiki/wiki/log.md`
- 근거:
  - 사용자가 승인한 `iOS grouped base + dive instrument accent` 방향
  - `DESIGN.md`
  - `apps/mobile/src/screens/`
  - `apps/mobile/src/components/ui/`
  - `apps/watch-ios/DiveWatchApp/Views/`
  - `.wiki/wiki/domains/safety-rules.md`
- 요약:
  - 모바일과 watchOS가 공유할 UI look and feel을 기록했다. 모바일은 iOS grouped 화면을 기본으로 하고, watchOS는 black canvas와 compact instrument card로 번역한다. 다이빙 도메인감은 수심, 시간, profile, 상태 같은 계기 요소에만 집중하며 safety copy는 review/reminder/non-certified assistant 범위에 둔다.

## 2026-06-20 - 문서화 - wiki 영어 사용 축소

- 수정:
  - `.agents/skills/wiki-writing/SKILL.md`
  - `.wiki/wiki/index.md`
  - `.wiki/wiki/overview.md`
  - `.wiki/wiki/architecture/monorepo.md`
  - `.wiki/wiki/architecture/mobile.md`
  - `.wiki/wiki/architecture/watch-app.md`
  - `.wiki/wiki/architecture/supabase.md`
  - `.wiki/wiki/architecture/sync-flow.md`
  - `.wiki/wiki/domains/dive-log.md`
  - `.wiki/wiki/domains/safety-rules.md`
  - `.wiki/wiki/domains/diving-glossary.md`
  - `.wiki/wiki/decisions/adr-index.md`
  - `.wiki/wiki/questions/open-questions.md`
  - `.wiki/wiki/log.md`
- 근거:
  - wiki 설명에서 영어 사용을 줄이라는 사용자 지시
  - `.agents/skills/wiki-writing/SKILL.md`
  - `.wiki/wiki/`
- 요약:
  - 설명 문장에서 한국어로 자연스럽게 옮길 수 있는 영어를 줄였다. 변수명, 함수명, package name, file path, schema/type/field name, product name처럼 그대로 써야 하는 식별자는 유지했다.

## 2026-06-20 - 문서화 - wiki 한국어 재작성

- 수정:
  - `.wiki/wiki/index.md`
  - `.wiki/wiki/overview.md`
  - `.wiki/wiki/architecture/monorepo.md`
  - `.wiki/wiki/architecture/mobile.md`
  - `.wiki/wiki/architecture/watch-app.md`
  - `.wiki/wiki/architecture/supabase.md`
  - `.wiki/wiki/architecture/sync-flow.md`
  - `.wiki/wiki/domains/dive-log.md`
  - `.wiki/wiki/domains/safety-rules.md`
  - `.wiki/wiki/domains/diving-glossary.md`
  - `.wiki/wiki/decisions/adr-index.md`
  - `.wiki/wiki/questions/open-questions.md`
  - `.wiki/wiki/log.md`
- 근거:
  - user instruction to write wiki pages in Korean
  - `.agents/skills/wiki-writing/SKILL.md`
  - `package.json`
  - `turbo.json`
  - `README.md`
  - `apps/mobile/AGENTS.md`
  - `apps/mobile/package.json`
  - `apps/mobile/src/`
  - `apps/mobile/components/ui/gluestack-ui-provider/`
  - `apps/mobile/tailwind.config.js`
  - `apps/watch-ios/AGENTS.md`
  - `apps/watch-ios/package.json`
  - `apps/watch-ios/DiveWatchApp/`
  - `apps/watch-ios/DiveWatchApp.xcodeproj/project.pbxproj`
  - `packages/contracts/package.json`
  - `packages/contracts/schemas/`
  - `packages/contracts/generated/`
- 요약:
  - 기존 wiki 구조와 오래 유지할 사실을 보존하면서 `.wiki/wiki/` 본문을 한국어로 재작성했다. 기술 identifier와 file path는 영어로 유지했고, mobile guide와 current Gluestack UI v4/NativeWind code의 불일치를 open question으로 기록했다.

## 2026-06-20 - 구조 - mobile Gluestack styling stack

- 수정:
  - `.wiki/wiki/architecture/mobile.md`
  - `.wiki/wiki/log.md`
- 근거:
  - `apps/mobile/package.json`
  - `apps/mobile/src/providers.tsx`
  - `apps/mobile/src/components/ui/`
  - `apps/mobile/components/ui/gluestack-ui-provider/`
  - `apps/mobile/global.css`
  - `apps/mobile/tailwind.config.js`
- 요약:
  - Mobile app의 Gluestack UI v4 alpha와 NativeWind setup, provider boundary, semantic-token styling rule을 기록했다.

## 2026-06-20 - 문서화 - 초기 프로젝트 snapshot

- 수정:
  - `.wiki/wiki/index.md`
  - `.wiki/wiki/overview.md`
  - `.wiki/wiki/architecture/monorepo.md`
  - `.wiki/wiki/architecture/mobile.md`
  - `.wiki/wiki/architecture/watch-app.md`
  - `.wiki/wiki/architecture/supabase.md`
  - `.wiki/wiki/architecture/sync-flow.md`
  - `.wiki/wiki/domains/dive-log.md`
  - `.wiki/wiki/domains/safety-rules.md`
  - `.wiki/wiki/domains/diving-glossary.md`
  - `.wiki/wiki/decisions/adr-index.md`
  - `.wiki/wiki/questions/open-questions.md`
  - `.wiki/wiki/log.md`
- 근거:
  - `AGENTS.md`
  - `README.md`
  - `package.json`
  - `turbo.json`
  - `apps/mobile/package.json`
  - `apps/mobile/README.md`
  - `apps/mobile/src/`
  - `apps/mobile/scripts/ios-build.mjs`
  - `apps/watch-ios/package.json`
  - `apps/watch-ios/README.md`
  - `apps/watch-ios/DiveWatchApp/`
  - `apps/watch-ios/DiveWatchApp.xcodeproj/project.pbxproj`
  - `packages/contracts/package.json`
  - `packages/contracts/schemas/`
  - `packages/contracts/scripts/`
  - `packages/contracts/generated/`
  - `docs/watch-dive-product-plan.md`
  - `docs/watch-dive-implementation-notes.md`
- 요약:
  - Monorepo, mobile app, watchOS app, contracts/sync flow, absent Supabase layer, dive-log domain model, safety boundary, ADR index state, open question의 첫 wiki snapshot을 추가했다.
