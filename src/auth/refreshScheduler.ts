import { performBackgroundRefresh } from "@/api/refresh";
import { useAuthStore } from "@/auth/store";

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
    void performBackgroundRefresh();
    return;
  }
  timer = setTimeout(() => {
    timer = null;
    void performBackgroundRefresh();
  }, delay);
}

export function schedulePreemptiveRefresh(refreshExpiresAt: string | null): void {
  tracked = refreshExpiresAt;
  reschedule(refreshExpiresAt);
}

useAuthStore.subscribe((state) => {
  if (state.refreshExpiresAt !== tracked) {
    tracked = state.refreshExpiresAt;
    reschedule(state.refreshExpiresAt);
  }
});
