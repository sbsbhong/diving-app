# Watch Sync JSON Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a runtime JSON validation path for watch sync payloads before mobile import.

**Architecture:** Keep `DiveLogRepository.importWatchMessages` typed and storage-focused. Add a small validator in `apps/mobile/src/utils` that narrows raw `unknown`/JSON string input to `WatchSyncMessage`, then reuse the existing import pipeline.

**Tech Stack:** React Native TypeScript, Jest, generated contract types, JSON fixture imports with `resolveJsonModule`.

---

## File Structure

- Modify: `apps/mobile/tsconfig.json` to allow JSON fixture imports.
- Create: `apps/mobile/src/utils/watch-sync-message-validation.ts` for dependency-free runtime validation.
- Modify: `apps/mobile/src/utils/watch-fixtures.ts` so app fixtures pass through the validator.
- Create: `apps/mobile/__tests__/watch-sync-message-validation.test.ts` for valid raw JSON, invalid payload, and repository import coverage.
- Modify: `.wiki/wiki/architecture/sync-flow.md`, `.wiki/wiki/architecture/implementation-priorities.md`, `.wiki/wiki/questions/open-questions.md`, `.wiki/wiki/log.md` after implementation.

### Task 1: Failing Validator Tests

**Files:**
- Create: `apps/mobile/__tests__/watch-sync-message-validation.test.ts`

- [ ] **Step 1: Write tests for valid and invalid raw payloads**

```ts
import metadataRichFixture from '../../../packages/contracts/fixtures/metadata-rich-watch-sync-message.json';
import minimalFixture from '../../../packages/contracts/fixtures/minimal-watch-sync-message.json';
import { PersistentDiveLogRepository } from '../src/repositories/persistent-dive-log-repository';
import { InMemoryKeyValueStore } from '../src/storage/in-memory-key-value-store';
import {
  parseWatchSyncMessageJson,
  parseWatchSyncMessageValue,
  parseWatchSyncMessagesValue,
} from '../src/utils/watch-sync-message-validation';
import { watchFixtureMessages } from '../src/utils/watch-fixtures';

describe('watch sync message validation', () => {
  it('validates contract fixture JSON and imports it into the persistent repository', async () => {
    const result = parseWatchSyncMessageValue(metadataRichFixture);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(result.error.message);
    }

    const repository = new PersistentDiveLogRepository({
      storage: new InMemoryKeyValueStore(),
      now: () => 1781354000,
      initialEntries: [],
    });

    const [entry] = await repository.importWatchMessages([result.message]);
    expect(entry.localId).toBe('watch:fixture-rich-session:1781352600');
    expect(entry.watchCapture?.session.localSessionId).toBe('fixture-rich-session');
    expect(entry.watchCapture?.samples).toHaveLength(4);
  });

  it('parses raw JSON strings into watch sync messages', () => {
    const result = parseWatchSyncMessageJson(JSON.stringify(minimalFixture));
    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(result.error.message);
    }
    expect(result.message.session.localSessionId).toBe('fixture-minimal-session');
  });

  it('validates arrays for transport batches', () => {
    const result = parseWatchSyncMessagesValue([minimalFixture, metadataRichFixture]);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(result.error.message);
    }
    expect(result.messages).toHaveLength(2);
  });

  it('rejects payloads that do not match the contract', () => {
    const result = parseWatchSyncMessageValue({
      type: 'sessionEnded',
      session: {
        startedAt: 1781352000,
        samples: [{ localSessionId: 'sample-1', timestamp: 1781352000, depthMeters: 0 }],
      },
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('expected invalid payload');
    }
    expect(result.error.message).toContain('session.localSessionId');
  });

  it('builds app fixture messages through the runtime validator', () => {
    expect(watchFixtureMessages.map(message => message.session.localSessionId)).toEqual([
      'fixture-rich-session',
    ]);
  });
});
```

- [ ] **Step 2: Run tests and confirm missing module failure**

Run: `yarn workspace @repo/mobile test --runTestsByPath __tests__/watch-sync-message-validation.test.ts --runInBand`

Expected: FAIL because `watch-sync-message-validation` does not exist.

### Task 2: Validator Implementation

**Files:**
- Modify: `apps/mobile/tsconfig.json`
- Create: `apps/mobile/src/utils/watch-sync-message-validation.ts`
- Modify: `apps/mobile/src/utils/watch-fixtures.ts`

- [ ] **Step 1: Enable JSON fixture imports**

Add `"resolveJsonModule": true` under `compilerOptions` in `apps/mobile/tsconfig.json`.

- [ ] **Step 2: Implement validator result API**

Create `watch-sync-message-validation.ts` with:

```ts
import type { WatchDepthSample, WatchSession, WatchSyncMessage } from '../types/dive-session';

export type WatchSyncMessageValidationError = {
  message: string;
  path: string;
};

export type WatchSyncMessageParseResult =
  | { ok: true; message: WatchSyncMessage }
  | { ok: false; error: WatchSyncMessageValidationError };

export type WatchSyncMessagesParseResult =
  | { ok: true; messages: WatchSyncMessage[] }
  | { ok: false; error: WatchSyncMessageValidationError };
```

Then add object, enum, string, number, integer range, array, optional property, additional property, session, location, sample, and JSON string parsing helpers. Every failure should include a path such as `session.localSessionId`.

- [ ] **Step 3: Route fixtures through validation**

Update `watch-fixtures.ts` to import the rich contract JSON fixture and call `parseWatchSyncMessagesValue`. Throw a clear error if fixtures fail validation. Keep the app default fixture count unchanged; use the minimal fixture only in validator tests.

- [ ] **Step 4: Run validator tests**

Run: `yarn workspace @repo/mobile test --runTestsByPath __tests__/watch-sync-message-validation.test.ts --runInBand`

Expected: PASS.

### Task 3: Existing Import Regression Gates

**Files:**
- Existing tests only.

- [ ] **Step 1: Run existing import tests**

Run: `yarn workspace @repo/mobile test --runTestsByPath __tests__/watch-sync-message-validation.test.ts __tests__/local-dive-log-repository.test.ts __tests__/persistent-dive-log-repository.test.ts __tests__/use-dive-logbook.test.ts --runInBand`

Expected: PASS.

- [ ] **Step 2: Run typecheck and generation gate**

Run: `yarn mobile:typecheck`

Expected: PASS.

Run: `yarn check:quick`

Expected: PASS.

### Task 4: Wiki Update

**Files:**
- Modify: `.wiki/wiki/architecture/sync-flow.md`
- Modify: `.wiki/wiki/architecture/implementation-priorities.md`
- Modify: `.wiki/wiki/questions/open-questions.md`
- Modify: `.wiki/wiki/log.md`

- [ ] **Step 1: Update durable project knowledge**

Record that mobile now validates raw watch sync JSON before import, fixture import uses the validation path, and 1번 priority is resolved. Keep WatchConnectivity and generated Swift target membership listed as not implemented.

- [ ] **Step 2: Run handoff gate**

Run: `yarn codex:check`

Expected: PASS, or report environment-specific Xcode/simulator failure separately from compile failures.
