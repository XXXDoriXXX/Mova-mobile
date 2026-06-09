import { act, renderHook } from "@testing-library/react-native";

import { topup as topupApi } from "@/api/billing";
import { useTopup } from "@/features/billing/application/useTopup";

jest.mock("@/api/billing", () => ({
  topup: jest.fn(),
  getBillingSummary: jest.fn(),
  listPlans: jest.fn(),
  listUsage: jest.fn(),
  subscribe: jest.fn(),
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
const idempotencyMock = require("@/utils/idempotency-key") as {
  __resetCounter: () => void;
};

function axiosError(payload: unknown, status: number) {
  return {
    isAxiosError: true,
    response: { status, data: payload },
    message: "err",
  };
}

describe("useTopup", () => {
  beforeEach(() => {
    mockTopup.mockReset();
    idempotencyMock.__resetCounter();
  });

  it("on success: returns balanceCents + reused, fresh idempotency-key per attempt", async () => {
    mockTopup.mockResolvedValue({ balanceCents: 5000, reused: false });
    const { result } = renderHook(() => useTopup());

    let outcome: Awaited<ReturnType<typeof result.current.execute>> | null = null;
    await act(async () => {
      outcome = await result.current.execute(10_000);
    });

    expect(outcome).toEqual({ ok: true, balanceCents: 5000, reused: false });
    expect(mockTopup).toHaveBeenCalledWith({
      amountCents: 10_000,
      idempotencyKey: "key-1",
    });

    mockTopup.mockResolvedValue({ balanceCents: 7000, reused: false });
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
    const { result } = renderHook(() => useTopup());

    await act(async () => {
      await result.current.execute(5_000);
    });
    expect(mockTopup).toHaveBeenLastCalledWith({
      amountCents: 5_000,
      idempotencyKey: "key-1",
    });

    mockTopup.mockResolvedValue({ balanceCents: 5_000, reused: false });
    await act(async () => {
      await result.current.execute(5_000);
    });
    expect(mockTopup).toHaveBeenLastCalledWith({
      amountCents: 5_000,
      idempotencyKey: "key-1",
    });

    mockTopup.mockResolvedValue({ balanceCents: 6_000, reused: false });
    await act(async () => {
      await result.current.execute(6_000);
    });
    expect(mockTopup).toHaveBeenLastCalledWith({
      amountCents: 6_000,
      idempotencyKey: "key-2",
    });
  });

  it("on 429: returns rate-limited error mapping", async () => {
    mockTopup.mockRejectedValue(axiosError({ statusCode: 429 }, 429));
    const { result } = renderHook(() => useTopup());

    let outcome: Awaited<ReturnType<typeof result.current.execute>> | null = null;
    await act(async () => {
      outcome = await result.current.execute(5_000);
    });

    expect(outcome).toEqual({
      ok: false,
      error: { kind: "rate-limited" },
    });
  });

  it("submitting flips around the call", async () => {
    let resolve!: (v: { balanceCents: number; reused: boolean }) => void;
    mockTopup.mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );

    const { result } = renderHook(() => useTopup());
    expect(result.current.submitting).toBe(false);

    let promise!: Promise<unknown>;
    act(() => {
      promise = result.current.execute(5_000);
    });
    expect(result.current.submitting).toBe(true);

    await act(async () => {
      resolve({ balanceCents: 5_000, reused: false });
      await promise;
    });
    expect(result.current.submitting).toBe(false);
  });
});
