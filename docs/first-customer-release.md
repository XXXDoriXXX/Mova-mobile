# Closed browser beta

The current target is invited testers through https://mova.dehimik.org on desktop, Android and iPhone browsers. No store account, APK or email service is required for this beta.

## Build and check

```sh
npm ci
npm run prepush
EXPO_PUBLIC_API_URL=https://mova.dehimik.org/v1 EXPO_PUBLIC_WS_URL=wss://mova.dehimik.org EXPO_PUBLIC_BETA_ONLY=true npx expo export --platform web --output-dir dist
```

Every push/PR runs checks and browser export on Node22. The backend release reads the mobile commit from `infra/server/mobile-web.ref`, builds `ghcr.io/xxxdorixxx/mova-browser:<full mobile Git SHA>`, and publishes it with the backend images. Update that pinned reference in a backend release to publish a new client version. The server explicitly pins the tested client image in `.beta.env`. See backend `infra/server/README.md` for activation and rollback. Browser CI does not need EXPO_TOKEN or Firebase native config files.

## Access

Beta builds show invitation-only sign-in. An authenticated administrator creates individual tester accounts via `POST /v1/admin/beta-users` while `BETA_ACCESS_ENABLED=true`. The endpoint returns no credentials/session and does not send email. Public signup and Google creation of new accounts are blocked in beta mode. When beta mode is disabled, normal registration still requires email verification. If a tester forgets their password, contact the person who invited them; email reset is not offered in this beta.

Use unique tester passwords, send sign-in details privately, and invite people who agree to test. No production emails, real-payment credentials or personal user data should be included in builds or GitHub artifacts.

## Device acceptance

Verify the beta from a real desktop browser and actual Android/iPhone browser: login, onboarding, call transcript, typed reply, history and logout. Browser peer calling uses LiveKit WebRTC and requires HTTPS, microphone permission and allowed audio playback. Foreground incoming calls can be delivered while the tab is active. Closed/suspended browser tabs do not support native wake-up/ringing. Two-account microphone/audio behavior and iPhone Safari autoplay require live testing; a successful export alone is not that evidence.

This is an invitation beta, not a public store release. Real payments and marketing promises are outside this beta scope. Browser install-to-home-screen/offline behavior is not guaranteed by serving the web export.

Browser images are published by the backend repository, so the existing backend deployment token can pull them without cross-repository package grants.
