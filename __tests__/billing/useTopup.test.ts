import { createElement, type ReactNode } from "react";
import { act, renderHook } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as WebBrowser from "expo-web-browser";

import { topup as topupApi } from "@/api/billing";
import { useTopup } from "@/features/billing/application/useTopup";

jest.mock("@/api/billing", () => ({
  topup: jest.fn(),
  getBillingSummary: jest.fn(),
  listPlans: jest.fn(),
  listUsage: jest.fn(),
  subscribe: jest.fn(),
}));

jest.mock("expo-web-browser", () => ({
  openBrowserAsync: jest.fn().mockResolvedValue({ type: "dismiss" }),
}));

// Settlement-polling is exercised separately; here it resolves instantly so the
// hook's checkout flow can be asserted without real timers.
jest.mock("@/features/billing/application/refreshBilling", () => ({
  BILLING_ME_KEY: ["billing", "me"],
  refreshBillingUntil: jest.fn().mockResolvedValue(true),
}));

jest.mock("@/utils/idempotency-key", () => {
  let counter = 0;
  return {
    newIdempotencyKey: () => `key-${++counter}`,
    __resetCounter: () => {
      counter = 0;
    },
  };
});

const mockTopup = topupApi as jest.MockedFunction<typeof topupApi>;
const mockOpen = WebBrowser.openBrowserAsync as jest.MockedFunction<
  typeof WebBrowser.openBrowserAsync
>;
const idempotencyMock = require("@/utils/idempotency-key") as {
  __resetCounter: () => void;
};

function ok(over: Partial<Awaited<ReturnType<typeof topupApi>>> = {}) {
  return {
    paymentEventId: "pe-1",
    balanceCents: 5000,
    paymentUrl: "https://pay.example/checkout",
    reused: false,
    ...over,
  };
}

function axiosError(payload: unknown, status: number) {
  return {
    isAxiosError: true,
    response: { status, data: payload },
    message: "err",
  };
}

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient();
  return createElement(QueryClientProvider, { client }, children);
}

describe("useTopup", () => {
  beforeEach(() => {
    mockTopup.mockReset();
    mockOpen.mockClear();
    idempotencyMock.__resetCounter();
  });

  it("on success: opens the checkout, returns reused, fresh key per attempt", async () => {
    mockTopup.mockResolvedValue(ok());
    const { result } = renderHook(() => useTopup(), { wrapper });

    let outcome: Awaited<ReturnType<typeof result.current.execute>> | null = null;
    await act(async () => {
      outcome = await result.current.execute(10_000);
    });

    expect(outcome).toEqual({ ok: true, reused: false });
    expect(mockOpen).toHaveBeenCalledWith("https://pay.example/checkout");
    expect(mockTopup).toHaveBeenCalledWith({
      amountCents: 10_000,
      idempotencyKey: "key-1",
    });

    mockTopup.mockResolvedValue(ok({ balanceCents: 7000 }));
    await act(async () => {
      await result.current.execute(20_000);
    });
    expect(mockTopup).toHaveBeenLastCalledWith({
      amountCents: 20_000,
      idempotencyKey: "key-2",
    });
  });

  it("on failure: reuses the same idempotency-key on retry until success", async () => {
    mockTopup.mockRejectedValue(axiosError({ statusCode: 500 }, 500));
    const { result } = renderHook(() => useTopup(), { wrapper });

    await act(async () => {
      await result.current.execute(5_000);
    });
    expect(mockTopup).toHaveBeenLastCalledWith({
      amountCents: 5_000,
      idempotencyKey: "key-1",
    });

    mockTopup.mockResolvedValue(ok());
    await act(async () => {
      await result.current.execute(5_000);
    });
    expect(mockTopup).toHaveBeenLastCalledWith({
      amountCents: 5_000,
      idempotencyKey: "key-1",
    });

    mockTopup.mockResolvedValue(ok({ balanceCents: 6_000 }));
    await act(async () => {
      await result.current.execute(6_000);
    });
    expect(mockTopup).toHaveBeenLastCalledWith({
      amountCents: 6_000,
      idempotencyKey: "key-2",
    });
  });

  it("on 429: returns rate-limited error mapping and opens no checkout", async () => {
    mockTopup.mockRejectedValue(axiosError({ statusCode: 429 }, 429));
    const { result } = renderHook(() => useTopup(), { wrapper });

    let outcome: Awaited<ReturnType<typeof result.current.execute>> | null = null;
    await act(async () => {
      outcome = await result.current.execute(5_000);
    });

    expect(outcome).toEqual({ ok: false, error: { kind: "rate-limited" } });
    expect(mockOpen).not.toHaveBeenCalled();
  });

  it("submitting flips around the call", async () => {
    let resolve!: (v: Awaited<ReturnType<typeof topupApi>>) => void;
    mockTopup.mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );

    const { result } = renderHook(() => useTopup(), { wrapper });
    expect(result.current.submitting).toBe(false);

    let promise!: Promise<unknown>;
    act(() => {
      promise = result.current.execute(5_000);
    });
    expect(result.current.submitting).toBe(true);

    await act(async () => {
      resolve(ok());
      await promise;
    });
    expect(result.current.submitting).toBe(false);
  });
});
