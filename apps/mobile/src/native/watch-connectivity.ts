import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

export const WATCH_CONNECTIVITY_PAYLOAD_EVENT = 'DiveWatchSyncPayloadReceived';

export type WatchConnectivityPayload = {
  payloadId?: string;
  payloadJson: string;
  localSessionId?: string;
  receivedAt?: number;
};

export type WatchConnectivitySubscription = {
  remove(): void;
};

type WatchConnectivityModule = {
  drainPendingPayloads?: () => Promise<WatchConnectivityPayload[]>;
  acknowledgePayloads?: (payloadIds: string[]) => Promise<void>;
  acknowledgeImportedPayloads?: (payloadIds: string[]) => Promise<void>;
  addListener: (eventName: string) => void;
  removeListeners: (count: number) => void;
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

export async function acknowledgeWatchConnectivityPayloads(payloadIds: readonly string[]): Promise<void> {
  if (!nativeModule?.acknowledgePayloads || payloadIds.length === 0) {
    return;
  }

  await nativeModule.acknowledgePayloads([...payloadIds]);
}

export async function acknowledgeImportedWatchConnectivityPayloads(payloadIds: readonly string[]): Promise<void> {
  if (!nativeModule?.acknowledgeImportedPayloads || payloadIds.length === 0) {
    return;
  }

  await nativeModule.acknowledgeImportedPayloads([...payloadIds]);
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
