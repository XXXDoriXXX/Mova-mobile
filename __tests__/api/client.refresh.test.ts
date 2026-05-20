/* eslint-disable @typescript-eslint/no-require-imports */
import MockAdapter from "axios-mock-adapter";

/**
 * The 401 → refresh → retry path is the most-likely regression source under
 * load. Two simultaneous 401s must produce exactly ONE call to /auth/refresh.
 */
describe("axios single-flight refresh", () => {
  let apiMock: MockAdapter;
  let rawAxiosMock: MockAdapter;
  let refreshCalls: number;

  beforeEach(() => {
    jest.resetModules();
    refreshCalls = 0;

    const { useAuthStore } = require("@/auth/store");
    useAuthStore.setState({
      status: "authed",
      user: null,
      accessToken: "stale-access",
      refreshToken: "valid-refresh",
      refreshExpiresAt: new Date(Date.now() + 60_000).toISOString(),
    });

    const { apiClient } = require("@/api/client");
    apiMock = new MockAdapter(apiClient);

    const axios = require("axios").default;
    rawAxiosMock = new MockAdapter(axios);
    rawAxiosMock
      .onPost("http://localhost:3000/v1/auth/refresh")
      .reply(() => {
        refreshCalls += 1;
        return [
          200,
          {
            accessToken: "fresh-access",
            refreshToken: "fresh-refresh",
            refreshExpiresAt: new Date(Date.now() + 60_000).toISOString(),
          },
        ];
      });

    apiMock.onGet("/protected").reply((config) => {
      const auth = config.headers?.Authorization ?? "";
      if (auth === "Bearer fresh-access") return [200, { ok: true }];
      return [401, { statusCode: 401, message: "expired" }];
    });
  });

  afterEach(() => {
    apiMock?.restore();
    rawAxiosMock?.restore();
  });

  it("two parallel 401s trigger exactly one refresh round-trip", async () => {
    const { apiClient } = require("@/api/client");
    const [a, b] = await Promise.all([
      apiClient.get("/protected"),
      apiClient.get("/protected"),
    ]);
    expect(a.status).toBe(200);
    expect(b.status).toBe(200);
    expect(refreshCalls).toBe(1);
  });

  it("after refresh, the auth store has the new tokens persisted", async () => {
    const { apiClient } = require("@/api/client");
    await apiClient.get("/protected");
    const { useAuthStore } = require("@/auth/store");
    expect(useAuthStore.getState().accessToken).toBe("fresh-access");
    expect(useAuthStore.getState().refreshToken).toBe("fresh-refresh");
  });

  it("a 401 on /auth/refresh itself does not retry", async () => {
    // Reset and arrange a refresh failure.
    rawAxiosMock.reset();
    rawAxiosMock
      .onPost("http://localhost:3000/v1/auth/refresh")
      .reply(() => {
        refreshCalls += 1;
        return [401, { statusCode: 401, message: "invalid refresh" }];
      });

    const { apiClient } = require("@/api/client");
    await expect(apiClient.get("/protected")).rejects.toMatchObject({
      response: { status: 401 },
    });
    expect(refreshCalls).toBe(1);

    const { useAuthStore } = require("@/auth/store");
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(useAuthStore.getState().refreshToken).toBeNull();
  });
});
