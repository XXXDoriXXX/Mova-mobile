# ADR-0003: No VoIP-style background mode for MVP

## Context

A live call on Mova holds an open Socket.IO connection to
`/calls`. If the user backgrounds the app mid-call, the OS may suspend the
JS engine and the socket drops. iOS has PushKit + CallKit for "VoIP" apps
to keep the runtime alive; Android needs a foreground service with an
ongoing notification.

Both paths bring real cost:
- iOS VoIP push requires Apple review with PushKit entitlement; misuse is
  rejection-grade.
- Android foreground service requires a persistent notification and a
  background-service permission rationale.

## Decision

MVP does not run in the background. `useAppStateReconnect` watches AppState
and surfaces a "reconnecting" status when the app leaves foreground. On
return to foreground, Socket.IO auto-reconnects; if the socket has died, the
next ping watchdog times out and the call lands on the ended screen with
`reason: "timeout"`.

## Consequences

- If the user backgrounds the app for more than 30–60 seconds, the call will
  reliably end (server-side heartbeat times out). For an MVP whose primary
  surface is "the user is staring at the transcript while it streams," this
  is acceptable.
- The capability to add foreground-service / VoIP push later is unaffected:
  AppState transitions are already wired and the WS reconnect path uses
  `lastStreamId` for replay.

## Alternatives considered

- Android foreground service today. Rejected: review burden + permission
  rationale before we have call-volume to justify it.
- iOS VoIP push today. Rejected: review burden; intended for inbound calls
  in any case (we're outbound-only for now).
