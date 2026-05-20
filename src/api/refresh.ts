import axios from "axios";

import { useAuthStore } from "@/auth/store";
import { API_BASE_URL } from "@/constants/env";
import type { AuthTokens, RefreshResponse } from "@/types/api";

/**
 * Single-flight refresh primitive. Used by both the axios 401 interceptor and
 * the pre-emptive scheduler so a burst of triggers turns into exactly one
 * round-trip. On failure the auth store is cleared, surfacing the user to the
 * Welcome screen via AuthGate.
 */
let inflight: Promise<AuthTokens | null> | null = null;

async function doRefresh(): Promise<AuthTokens | null> {
  const state = useAuthStore.getState();
  const { refreshToken, refreshExpiresAt } = state;
  if (!refreshToken) return null;
  try {
    const resp = await axios.post<RefreshResponse>(
      `${API_BASE_URL}/auth/refresh`,
      { refreshToken },
      { timeout: 10_000 },
    );
    const next: AuthTokens = {
      accessToken: resp.data.accessToken,
      refreshToken: resp.data.refreshToken ?? refreshToken,
      refreshExpiresAt:
        resp.data.refreshExpiresAt ??
        refreshExpiresAt ??
        new Date(0).toISOString(),
    };
    await useAuthStore.getState().setTokens(next);
    return next;
  } catch {
    await useAuthStore.getState().clear();
    return null;
  }
}

export function performRefresh(): Promise<AuthTokens | null> {
  if (!inflight) {
    inflight = doRefresh().finally(() => {
      inflight = null;
    });
  }
  return inflight;
}

/** Pre-emptive trigger; identical semantics, same de-duplication. */
export function performBackgroundRefresh(): Promise<AuthTokens | null> {
  return performRefresh();
}
