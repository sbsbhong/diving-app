# WatchConnectivity Transport PoC Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a minimal WatchConnectivity PoC that queues watch sync JSON from saved watch sessions and imports received payloads into the mobile logbook through the existing validator.

**Architecture:** Watch code wraps `DiveSession.syncMessageData()` in a small `transferUserInfo` envelope. iOS native code decodes the envelope and forwards raw JSON to React Native. Mobile JS validates and imports the payload using the existing repository/query boundaries.

**Tech Stack:** SwiftUI watchOS app, WatchConnectivity, React Native native module bridge, TypeScript, React Query, Jest, Xcode project files.

---

## File Structure

- Create `apps/mobile/ios/DiveWatchApp/Sync/WatchSyncEnvelope.swift`: constants and envelope creation for WatchConnectivity userInfo.
- Create `apps/mobile/ios/DiveWatchApp/Sync/WatchSyncTransport.swift`: `WCSession` activation and outbound enqueue.
- Modify `apps/mobile/ios/DiveWatchApp/Models/DiveSession.swift`: add a copy helper for sync status updates.
- Modify `apps/mobile/ios/DiveWatchApp/Storage/DiveSessionStore.swift`: activate/enqueue via the transport on save.
- Modify `apps/mobile/ios/DiveMobile.xcodeproj/project.pbxproj`: include new watch Swift files in the target.
- Create `apps/mobile/ios/DiveMobile/WatchConnectivityInbox.swift`: iOS `WCSessionDelegate` receiver and memory queue.
- Create `apps/mobile/ios/DiveMobile/WatchConnectivityModule.swift`: React Native event emitter and pending-payload drain method.
- Create `apps/mobile/ios/DiveMobile/WatchConnectivityModuleBridge.m`: Objective-C bridge exports for the Swift module.
- Modify `apps/mobile/ios/DiveMobile/AppDelegate.swift`: activate the inbox during app startup.
- Modify `apps/mobile/ios/DiveMobile.xcodeproj/project.pbxproj`: include new iOS native files in the target.
- Create `apps/mobile/src/native/watch-connectivity.ts`: typed JS wrapper around the native module.
- Create `apps/mobile/src/states/watch-connectivity-sync.tsx`: provider that drains/subscribes/validates/imports.
- Modify `apps/mobile/src/providers.tsx`: mount the provider under `QueryClientProvider`.
- Create `apps/mobile/__tests__/watch-connectivity-sync.test.tsx`: receiver/import behavior tests.
- Update `.wiki/wiki/architecture/sync-flow.md`, `.wiki/wiki/architecture/implementation-priorities.md`, `.wiki/wiki/architecture/watch-app.md`, `.wiki/wiki/architecture/mobile.md`, `.wiki/wiki/questions/open-questions.md`, and `.wiki/wiki/log.md`.

### Task 1: Mobile JS receiver test

**Files:**
- Create: `apps/mobile/__tests__/watch-connectivity-sync.test.tsx`
- Later create: `apps/mobile/src/states/watch-connectivity-sync.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import metadataRichFixture from '../../../packages/contracts/fixtures/metadata-rich-watch-sync-message.json';
import { LocalDiveLogRepository } from '../src/repositories/local-dive-log-repository';
import { diveLogbookQueryKeys } from '../src/states/use-dive-logbook-queries';
import { WatchConnectivitySyncProvider } from '../src/states/watch-connectivity-sync';

const flushPromises = () => new Promise(resolve => setImmediate(resolve));

describe('WatchConnectivitySyncProvider', () => {
  it('drains pending native payloads and imports valid watch sync JSON', async () => {
    const repository = new LocalDiveLogRepository([], { now: () => 1781355000 });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(
        <QueryClientProvider client={queryClient}>
          <WatchConnectivitySyncProvider
            repository={repository}
            drainPendingPayloads={async () => [
              {
                payloadJson: JSON.stringify(metadataRichFixture),
                localSessionId: 'fixture-rich-session',
                receivedAt: 1781355000,
              },
            ]}
            subscribeToPayloads={() => ({ remove: jest.fn() })}
          />
        </QueryClientProvider>,
      );
      await flushPromises();
    });

    const entries = await repository.list();
    expect(entries).toHaveLength(1);
    expect(entries[0].watchCapture?.session.localSessionId).toBe('fixture-rich-session');
    expect(queryClient.getQueryData(diveLogbookQueryKeys.list(repository))).toEqual(entries);
  });

  it('ignores payloads that fail the watch sync contract validator', async () => {
    const repository = new LocalDiveLogRepository([], { now: () => 1781355000 });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(
        <QueryClientProvider client={queryClient}>
          <WatchConnectivitySyncProvider
            repository={repository}
            drainPendingPayloads={async () => [
              {
                payloadJson: '{"type":"sessionEnded","session":{"startedAt":1781352000,"samples":[]}}',
                localSessionId: 'broken-session',
                receivedAt: 1781355000,
              },
            ]}
            subscribeToPayloads={() => ({ remove: jest.fn() })}
          />
        </QueryClientProvider>,
      );
      await flushPromises();
    });

    expect(await repository.list()).toEqual([]);
    expect(queryClient.getQueryData(diveLogbookQueryKeys.list(repository))).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
yarn workspace @repo/mobile test --runTestsByPath __tests__/watch-connectivity-sync.test.tsx --runInBand
```

Expected: fail because `watch-connectivity-sync` does not exist.

### Task 2: Mobile JS receiver implementation

**Files:**
- Create: `apps/mobile/src/native/watch-connectivity.ts`
- Create: `apps/mobile/src/states/watch-connectivity-sync.tsx`
- Modify: `apps/mobile/src/providers.tsx`

- [ ] **Step 1: Add the native wrapper**

```ts
import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

export const WATCH_CONNECTIVITY_PAYLOAD_EVENT = 'DiveWatchSyncPayloadReceived';

export type WatchConnectivityPayload = {
  payloadJson: string;
  localSessionId?: string;
  receivedAt?: number;
};

export type WatchConnectivitySubscription = {
  remove(): void;
};

type WatchConnectivityModule = {
  drainPendingPayloads?: () => Promise<WatchConnectivityPayload[]>;
  addListener?: (eventName: string) => void;
  removeListeners?: (count: number) => void;
};

const nativeModule =
  Platform.OS === 'ios'
    ? (NativeModules.WatchConnectivityModule as WatchConnectivityModule | undefined)
    : undefined;

export function isWatchConnectivityAvailable(): boolean {
  return Boolean(nativeModule?.drainPendingPayloads);
}

export async function drainPendingWatchConnectivityPayloads(): Promise<WatchConnectivityPayload[]> {
  if (!nativeModule?.drainPendingPayloads) {
    return [];
  }

  return nativeModule.drainPendingPayloads();
}

export function subscribeToWatchConnectivityPayloads(
  handler: (payload: WatchConnectivityPayload) => void,
): WatchConnectivitySubscription {
  if (!nativeModule) {
    return { remove() {} };
  }

  const emitter = new NativeEventEmitter(nativeModule);
  return emitter.addListener(WATCH_CONNECTIVITY_PAYLOAD_EVENT, handler);
}
```

- [ ] **Step 2: Add the provider**

```tsx
import { useQueryClient } from '@tanstack/react-query';
import React from 'react';
import { defaultDiveLogRepository } from '../repositories/default-dive-log-repository';
import type { DiveLogRepository } from '../repositories/dive-log-repository';
import { parseWatchSyncMessageJson } from '../utils/watch-sync-message-validation';
import {
  drainPendingWatchConnectivityPayloads,
  subscribeToWatchConnectivityPayloads,
  type WatchConnectivityPayload,
  type WatchConnectivitySubscription,
} from '../native/watch-connectivity';
import { diveLogbookQueryKeys } from './use-dive-logbook-queries';

type WatchConnectivitySyncProviderProps = {
  children?: React.ReactNode;
  repository?: DiveLogRepository;
  drainPendingPayloads?: () => Promise<WatchConnectivityPayload[]>;
  subscribeToPayloads?: (handler: (payload: WatchConnectivityPayload) => void) => WatchConnectivitySubscription;
};

export function WatchConnectivitySyncProvider({
  children,
  repository = defaultDiveLogRepository,
  drainPendingPayloads = drainPendingWatchConnectivityPayloads,
  subscribeToPayloads = subscribeToWatchConnectivityPayloads,
}: WatchConnectivitySyncProviderProps): React.JSX.Element {
  const queryClient = useQueryClient();

  const importPayload = React.useCallback(
    async (payload: WatchConnectivityPayload) => {
      const result = parseWatchSyncMessageJson(payload.payloadJson);

      if (!result.ok) {
        console.warn('Dropped invalid watch sync payload', result.error);
        return;
      }

      const entries = await repository.importWatchMessages([result.message]);
      queryClient.setQueryData(diveLogbookQueryKeys.list(repository), entries);
      queryClient.invalidateQueries({ queryKey: diveLogbookQueryKeys.all(repository) });
    },
    [queryClient, repository],
  );

  React.useEffect(() => {
    let isMounted = true;

    drainPendingPayloads()
      .then(payloads => {
        if (!isMounted) {
          return;
        }
        for (const payload of payloads) {
          void importPayload(payload);
        }
      })
      .catch(error => {
        console.warn('Failed to drain pending watch sync payloads', error);
      });

    const subscription = subscribeToPayloads(payload => {
      void importPayload(payload);
    });

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, [drainPendingPayloads, importPayload, subscribeToPayloads]);

  return <>{children}</>;
}
```

- [ ] **Step 3: Mount the provider**

Wrap `SafeAreaProvider` and downstream providers inside `WatchConnectivitySyncProvider` in `apps/mobile/src/providers.tsx`.

- [ ] **Step 4: Run the focused test**

Run:

```bash
yarn workspace @repo/mobile test --runTestsByPath __tests__/watch-connectivity-sync.test.tsx --runInBand
```

Expected: pass.

### Task 3: Watch outbound transport

**Files:**
- Create: `apps/mobile/ios/DiveWatchApp/Sync/WatchSyncEnvelope.swift`
- Create: `apps/mobile/ios/DiveWatchApp/Sync/WatchSyncTransport.swift`
- Modify: `apps/mobile/ios/DiveWatchApp/Models/DiveSession.swift`
- Modify: `apps/mobile/ios/DiveWatchApp/Storage/DiveSessionStore.swift`
- Modify: `apps/mobile/ios/DiveMobile.xcodeproj/project.pbxproj`

- [ ] **Step 1: Add envelope helper**

```swift
import Foundation

enum WatchSyncEnvelope {
    static let kind = "watchSyncMessage"
    static let kindKey = "kind"
    static let payloadBase64Key = "payloadBase64"
    static let localSessionIdKey = "localSessionId"
    static let sentAtKey = "sentAt"

    static func userInfo(for session: DiveSession, sentAt: Date = Date()) throws -> [String: Any] {
        let payloadData = try session.syncMessageData()

        return [
            kindKey: kind,
            payloadBase64Key: payloadData.base64EncodedString(),
            localSessionIdKey: session.id.uuidString,
            sentAtKey: sentAt.timeIntervalSince1970
        ]
    }
}
```

- [ ] **Step 2: Add transport**

```swift
import Foundation
import WatchConnectivity

protocol WatchSyncTransporting {
    func activate()
    func enqueue(session: DiveSession) -> DiveSyncStatus
}

final class WatchSyncTransport: NSObject, WatchSyncTransporting, WCSessionDelegate {
    private let session: WCSession?

    override init() {
        session = WCSession.isSupported() ? WCSession.default : nil
        super.init()
        session?.delegate = self
    }

    func activate() {
        session?.activate()
    }

    func enqueue(session diveSession: DiveSession) -> DiveSyncStatus {
        guard let session else {
            return .pending
        }

        do {
            let userInfo = try WatchSyncEnvelope.userInfo(for: diveSession)
            session.transferUserInfo(userInfo)
            return .pending
        } catch {
            return .failed
        }
    }

    func session(
        _ session: WCSession,
        activationDidCompleteWith activationState: WCSessionActivationState,
        error: Error?
    ) {}
}
```

- [ ] **Step 3: Update saved session status helper**

Add `withSyncStatus(_:)` to `DiveSession`.

- [ ] **Step 4: Enqueue on store save**

Update `DiveSessionStore` so `init` activates the transport and `save(_:)` stores a session with the status returned by `enqueue(session:)`.

- [ ] **Step 5: Add Xcode target membership**

Add the two new Swift files to the watch project file references, `Sync` group, build files, and Sources build phase.

### Task 4: iOS native receiver bridge

**Files:**
- Create: `apps/mobile/ios/DiveMobile/WatchConnectivityInbox.swift`
- Create: `apps/mobile/ios/DiveMobile/WatchConnectivityModule.swift`
- Create: `apps/mobile/ios/DiveMobile/WatchConnectivityModuleBridge.m`
- Modify: `apps/mobile/ios/DiveMobile/AppDelegate.swift`
- Modify: `apps/mobile/ios/DiveMobile.xcodeproj/project.pbxproj`

- [ ] **Step 1: Add native inbox**

Create an `NSObject` singleton that activates `WCSession`, receives `didReceiveUserInfo`, decodes `payloadBase64`, appends valid payload dictionaries to an in-memory queue on the main queue, and posts `Notification.Name.diveWatchSyncPayloadReceived`.

- [ ] **Step 2: Add React Native event module**

Create an `RCTEventEmitter` named `WatchConnectivityModule` with supported event `DiveWatchSyncPayloadReceived` and promise method `drainPendingPayloads`.

- [ ] **Step 3: Export the Swift module**

Create `WatchConnectivityModuleBridge.m` with `RCT_EXTERN_MODULE` and `RCT_EXTERN_METHOD(drainPendingPayloads:rejecter:)`.

- [ ] **Step 4: Activate at app startup**

Call `WatchConnectivityInbox.shared.activate()` in `AppDelegate.application(_:didFinishLaunchingWithOptions:)`.

- [ ] **Step 5: Add Xcode target membership**

Add all three native files to the mobile project file references, group children, build files, and Sources build phase.

### Task 5: Wiki and verification

**Files:**
- Modify: `.wiki/wiki/architecture/sync-flow.md`
- Modify: `.wiki/wiki/architecture/implementation-priorities.md`
- Modify: `.wiki/wiki/architecture/watch-app.md`
- Modify: `.wiki/wiki/architecture/mobile.md`
- Modify: `.wiki/wiki/questions/open-questions.md`
- Modify: `.wiki/wiki/log.md`

- [ ] **Step 1: Update wiki facts**

Record that WatchConnectivity PoC code exists, but pairing, entitlements, app embedding, background delivery, retry behavior, and real hardware verification remain open.

- [ ] **Step 2: Run focused mobile tests**

Run:

```bash
yarn workspace @repo/mobile test --runTestsByPath __tests__/watch-connectivity-sync.test.tsx __tests__/watch-sync-message-validation.test.ts __tests__/use-dive-logbook-queries.test.ts --runInBand
```

Expected: pass.

- [ ] **Step 3: Run typecheck**

Run:

```bash
yarn mobile:typecheck
```

Expected: pass.

- [ ] **Step 4: Run watch build**

Run:

```bash
yarn watch:build
```

Expected: `BUILD SUCCEEDED`.

- [ ] **Step 5: Run broad handoff check**

Run:

```bash
yarn codex:check
```

Expected: pass. CoreSimulator/log permission warnings are environment warnings if the command exits 0.
