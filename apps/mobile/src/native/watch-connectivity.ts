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

export function subscribeToWatchConnectivityPayloads(
  handler: (payload: WatchConnectivityPayload) => void,
): WatchConnectivitySubscription {
  if (!nativeModule) {
    return { remove() {} };
  }

  const emitter = new NativeEventEmitter(nativeModule);
  return emitter.addListener(WATCH_CONNECTIVITY_PAYLOAD_EVENT, handler);
}
