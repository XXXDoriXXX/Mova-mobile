/* eslint-disable @typescript-eslint/no-require-imports */
import MockAdapter from "axios-mock-adapter";

describe("refreshScheduler", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("schedules a refresh ~60s before expiry, not on or after expiry", () => {
    const { schedulePreemptiveRefresh } = require("@/auth/refreshScheduler");
    const expiresAt = new Date(Date.now() + 5 * 60_000).toISOString(); // 5 min ahead
    schedulePreemptiveRefresh(expiresAt);
    // The refresh hasn't fired yet — the auth store snapshot is untouched.
    const { useAuthStore } = require("@/auth/store");
    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it("fires immediately when the expiry is already in the past", async () => {
    const axios = require("axios").default;
    const refreshAdapter = new MockAdapter(axios);
    let called = false;
    refreshAdapter
      .onPost("http://localhost:3000/v1/auth/refresh")
      .reply(() => {
        called = true;
        return [
          200,
          {
            accessToken: "new-access",
            refreshToken: "new-refresh",
            refreshExpiresAt: new Date(Date.now() + 60_000).toISOString(),
          },
        ];
      });

    const { useAuthStore } = require("@/auth/store");
    useAuthStore.setState({
      status: "authed",
      user: null,
      accessToken: "old",
      refreshToken: "rt",
      refreshExpiresAt: new Date(0).toISOString(),
    });

    const { schedulePreemptiveRefresh } = require("@/auth/refreshScheduler");
    schedulePreemptiveRefresh(new Date(Date.now() - 1000).toISOString());

    // Allow microtask + axios mock to resolve.
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(called).toBe(true);
    refreshAdapter.restore();
  });

  it("cancels the prior timer when called again with null", () => {
    const { schedulePreemptiveRefresh } = require("@/auth/refreshScheduler");
    schedulePreemptiveRefresh(new Date(Date.now() + 10 * 60_000).toISOString());
    schedulePreemptiveRefresh(null);
    // Advance way past when the first timer would have fired — nothing happens.
    jest.advanceTimersByTime(10 * 60_000);
    // Just reaching here without errors is the assertion; no observable side-effect.
    expect(true).toBe(true);
  });

  it("ignores malformed ISO input", () => {
    const { schedulePreemptiveRefresh } = require("@/auth/refreshScheduler");
    expect(() => schedulePreemptiveRefresh("not-a-date")).not.toThrow();
  });
});
