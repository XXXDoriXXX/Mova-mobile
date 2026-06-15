# Native incoming call — build & test guide

The full-screen, self-ringing incoming call (Android) uses native modules and
therefore a **custom dev build — it cannot run in Expo Go**. Decision record:
[ADR-0005](adr/0005-android-native-incoming-call.md).

> ⚠️ The JS/config layer here is unit-tested in CI, but the on-device native
> behaviour (lockscreen full-screen, killed-app wake) could **not** be verified
> in the dev environment — it requires a real Android build. Run the manual
> checklist below on a device before trusting it in production.

## What was added

| Concern | File |
| --- | --- |
| EAS dev-client build profiles | `eas.json` |
| Android call permissions + plugins | `app.config.ts` |
| High-priority call channel | `src/notifications/callChannel.ts` |
| Foreground banner suppression | `src/notifications/notificationHandler.ts` |
| Background push → native call | `src/notifications/backgroundCallTask.ts` |
| callkeep self-managed setup | `src/notifications/nativeCallUi.ts` |
| Missed-call notification | `src/notifications/missedCall.ts` |

New native dependencies: `react-native-callkeep`, `expo-task-manager`,
`expo-dev-client`, `expo-build-properties`.

## One-time setup

1. Set the EAS project id so push-token registration works in a build:
   ```
   EXPO_PUBLIC_EAS_PROJECT_ID=<your-eas-project-id>
   ```
   (in your `.env` / EAS secrets — already read by `app.config.ts`).

2. Make sure FCM is configured for the Android push (Expo push relays through
   FCM): upload the FCM server key / service-account JSON to Expo
   (`eas credentials` → Android → push key), or via the Expo dashboard.

## Build & run

```bash
# Local prebuild + run on a connected device/emulator:
npx expo run:android

# …or a cloud dev build:
npx eas build --profile development --platform android
# then install the APK and start the dev server:
npx expo start --dev-client
```

`npx expo prebuild` regenerates the `android/` project from `app.config.ts`; the
callkeep ConnectionService and the declared permissions merge into the manifest
automatically.

## Manual test checklist (real device)

Caller = a second account on another device/web.

- [ ] **App foreground**: call → in-app incoming screen, vibrates. Answer →
      `/call/live`. Decline → caller sees declined.
- [ ] **App background**: call → full-screen native call over whatever's on
      screen, rings. Answer → app opens to `/call/live`.
- [ ] **Phone locked**: call → full-screen call on the lockscreen. Answer/decline
      from the lockscreen both work (the latter exercises `didLoadWithEvents`).
- [ ] **App killed (swiped away)**: call → device wakes and presents the call.
      Answer opens the app into the live call.
- [ ] **Caller cancels while ringing**: incoming UI dismisses + a "Пропущений
      дзвінок" notification appears.
- [ ] **You decline**: no missed-call notification.
- [ ] **Do Not Disturb on**: the call still rings (channel bypasses DnD).

If killed-app wake proves flaky on some OEMs (aggressive battery killers), the
fallback is a raw FCM `setBackgroundMessageHandler` via
`@react-native-firebase/messaging` — see ADR-0005 alternatives.

## iOS

iOS still receives a tappable notification, not an auto-presented CallKit
screen. Enabling true VoIP inbound needs an Apple VoIP push certificate,
`react-native-voip-push-notification`, and an APNs-VoIP send path on the backend
(`PushNotifierService.sendVoip` already stubs the endpoint). Tracked as a
follow-up.
