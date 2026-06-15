# ADR-0005: Android-first native incoming call

## Context

An incoming app-to-app call previously only reached the user when the app was
already foregrounded with a live `/signal` socket. Backgrounded or killed, the
push (`type: "incoming_call"`) arrived as an ordinary notification the user had
to find and tap — nothing like the full-screen, self-ringing screen of a normal
phone. ADR-0003 covers keeping a call alive in the background; this ADR covers
*presenting the inbound call* in the first place.

A true "the phone rings on its own, full screen, even locked" experience needs
native code and so a custom dev build (Expo Go cannot run it):

- **Android**: a `IMPORTANCE.MAX` notification channel + a self-managed
  ConnectionService (`react-native-callkeep`) presented from a background task
  that the push wakes. All achievable in JS + config.
- **iOS**: real auto-presentation requires PushKit (VoIP push) + CallKit + an
  Apple VoIP push certificate and an APNs-VoIP send path on the backend (Expo
  push cannot trigger CallKit). Heavier infra, gated on credentials we don't yet
  have.

## Decision

Ship the Android native incoming call now; keep iOS on ordinary notifications
until the VoIP cert + backend APNs-VoIP path exist.

Android flow:
1. Backend sends the existing Expo push (`channelId: "incoming-calls"`,
   high priority, `data.type === "incoming_call"`).
2. `incoming-calls` channel is created at boot at `IMPORTANCE.MAX` with DnD
   bypass and public lockscreen visibility (`src/notifications/callChannel.ts`).
3. Backgrounded/killed: an `expo-notifications` background task
   (`src/notifications/backgroundCallTask.ts`) wakes, parses the payload and
   calls `presentIncomingCall` → callkeep shows the full-screen native call.
4. Foregrounded: the live `/signal` socket routes to the in-app screen as
   before; the foreground notification handler suppresses the duplicate banner.
5. Answer/decline on the lockscreen routes back through callkeep
   (`src/notifications/nativeCallUi.ts`), including `didLoadWithEvents` replay
   for actions taken before the JS engine booted.

## Consequences

- Requires a dev/EAS build with the new native modules — see
  `docs/native-incoming-call.md`. The JS/config layer is unit-tested; the
  on-device native behaviour must be verified on a real Android build.
- iOS users still get a tappable notification, not an auto-presented CallKit
  screen. Closing that gap is a follow-up (Apple VoIP cert + APNs-VoIP).
- The backend push contract is unchanged; no server work was required.

## Alternatives considered

- **notifee full-screen-intent instead of callkeep**: viable, but callkeep also
  gives system answer/decline affordances and a call-style ongoing service, a
  closer match to "a normal phone". 
- **Raw FCM `setBackgroundMessageHandler` (@react-native-firebase)**: more
  reliable killed-state wake, but pulls in the full Firebase SDK and a second
  push pipeline. Deferred unless the expo-notifications background task proves
  unreliable in the field.
