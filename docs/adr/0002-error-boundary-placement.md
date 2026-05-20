# ADR-0002: Single root-level error boundary

## Context

React error boundaries can be placed at multiple levels: per route, per
feature, or at the root. Each layer below the root reduces blast radius but
also creates more places to maintain a fallback UI and more ways for an
exception to be silently absorbed into a "dismiss" button.

## Decision

One `<ErrorBoundary>` at the root of `app/_layout.tsx`. It captures every
render-time exception, reports to Sentry, and renders a themed fallback with
two recovery actions: Reload (via `expo-updates.reloadAsync` when present)
and Sign out (`useAuthStore.clear()`).

## Rationale

The Mova app surface is small (~15 screens, all behind auth). Most screens are
read-only or single-mutation. A render-time exception is almost always a
recoverable client bug — the right move is to crash visibly, capture the
stack, and let the user reload from a known-good state. Per-route boundaries
would invite "swallow the bug" UX patterns.

## Consequences

- One source of truth for the fallback UI. Easy to evolve, easy to test.
- A throw inside one tab will fall back the entire app. Acceptable for now;
  if a screen grows to host long-running flows that shouldn't be terminated
  on a render error elsewhere, wrap that screen in its own boundary.

## Alternatives considered

- Per-route boundaries wrapping each `(app)/*.tsx`. Rejected: ~14 places to
  keep in sync; encourages hiding bugs.
- Error boundary in `(app)/_layout.tsx` only, leaving `(auth)` raw. Rejected:
  a registration-form crash would leave the user stranded with no recovery.
