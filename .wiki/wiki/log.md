# Wiki 기록

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
