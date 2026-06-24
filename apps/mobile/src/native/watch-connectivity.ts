import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import type { DivePlan } from '../types/dive-plan';

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
  updatePlannedDives?: (plannedDivesJson: string) => Promise<void>;
  addListener: (eventName: string) => void;
  removeListeners: (count: number) => void;
};

type WatchPlannedDivePayload = {
  localId: string;
  title?: string;
  siteName?: string;
  diveMode?: DivePlan['diveMode'];
  entryStyle?: DivePlan['entryStyle'];
  plannedAt?: number;
  plannedMaxDepthMeters?: number;
  plannedDurationMinutes?: number;
  gasLabel?: string;
  buddyIds: string[];
  tags: string[];
  notes?: string;
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

export async function updatePlannedWatchDives(plans: readonly DivePlan[]): Promise<void> {
  if (!nativeModule?.updatePlannedDives) {
    return;
  }

  const plannedDives = plans.filter(isWatchVisiblePlan).map(toWatchPlannedDivePayload);
  await nativeModule.updatePlannedDives(JSON.stringify(plannedDives));
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

function isWatchVisiblePlan(plan: DivePlan): boolean {
  return plan.status === 'planned' && !plan.convertedLogLocalId;
}

function toWatchPlannedDivePayload(plan: DivePlan): WatchPlannedDivePayload {
  return {
    localId: plan.localId,
    title: plan.title,
    siteName: plan.site.name,
    diveMode: plan.diveMode,
    entryStyle: plan.entryStyle,
    plannedAt: plan.plannedAt,
    plannedMaxDepthMeters: plan.plannedValues.plannedMaxDepthMeters,
    plannedDurationMinutes: plan.plannedValues.plannedDurationMinutes,
    gasLabel: plan.plannedValues.gasLabel,
    buddyIds: plan.buddyIds,
    tags: plan.tags,
    notes: plan.notes ?? plan.objective,
  };
}
