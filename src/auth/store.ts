import { create } from "zustand";

import type { AuthTokens, User } from "@/types/api";

import { clearTokens, loadTokens, saveTokens } from "./tokens";

export type AuthStatus = "unknown" | "authed" | "guest";

type AuthState = {
  status: AuthStatus;
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  refreshExpiresAt: string | null;
  hydrate: () => Promise<void>;
  setSession: (payload: { user: User; tokens: AuthTokens }) => Promise<void>;
  setUser: (user: User) => void;
  setTokens: (tokens: AuthTokens) => Promise<void>;
  clear: () => Promise<void>;
};

// Pre-emptive refresh is driven by `auth/refreshScheduler.ts`, which
// subscribes to this store. Keeping the dependency one-way (store →
// scheduler is forbidden, scheduler → store is allowed) breaks the cycle
// that Metro warned about.

export const useAuthStore = create<AuthState>((set) => ({
  status: "unknown",
  user: null,
  accessToken: null,
  refreshToken: null,
  refreshExpiresAt: null,

  async hydrate() {
    if (__DEV__) console.log("[mova/auth] hydrate: start");
    try {
      const tokens = await loadTokens();
      if (__DEV__) console.log("[mova/auth] hydrate: tokens", tokens ? "present" : "absent");
      if (!tokens) {
        set({
          status: "guest",
          accessToken: null,
          refreshToken: null,
          refreshExpiresAt: null,
          user: null,
        });
        return;
      }
      set({
        status: "authed",
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        refreshExpiresAt: tokens.refreshExpiresAt,
      });
    } catch (err) {
      if (__DEV__) console.warn("[mova/auth] hydrate failed → forcing guest:", err);
      set({
        status: "guest",
        accessToken: null,
        refreshToken: null,
        refreshExpiresAt: null,
        user: null,
      });
    }
  },

  async setSession({ user, tokens }) {
    await saveTokens(tokens);
    set({
      status: "authed",
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      refreshExpiresAt: tokens.refreshExpiresAt,
    });
  },

  setUser(user) {
    set({ user });
  },

  async setTokens(tokens) {
    await saveTokens(tokens);
    set({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      refreshExpiresAt: tokens.refreshExpiresAt,
    });
  },

  async clear() {
    await clearTokens();
    set({
      status: "guest",
      user: null,
      accessToken: null,
      refreshToken: null,
      refreshExpiresAt: null,
    });
  },
}));

export function getAuthSnapshot(): {
  accessToken: string | null;
  refreshToken: string | null;
} {
  const { accessToken, refreshToken } = useAuthStore.getState();
  return { accessToken, refreshToken };
}
