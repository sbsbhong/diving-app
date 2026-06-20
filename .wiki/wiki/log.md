# Wiki Log

## 2026-06-20 - documentation - wiki 한국어 재작성

- Updated:
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
- Source:
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
- Summary:
  - 기존 wiki 구조와 durable fact를 유지하면서 `.wiki/wiki/` 본문을 한국어로 재작성했다. 기술 identifier와 file path는 영어로 유지했고, mobile guide와 current Gluestack UI v4/NativeWind code의 불일치를 open question으로 기록했다.

## 2026-06-20 - architecture - mobile Gluestack styling stack

- Updated:
  - `.wiki/wiki/architecture/mobile.md`
  - `.wiki/wiki/log.md`
- Source:
  - `apps/mobile/package.json`
  - `apps/mobile/src/providers.tsx`
  - `apps/mobile/src/components/ui/`
  - `apps/mobile/components/ui/gluestack-ui-provider/`
  - `apps/mobile/global.css`
  - `apps/mobile/tailwind.config.js`
- Summary:
  - Mobile app의 Gluestack UI v4 alpha와 NativeWind setup, provider boundary, semantic-token styling rule을 기록했다.

## 2026-06-20 - documentation - initial current project snapshot

- Updated:
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
- Source:
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
- Summary:
  - Monorepo, mobile app, watchOS app, contracts/sync flow, absent Supabase layer, dive-log domain model, safety boundary, ADR index state, open question의 첫 wiki snapshot을 추가했다.
