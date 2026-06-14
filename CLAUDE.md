# CLAUDE.md — Mova mobile engineering bar

Architecture & decisions: `README.md`, `docs/adr/`. Backend contract: `MOVA/libs/shared-realtime`.
**This file is the non-negotiable engineering standard.** Each rule is here because violating it caused (or would cause) a real bug.

## Golden rules

### 1. Application-layer pattern (ADR-0004) — screens are presentational
Business logic, command wiring, and state transitions live in `src/features/*/application` (hooks, reducers, mappers) and are **unit-tested**. Screens under `app/**` compose and render only. The classic regression is a screen that "forgot" to dispatch a command (the suggestion chip that sent `accept_suggestion` but not `speak`, so nothing was voiced). If you write logic in a screen, move it into `application/` and cover it with a test.

### 2. The WS protocol is a mirrored contract
`src/realtime/protocol.ts` mirrors backend `libs/shared-realtime` **exactly**. A new/changed server event or client command → update the Zod schema here **and** add a fixture in `__tests__/fixtures/ws/`. The reconnect cursor must only persist a real Redis stream id (`/^\d+-\d+$/`) — mirror the gateway's own validation, or a `pong` (which carries `socket.id`, not a stream id) silently wipes replay and you miss every event from the disconnect gap.

### 3. Don't tear down the live socket on incidental re-renders
The call WebSocket effect must not depend on volatile values (e.g. `accessToken`). Hold them in a `ref` and read at connect/reconnect time — a mid-call token refresh must NOT drop the live call.

### 4. Optimistic, then reconcile — never desync from the server
Every optimistic update is paired with the server echo. On reconnect, restore the **real prior status** (don't force `active` for a call that was still ringing) and rely on replay for the gap. A selection (style/voice chip) that only reflects the server echo must also set its optimistic state, or it shows the wrong value when the echo is lost.

### 5. Idempotency keys are tied to the operation
A top-up key is bound to its amount; regenerate per distinct intent. A retry with a changed amount must not reuse a key that returns the original (cached) sum.

## Defaults (senior bar)
- **TypeScript strict** (`noUncheckedIndexedAccess`). No `any`.
- **Server state → TanStack Query; client state → Zustand.** Reducers are pure and unit-tested. Effects: correct dependency arrays; use a `ref` for "latest value without re-running the effect".
- Typed routes + typed deep-link builders; all user-facing text through i18n keys (uk default, en); colors/spacing/typography from theme tokens, never literals.
- **Tests + gate.** Pure logic unit-tested (protocol parsing, store reducers, mappers, formatters, refresh). `npm run prepush` (typecheck + lint + test) green before commit.
- **Commits.** Atomic per logical change; scope prefix (`calls:`/`auth:`/`billing:`/`settings:`); the **why** in the body.
