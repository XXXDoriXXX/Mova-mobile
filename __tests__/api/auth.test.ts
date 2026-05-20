/* eslint-disable @typescript-eslint/no-require-imports */
import MockAdapter from "axios-mock-adapter";

describe("auth API", () => {
  let mock: MockAdapter;

  beforeEach(() => {
    jest.resetModules();
    const { useAuthStore } = require("@/auth/store");
    useAuthStore.setState({
      status: "authed",
      user: null,
      accessToken: "access-1",
      refreshToken: "refresh-1",
      refreshExpiresAt: new Date(Date.now() + 60_000).toISOString(),
    });
    const { apiClient } = require("@/api/client");
    mock = new MockAdapter(apiClient);
  });

  afterEach(() => mock?.restore());

  it("logout sends {refreshToken} body and bypasses Bearer auth", async () => {
    let captured: { headers: any; body: any } | null = null;
    mock.onPost("/auth/logout").reply((config) => {
      captured = {
        headers: config.headers,
        body: JSON.parse(config.data ?? "{}"),
      };
      return [204, ""];
    });
    const { logout } = require("@/api/auth");
    await logout();
    expect(captured).not.toBeNull();
    expect(captured!.body).toEqual({ refreshToken: "refresh-1" });
    // skipAuth was set — the Bearer header must not be present.
    expect(captured!.headers?.Authorization).toBeUndefined();
  });

  it("logout is a no-op when no refresh token is in the store", async () => {
    const { useAuthStore } = require("@/auth/store");
    useAuthStore.setState({ refreshToken: null });
    let called = false;
    mock.onPost("/auth/logout").reply(() => {
      called = true;
      return [204, ""];
    });
    const { logout } = require("@/api/auth");
    await logout();
    expect(called).toBe(false);
  });

  it("deleteAccount sends {password} body via DELETE", async () => {
    let captured: { body: any; method: string } | null = null;
    mock.onDelete("/auth/me").reply((config) => {
      captured = {
        method: config.method ?? "",
        body: JSON.parse(config.data ?? "{}"),
      };
      return [204, ""];
    });
    const { deleteAccount } = require("@/api/auth");
    await deleteAccount("secret123");
    expect(captured).not.toBeNull();
    expect(captured!.method).toBe("delete");
    expect(captured!.body).toEqual({ password: "secret123" });
  });

  it("register does NOT send `language` (backend rejects extra fields)", async () => {
    let captured: any = null;
    mock.onPost("/auth/register").reply((config) => {
      captured = JSON.parse(config.data ?? "{}");
      return [
        201,
        {
          user: {
            id: "u",
            email: "a@b.c",
            name: "T",
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
            accessToken: "at",
            refreshToken: "rt",
            refreshExpiresAt: new Date().toISOString(),
          },
        },
      ];
    });
    const { register } = require("@/api/auth");
    await register({ email: "a@b.c", password: "Pass1234", name: "T" });
    expect(captured).toEqual({
      email: "a@b.c",
      password: "Pass1234",
      name: "T",
    });
    expect(captured.language).toBeUndefined();
  });

  it("login returns nested {user, tokens} shape verbatim", async () => {
    mock.onPost("/auth/login").reply(200, {
      user: {
        id: "u",
        email: "a@b.c",
        name: "T",
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
        accessToken: "access-X",
        refreshToken: "refresh-X",
        refreshExpiresAt: new Date(Date.now() + 60_000).toISOString(),
      },
    });
    const { login } = require("@/api/auth");
    const resp = await login({ email: "a@b.c", password: "x" });
    expect(resp.tokens.accessToken).toBe("access-X");
    expect(resp.user.email).toBe("a@b.c");
  });
});
