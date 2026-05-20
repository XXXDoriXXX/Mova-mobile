import { performBackgroundRefresh } from "@/api/refresh";
import { useAuthStore } from "@/auth/store";

/**
 * Pre-emptive refresh: fires ~60s before the refresh token expires so the
 * next request doesn't pay the cost of a 401 → refresh → retry round-trip.
 *
 * Wiring: the module subscribes to the auth store at first import. Any
 * change to `refreshExpiresAt` reschedules the timer. The subscription
 * is one-shot and survives the app's lifetime.
 *
 * The store does NOT import this file — that broke the require cycle the
 * Metro bundler used to warn about (store ↔ refreshScheduler ↔ api/refresh).
 * `app/_layout.tsx` imports this module purely for the side effect.
 */

const LEAD_TIME_MS = 60_000;

let timer: ReturnType<typeof setTimeout> | null = null;
let tracked: string | null = null;

function reschedule(refreshExpiresAt: string | null): void {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  if (!refreshExpiresAt) return;
  const expiresAtMs = Date.parse(refreshExpiresAt);
  if (!Number.isFinite(expiresAtMs)) return;
  const fireAtMs = expiresAtMs - LEAD_TIME_MS;
  const delay = fireAtMs - Date.now();
  if (delay <= 0) {
    // Already expired or about to — fire immediately. Don't recurse on
    // failure (the axios 401 interceptor will catch the next request).
    void performBackgroundRefresh();
    return;
  }
  timer = setTimeout(() => {
    timer = null;
    void performBackgroundRefresh();
  }, delay);
}

/**
 * Public API used by tests. In production the store subscription below
 * keeps things in sync automatically; tests drive the scheduler directly
 * without spinning up the full auth store.
 */
export function schedulePreemptiveRefresh(refreshExpiresAt: string | null): void {
  tracked = refreshExpiresAt;
  reschedule(refreshExpiresAt);
}

// Side-effect subscription: react to changes in `refreshExpiresAt` only.
// Other store fields (status, user, etc.) churn frequently — re-running the
// timer for each would be wasteful.
useAuthStore.subscribe((state) => {
  if (state.refreshExpiresAt !== tracked) {
    tracked = state.refreshExpiresAt;
    reschedule(state.refreshExpiresAt);
  }
});
