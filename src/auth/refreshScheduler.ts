import { performBackgroundRefresh } from "@/api/refresh";

/**
 * Schedules a single in-flight refresh ~60s before the refresh-token expires.
 * Saves a 401 round-trip on the first call after the access token's 15-minute
 * TTL elapses. Cleared on logout (call with `null`).
 *
 * This is best-effort: if the timer doesn't fire (app killed, OS throttling)
 * the axios 401 interceptor still recovers transparently.
 */

const LEAD_TIME_MS = 60_000;

let timer: ReturnType<typeof setTimeout> | null = null;

export function schedulePreemptiveRefresh(refreshExpiresAt: string | null): void {
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
    // Already expired or about to — fire immediately, but don't recurse on
    // failure (axios interceptor will handle the rest).
    void performBackgroundRefresh();
    return;
  }
  timer = setTimeout(() => {
    timer = null;
    void performBackgroundRefresh();
  }, delay);
}
