/* eslint-disable @typescript-eslint/no-require-imports */

describe("auth store", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("hydrate() lands in `guest` when no tokens are persisted", async () => {
    const { useAuthStore } = require("@/auth/store");
    await useAuthStore.getState().hydrate();
    expect(useAuthStore.getState().status).toBe("guest");
    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it("setSession persists tokens, exposes them in snapshot, status = authed", async () => {
    const { useAuthStore, getAuthSnapshot } = require("@/auth/store");
    await useAuthStore.getState().setSession({
      user: {
        id: "user-1",
        email: "a@b.c",
        name: "Test",
        role: "user",
        language: "uk",
        phoneNumber: null,
        preferredVoice: null,
        preferredLlmProvider: null,
        preferredLlmModel: null,
        preferredTtsProvider: null,
        preferredStyleId: null,
        createdAt: new Date().toISOString(),
      },
      tokens: {
        accessToken: "access-1",
        refreshToken: "refresh-1",
        refreshExpiresAt: new Date(Date.now() + 60_000).toISOString(),
      },
    });
    expect(useAuthStore.getState().status).toBe("authed");
    expect(getAuthSnapshot()).toEqual({
      accessToken: "access-1",
      refreshToken: "refresh-1",
    });
  });

  it("clear() returns to guest and wipes all tokens", async () => {
    const { useAuthStore } = require("@/auth/store");
    await useAuthStore.getState().setSession({
      user: {
        id: "user-1",
        email: "a@b.c",
        name: "Test",
        role: "user",
        language: "uk",
        phoneNumber: null,
        preferredVoice: null,
        preferredLlmProvider: null,
        preferredLlmModel: null,
        preferredTtsProvider: null,
        preferredStyleId: null,
        createdAt: new Date().toISOString(),
      },
      tokens: {
        accessToken: "access-1",
        refreshToken: "refresh-1",
        refreshExpiresAt: new Date(Date.now() + 60_000).toISOString(),
      },
    });
    await useAuthStore.getState().clear();
    expect(useAuthStore.getState().status).toBe("guest");
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(useAuthStore.getState().refreshToken).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
  });

  it("hydrate() loads previously-saved tokens after restart", async () => {
    const { useAuthStore } = require("@/auth/store");
    await useAuthStore.getState().setSession({
      user: {
        id: "user-1",
        email: "a@b.c",
        name: "Test",
        role: "user",
        language: "uk",
        phoneNumber: null,
        preferredVoice: null,
        preferredLlmProvider: null,
        preferredLlmModel: null,
        preferredTtsProvider: null,
        preferredStyleId: null,
        createdAt: new Date().toISOString(),
      },
      tokens: {
        accessToken: "persisted-access",
        refreshToken: "persisted-refresh",
        refreshExpiresAt: new Date(Date.now() + 60_000).toISOString(),
      },
    });

    useAuthStore.setState({
      status: "unknown",
      user: null,
      accessToken: null,
      refreshToken: null,
      refreshExpiresAt: null,
    });
    await useAuthStore.getState().hydrate();
    expect(useAuthStore.getState().status).toBe("authed");
    expect(useAuthStore.getState().accessToken).toBe("persisted-access");
  });
});
