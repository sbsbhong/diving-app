import notifee, {
  AndroidImportance,
  AuthorizationStatus,
  EventType,
  type Event,
  type InitialNotification,
  type Notification,
} from '@notifee/react-native';
import { AppState, Platform, type AppStateStatus } from 'react-native';
import type { DiveLogEntry } from '../types/dive-log-entry';

export type WatchSyncNotificationOpen = {
  entryLocalId: string;
};

type WatchSyncImportNotificationOptions = {
  enabled: boolean;
  appState?: AppStateStatus;
};

export const WATCH_SYNC_IMPORT_NOTIFICATION_CHANNEL_ID = 'watch-sync-imports';
const WATCH_SYNC_IMPORT_NOTIFICATION_SOURCE = 'watch-sync-import';
const WATCH_SYNC_IMPORT_TITLE = 'Watch log saved';
const WATCH_SYNC_IMPORT_BODY = 'A watch dive log was saved on this device.';

export async function requestWatchSyncNotificationPermission(): Promise<boolean> {
  try {
    const settings = await notifee.requestPermission();

    return (
      settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
      settings.authorizationStatus === AuthorizationStatus.PROVISIONAL
    );
  } catch (error) {
    console.warn('Failed to request watch sync notification permission', error);
    return false;
  }
}

export async function notifyWatchSyncImport(
  entry: DiveLogEntry,
  options: WatchSyncImportNotificationOptions,
): Promise<void> {
  if (!options.enabled || (options.appState ?? AppState.currentState) === 'active') {
    return;
  }

  try {
    const android =
      Platform.OS === 'android'
        ? {
            channelId: await ensureWatchSyncImportChannel(),
            pressAction: {
              id: 'default',
            },
          }
        : undefined;

    await notifee.displayNotification({
      title: WATCH_SYNC_IMPORT_TITLE,
      body: WATCH_SYNC_IMPORT_BODY,
      data: {
        entryLocalId: entry.localId,
        source: WATCH_SYNC_IMPORT_NOTIFICATION_SOURCE,
      },
      android,
      ios: {
        foregroundPresentationOptions: {
          alert: true,
          badge: false,
          sound: false,
        },
      },
    });
  } catch (error) {
    console.warn('Failed to display watch sync notification', error);
  }
}

export async function getInitialWatchSyncNotificationOpen(): Promise<WatchSyncNotificationOpen | undefined> {
  try {
    const initialNotification = await notifee.getInitialNotification();
    return initialNotification ? notificationOpenFromInitialNotification(initialNotification) : undefined;
  } catch (error) {
    console.warn('Failed to read initial watch sync notification', error);
    return undefined;
  }
}

export function subscribeToWatchSyncNotificationOpens(
  listener: (open: WatchSyncNotificationOpen) => void,
): { remove(): void } {
  const unsubscribe = notifee.onForegroundEvent((event: Event) => {
    if (event.type !== EventType.PRESS) {
      return;
    }

    const open = notificationOpenFromNotification(event.detail.notification);

    if (open) {
      listener(open);
    }
  });

  return {
    remove: unsubscribe,
  };
}

async function ensureWatchSyncImportChannel(): Promise<string> {
  return notifee.createChannel({
    id: WATCH_SYNC_IMPORT_NOTIFICATION_CHANNEL_ID,
    name: 'Watch sync imports',
    importance: AndroidImportance.DEFAULT,
  });
}

function notificationOpenFromInitialNotification(
  initialNotification: InitialNotification,
): WatchSyncNotificationOpen | undefined {
  return notificationOpenFromNotification(initialNotification.notification);
}

function notificationOpenFromNotification(notification: Notification | undefined): WatchSyncNotificationOpen | undefined {
  const data = notification?.data;

  if (data?.source !== WATCH_SYNC_IMPORT_NOTIFICATION_SOURCE || typeof data.entryLocalId !== 'string') {
    return undefined;
  }

  return {
    entryLocalId: data.entryLocalId,
  };
}
