# ADR-0001: Mirror the realtime protocol verbatim from the backend

## Context

The Mova realtime layer is governed by Zod schemas in
`libs/shared-realtime/src/lib/ws-events.ts` on the backend monorepo. The
original mobile implementation hand-rolled its own `events.ts` and
`commands.ts` from the docs branch. The two drifted: payload field names
(`text` vs `content`), the presence of `messageId` on `transcript.final`, the
shape of `usage.tick` (`{secondsRemaining, planCode}` on the wire vs
`{balanceCents?, freeSecondsRemaining?}` in mobile), and `call.ended`'s
`reason` vs `endReason` — among others. The drift was silent: parsing
succeeded because the mobile types accepted everything, and bubbles rendered
empty because we read missing properties.

## Decision

Mirror `ws-events.ts` verbatim into `src/realtime/protocol.ts`. The file is the
single source of truth on the mobile side. `events.ts` and `commands.ts` are
thin re-exports kept for backward compatibility with existing imports.

Validation: every inbound message is parsed via `parseServerEvent` in
`socket.ts`. Invalid payloads are dropped with a Sentry breadcrumb (the
protocol is the contract; a shape mismatch is a backend bug, not a UI bug).

## Consequences

Pros:
- Future protocol additions are a single-file copy-paste.
- Drift fails loud (events get dropped, breadcrumbs accumulate).
- Tests can validate every variant from JSON fixtures with the same schema
  the server uses.

Cons:
- A protocol change requires syncing two files manually. Tolerable for now;
  if churn grows, consider publishing `@mova/shared-realtime` as a workspace
  package consumed by both sides.

## Alternatives considered

- Import the schema directly across repos via git submodule. Rejected:
  multi-repo lifecycle is heavier than a 200-line copy.
- Generate types from the backend (e.g. ts-json-schema-generator on Zod
  schemas). Rejected: the toolchain cost outweighs the win at this size.
