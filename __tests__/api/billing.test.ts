/* eslint-disable @typescript-eslint/no-require-imports */
import MockAdapter from "axios-mock-adapter";

describe("billing API", () => {
  let mock: MockAdapter;

  beforeEach(() => {
    jest.resetModules();
    const { useAuthStore } = require("@/auth/store");
    useAuthStore.setState({
      status: "authed",
      user: null,
      accessToken: "at",
      refreshToken: "rt",
      refreshExpiresAt: new Date(Date.now() + 60_000).toISOString(),
    });
    const { apiClient } = require("@/api/client");
    mock = new MockAdapter(apiClient);
  });

  afterEach(() => mock?.restore());

  it("topup sends Idempotency-Key header", async () => {
    let captured: { headers: unknown; body: unknown } | null = null;
    mock.onPost("/billing/topup").reply((config) => {
      captured = {
        headers: config.headers,
        body: JSON.parse(config.data ?? "{}"),
      };
      return [200, { paymentEventId: "p", balanceCents: 1000, paymentUrl: null, reused: false }];
    });
    const { topup } = require("@/api/billing");
    await topup({ amountCents: 1000, idempotencyKey: "test-key-123" });
    expect(captured).not.toBeNull();
    expect((captured!.headers as Record<string, string>)["Idempotency-Key"]).toBe(
      "test-key-123",
    );
    expect(captured!.body).toEqual({ amountCents: 1000 });
  });

  it("topup generates a fresh key when none is provided", async () => {
    let captured: { headers: Record<string, string> } | null = null;
    mock.onPost("/billing/topup").reply((config) => {
      captured = { headers: config.headers as Record<string, string> };
      return [200, { paymentEventId: "p", balanceCents: 0, paymentUrl: null, reused: false }];
    });
    const { topup } = require("@/api/billing");
    await topup({ amountCents: 500 });
    expect(captured).not.toBeNull();
    expect(captured!.headers["Idempotency-Key"]).toMatch(
      /^[0-9a-f-]{36}$/i,
    );
  });

  it("topup returns reused=true verbatim when server says so", async () => {
    mock.onPost("/billing/topup").reply(200, {
      paymentEventId: "p",
      balanceCents: 5000,
      paymentUrl: null,
      reused: true,
    });
    const { topup } = require("@/api/billing");
    const resp = await topup({ amountCents: 1000, idempotencyKey: "x" });
    expect(resp.reused).toBe(true);
    expect(resp.balanceCents).toBe(5000);
  });

  it("subscribe sends planCode body and returns updated summary", async () => {
    mock.onPost("/billing/subscribe").reply((config) => {
      const body = JSON.parse(config.data ?? "{}");
      expect(body).toEqual({ planCode: "paid" });
      return [
        200,
        {
          plan: {
            id: "p1",
            code: "paid",
            name: "Paid",
            pricePerSecondCents: 1,
            currency: "UAH",
            freeSecondsPerMonth: 0,
            maxCallDurationSeconds: 3600,
            maxConcurrentCalls: 1,
            isActive: true,
            createdAt: new Date().toISOString(),
          },
          status: "active",
          currentPeriodStart: new Date().toISOString(),
          currentPeriodEnd: new Date().toISOString(),
          freeSecondsUsed: 0,
          freeSecondsRemaining: 0,
          balanceCents: 0,
        },
      ];
    });
    const { subscribe } = require("@/api/billing");
    const resp = await subscribe({ planCode: "paid" });
    expect(resp.plan.code).toBe("paid");
    expect(resp.status).toBe("active");
  });
});
