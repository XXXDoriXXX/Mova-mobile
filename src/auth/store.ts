import { create } from "zustand";

import type { AuthTokens, User } from "@/types/api";

import { clearTokens, loadTokens, saveTokens } from "./tokens";

export type AuthStatus = "unknown" | "authed" | "guest";

type AuthState = {
  status: AuthStatus;
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  hydrate: () => Promise<void>;
  setSession: (payload: { user: User; tokens: AuthTokens }) => Promise<void>;
  setUser: (user: User) => void;
  setTokens: (tokens: AuthTokens) => Promise<void>;
  clear: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  status: "unknown",
  user: null,
  accessToken: null,
  refreshToken: null,

  async hydrate() {
    const tokens = await loadTokens();
    if (!tokens) {
      set({ status: "guest", accessToken: null, refreshToken: null, user: null });
      return;
    }
    set({
      status: "authed",
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  },

  async setSession({ user, tokens }) {
    await saveTokens(tokens);
    set({
      status: "authed",
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
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
    });
  },

  async clear() {
    await clearTokens();
    set({
      status: "guest",
      user: null,
      accessToken: null,
      refreshToken: null,
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
