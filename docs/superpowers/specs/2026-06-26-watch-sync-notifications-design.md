# Watch Sync Notifications Design

## Goal

Show a user-visible result when a watch session reaches the mobile local repository before real-device WatchConnectivity validation. Foreground users should see a persistent in-app toast. Background or killed-app users should see a local notification through a React Native notification library.

This design uses Notifee for local notifications. It does not implement remote push, Supabase sync, or cloud-backup status.

## Scope

In scope:

- Add Notifee as the local notification library for iOS and Android.
- Add a Settings opt-in named around "watch sync notifications".
- Request notification permission only when the user enables that setting.
- Show notification/toast only after a valid watch payload is imported into the local `DiveLogRepository`.
- Keep foreground toast visible until the user closes it.
- Route notification press to the imported Logbook detail when possible.
- Keep invalid payloads and local save failures silent except for existing logs and retry behavior.

Out of scope:

- Remote push notifications.
- Supabase or remote repository sync notifications.
- Claiming actual paired-device or background delivery is verified before hardware testing.
- Android watch transport. Android should share the notification service interface, but the current watch sync source remains iOS WatchConnectivity.

## Architecture

Add a small notification boundary in mobile JS:

- `WatchSyncNotificationService`: owns Notifee permission, channel creation, local notification display, and notification-open bootstrap data.
- `WatchSyncNotificationPreferences`: stored with app preferences or a nearby versioned store, with at least `watchSyncNotificationsEnabled`.
- `WatchConnectivitySyncProvider`: keeps contract validation and local repository import ownership. After local import succeeds, it emits a "watch log stored locally" event to the notification service.
- Root navigation: keeps the existing watch import toast surface, but removes the auto-dismiss timer.

The repository import result is the source of truth. "Synced" in this feature means "stored in the mobile local repository", not "uploaded to Supabase".

## Data Flow

1. User enables watch sync notifications in Settings.
2. App requests notification permission through Notifee.
3. WatchConnectivity delivers a payload to mobile native code.
4. Mobile JS validates the payload against the watch sync contract.
5. `DiveLogRepository.importWatchMessages` stores the entry locally.
6. JS marks the imported entry `synced` for the mobile top-level local state.
7. Notification service checks app foreground state and opt-in state.
8. Foreground: show persistent toast with open and close actions.
9. Background or killed app: show a Notifee local notification.

## User Copy

Use local-device wording:

- Title: "Watch log saved"
- Body: "A watch dive log was saved on this device."

Do not use:

- "Cloud synced"
- "Backed up"
- "Uploaded"
- "Dive computer data verified"

## Error Handling

- Invalid contract payload: acknowledge/drop from native inbox, no notification.
- Local repository import failure: do not acknowledge imported payload, no notification, allow existing retry on app restart.
- Notification permission denied: keep local import behavior unchanged and show only foreground toast while the app is open.
- Notifee unavailable in tests or unsupported environments: use a no-op adapter and keep repository import intact.

## Testing

- Unit-test the Notifee wrapper with mocked permission/channel/display calls.
- Unit-test foreground import success showing a persistent toast.
- Unit-test toast close and open-log actions.
- Unit-test invalid payload and local repository failure do not trigger notifications.
- Unit-test Settings opt-in stores the preference and requests permission.
- Run `yarn mobile:typecheck`.

Manual gates before real-device sync claims:

- iOS foreground import shows persistent toast.
- iOS background/killed import displays a local notification when the OS delivers the WatchConnectivity payload.
- Android foreground/background notification service behavior works with a simulated local event, while Android watch transport remains out of scope.

## Sources

- User-approved direction on 2026-06-26.
- `apps/mobile/src/states/watch-connectivity-sync.tsx`
- `apps/mobile/src/components/navigation/index.tsx`
- `apps/mobile/ios/DiveMobile/WatchConnectivityInbox.swift`
- Notifee documentation: https://notifee.app/react-native/docs/overview/
- Notifee notification display documentation: https://notifee.app/react-native/docs/displaying-a-notification/
- Notifee event documentation: https://notifee.app/react-native/docs/events/
