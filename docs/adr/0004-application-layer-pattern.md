# 0004 — Application layer pattern (hook-as-viewmodel)

**Status:** accepted
**Date:** 2026-06
**Supersedes:** —

## Context

The mobile codebase grew into a working feature-based layout, but
business logic, side-effects, and UI ended up mixed inside the same
components. A typical screen handler did API calls + store mutations +
navigation + haptics + analytics in one `onSubmit`. Symptoms:

  - Changing a button visually risked breaking the network flow.
  - Logic couldn't be reused across screens (e.g. the same "sign in"
    flow on the welcome screen vs a re-auth modal).
  - Tests had to mount React for things that should be plain function
    calls.
  - Coupling between features was implicit — nothing stopped one
    feature from reaching into another's internals.

We needed a separation that respects React Native's grain (no DI
container, no classes), keeps the cognitive overhead near zero, and
can be adopted incrementally.

## Decision

Each feature owns three layers, by directory:

```
features/<feature>/
├── ui/             — components. Stateless rendering. No fetch, no
│                     navigation, no side-effects. Reads from props +
│                     react-hook-form. Calls hooks from application/.
├── application/    — hooks (use cases) + pure decision functions.
│                     This is "the logic". Orchestrates: validates,
│                     calls api/ + stores, mutates state, triggers
│                     haptics. Returns a typed result so UI knows
│                     what to show.
└── index.ts        — public API. Re-exports only what other modules
                      and the routing layer may import.
```

ESLint enforces the boundary: deep imports into another feature
(`@/features/X/internals/...`) are rejected. Cross-feature talk goes
through the target feature's `index.ts`.

State stays where it is today:
  - server data — TanStack Query
  - cross-screen client state — Zustand stores (named `<feature>Store`)
  - single-screen ephemeral state — `useState` inside the relevant hook

There is **no domain layer on the mobile side**. Business rules live
on the backend (REST + WS protocol). The mobile "application" layer
exists only to orchestrate input + io + state.

## Use case hook contract

A use-case hook returns `{ ...state, execute }` where `execute` is the
async action and the rest is observable progress / error state.
`execute` resolves to a discriminated-union result so the UI can
choose what to surface, without the hook knowing about field IDs or
i18n strings.

```ts
type Result<E = AuthErrorPayload> =
  | { ok: true }
  | { ok: false; error: E };

function useLoginUseCase() {
  const [submitting, setSubmitting] = useState(false);
  async function execute(values: LoginValues): Promise<Result> { ... }
  return { submitting, execute };
}
```

## Pure decision functions

Anything that can be expressed as `(inputs) => outputs` without side
effects lives in `application/` as a plain `.ts` file. Examples:
`decideAuthRedirect(status, onboardingStatus, segment)`,
`mapWsEventToBubble(event)`, `selectCallScreenState(store)`.

These are the cheapest tests in the codebase: one file, no React, no
mocks, asserts against a constant.

## Adoption

We do **not** rewrite everything at once. The auth feature ships as
the reference template. Every feature migrates the next time it's
touched for a non-trivial change. Existing tests keep working —
nothing in this ADR mandates renaming a file or replacing a primitive.

## Consequences

Positive:
  - UI components become swappable without risking the network flow.
  - Use cases are testable with `renderHook` (or even called as plain
    functions when they don't need React state).
  - One feature can't accidentally import another's internals — the
    `index.ts` surface is the contract.
  - The pattern matches what the backend already does (controllers
    delegate to use cases that depend on ports), making cross-stack
    reasoning consistent.

Negative:
  - Two extra directories per feature. For trivial features this is
    overhead.
  - Every screen handler grows by one or two function calls.
  - Developers have to choose where to put a function. The ADR + lint
    rule is the answer; the convention is "default to application/,
    move to ui/ only when it's purely a rendering helper".

Rejected alternatives:
  - **Full Clean Architecture / DDD**: domain entities, repositories,
    services. Overengineered for a presentation client whose only
    persistence is the backend's.
  - **Redux Toolkit**: zustand already gives us the same store
    semantics with 10× less API.
  - **MobX / Effector / RxJS**: introduce a runtime + mental model
    that nothing else in the stack uses.
  - **Container / Presenter as a global convention** (smart vs dumb
    components): still mixes IO with UI inside the smart component —
    we want the seam between them to be a hook, not a parent.
