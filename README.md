# Mova Mobile

![Expo](https://img.shields.io/badge/Expo_SDK_54-000020?logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native-0.81-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![TanStack Query](https://img.shields.io/badge/TanStack_Query-5-FF4154?logo=reactquery&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?logo=socketdotio&logoColor=white)
![LiveKit](https://img.shields.io/badge/LiveKit-000000?logo=livekit&logoColor=white)
![Jest](https://img.shields.io/badge/tests-Jest-C21325?logo=jest&logoColor=white)

React Native (Expo) client for **MOVA**, a service that lets deaf and mute people make ordinary phone calls. The user types, an AI voice speaks to the other person, and the replies come back as live text.

## Related repositories

| Repo | Role |
|------|------|
| **[MOVA](https://github.com/XXXDoriXXX/MOVA)** | Backend: REST API, realtime gateway, voice agent, admin panel |
| **[Mova-mobile](https://github.com/XXXDoriXXX/Mova-mobile)** (this repo) | Mobile client |

The app uses the backend REST API (port 3000, prefix `/v1`) and its Socket.IO gateway (port 3002, namespace `/calls`). The WebSocket protocol in `src/realtime/protocol.ts` mirrors `libs/shared-realtime` in the backend. See [ADR 0001](./docs/adr/0001-realtime-protocol-mirror.md).

## Features

- Registration and login with email and password, Google sign-in (optional) and an email verification screen
- Phone calls: number input or contacts picker (normalised to E.164), template and conversation-style selection
- Live call screen: streamed AI replies, reply suggestions, in-call style and voice switching, automatic reconnect with event replay
- App-to-app calls with native incoming-call UI on Android (dev build required)
- Call history with search and status filters, transcript sharing and copying
- Billing: balance, plans, usage, top-up with idempotency keys
- Templates and styles management, style-adaptation profile
- Settings: profile, password change, account deletion, push notifications, light/dark/system theme, four font sizes
- Onboarding, Ukrainian and English UI, deep links (`mova://`), offline banner, error boundary, optional Sentry

## Tech stack

Expo SDK 54, Expo Router (typed routes), React Native 0.81 (new architecture), TypeScript strict, TanStack Query, Zustand, axios (single-flight token refresh), socket.io-client, LiveKit React Native, react-hook-form with Zod, i18next, expo-secure-store, Firebase Auth, react-native-callkeep, Jest.

## Getting started

Requirements: Node.js 20+ and npm. For iOS you need macOS and Xcode; for Android, Android Studio or a device.

1. Start the backend from the [MOVA](https://github.com/XXXDoriXXX/MOVA) repo (`make up`). It serves the API on port 3000 and WebSocket on port 3002.
2. Install and configure the app:

```sh
git clone https://github.com/XXXDoriXXX/Mova-mobile.git
cd Mova-mobile
npm install
cp .env.example .env.local
npm run start
```

3. Press `i` for the iOS simulator or `a` for Android.

The app uses native modules (LiveKit WebRTC, CallKeep, Firebase), so Expo Go is not enough for full functionality. Use a development build: `eas build --profile development` (profiles in `eas.json`), or `npx expo prebuild` followed by a local run, then `npx expo start --dev-client`.

For Firebase push and phone auth on Android, place your own `google-services.json` in the project root (it is gitignored) or set `GOOGLE_SERVICES_JSON` to its path.

On a real device `localhost` points to the phone. In development the app rewrites `localhost` to the Metro LAN IP automatically; set the variables below to a real hostname to override.

## Environment variables

Copy `.env.example` to `.env.local`. These values are bundled into the app, so never put secrets in them.

| Variable | Default | Purpose |
|----------|---------|---------|
| `EXPO_PUBLIC_API_URL` | `http://localhost:3000/v1` | REST base URL, including `/v1` |
| `EXPO_PUBLIC_WS_URL` | `ws://localhost:3002` | Socket.IO gateway |
| `EXPO_PUBLIC_SENTRY_DSN` | empty | Enables Sentry when set |
| `EXPO_PUBLIC_GOOGLE_OAUTH_WEB_CLIENT_ID` | empty | Google sign-in (web); leave all three empty to hide the button |
| `EXPO_PUBLIC_GOOGLE_OAUTH_ANDROID_CLIENT_ID` | empty | Google sign-in (Android) |
| `EXPO_PUBLIC_GOOGLE_OAUTH_IOS_CLIENT_ID` | empty | Google sign-in (iOS) |

## Scripts

| Command | What it does |
|---------|--------------|
| `npm run start` | Metro dev server (LAN) |
| `npm run start:tunnel` | Dev server through a tunnel |
| `npm run android`, `npm run ios`, `npm run web` | Start and open on a platform |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Jest |
| `npm run prepush` | Typecheck, lint and tests; must pass before a PR |

## Project structure

```
app/            Expo Router routes: (auth) public, (app) private tabs and screens
src/
  api/          axios client, per-resource modules, token refresh
  auth/         Zustand store, auth gate, secure token storage, refresh scheduler
  realtime/     WebSocket protocol, Socket.IO client, call signalling
  features/     Screen logic per area (auth, billing, calls, contacts, conversations, history, home, settings, styles, templates)
  components/   Themed UI primitives
  theme/        Design tokens and theme provider
  i18n/         Ukrainian and English dictionaries
  notifications/, navigation/, net/, observability/, utils/, types/
__tests__/      Jest suites and WebSocket fixtures
docs/           ADRs and call-flow documents
landing/        Static landing page
plugins/        Expo config plugins (CallKeep, TurboModule interop)
```

Screens only render; business logic lives in `src/features/*/application` and is unit-tested ([ADR 0004](./docs/adr/0004-application-layer-pattern.md)).

## Deep links

Scheme `mova://`. Typed builders are in `src/navigation/deepLinks.ts`.

```
mova://welcome
mova://home
mova://billing
mova://settings/style-profile
mova://conversation/<uuid>
mova://call/pre
mova://call/live?conversationId=<uuid>&initialStyleId=builtin:friendly
```

## Changing the backend contract

If the backend adds a WebSocket event or field:

1. Update `src/realtime/protocol.ts` to match `libs/shared-realtime/src/lib/ws-events.ts`.
2. For a new event, add a fixture in `__tests__/fixtures/ws/<name>.json`.
3. Run `npm run prepush`.

## Documentation

- [`docs/adr/`](./docs/adr): architecture decisions (protocol mirror, error boundary, no background VoIP in the MVP, application-layer pattern, Android native incoming call)
- [`docs/incoming-calls.md`](./docs/incoming-calls.md) and [`docs/native-incoming-call.md`](./docs/native-incoming-call.md): app-to-app and native incoming calls (in Ukrainian)
- [`CLAUDE.md`](./CLAUDE.md): engineering standards

## Manual QA checklist

Run on a real device after changes to auth, calls or billing.

- [ ] Register, restart the app cold, and stay signed in
- [ ] Wrong password shows a banner; correct password opens home
- [ ] Access token refreshes silently after expiry
- [ ] Live call: messages have text, suggestion tap is spoken, timer and free seconds update, ended screen shows the reason
- [ ] App sent to background mid-call shows a reconnect banner and recovers or ends with a timeout
- [ ] Repeating the same top-up amount adds the balance only once
- [ ] Old password fails after a password change; the new one works
- [ ] Account deletion asks for the password and returns to the welcome screen
- [ ] Theme and font size persist after restart
- [ ] `mova://billing` from another app opens Billing
- [ ] Offline banner appears without request spam and data refetches on reconnect

## License

No license file is included.
