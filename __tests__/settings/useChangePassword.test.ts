import { act, renderHook } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import React from "react";

import { changePassword as changePasswordApi } from "@/api/auth";
import { useChangePassword } from "@/features/settings/application/useChangePassword";

jest.mock("@/api/auth", () => ({
  changePassword: jest.fn(),
  deleteAccount: jest.fn(),
  login: jest.fn(),
  register: jest.fn(),
  signInWithGoogle: jest.fn(),
  patchMe: jest.fn(),
  persistLanguage: jest.fn(),
}));
jest.mock("@/feedback/toast", () => ({
  toast: { success: jest.fn(), error: jest.fn(), warning: jest.fn() },
}));

const mockChange = changePasswordApi as jest.MockedFunction<typeof changePasswordApi>;

function withQueryClient(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return React.createElement(QueryClientProvider, { client }, children);
  };
}

function axiosError(payload: unknown, status: number) {
  return {
    isAxiosError: true,
    response: { status, data: payload },
    message: "err",
  };
}

describe("useChangePassword", () => {
  let client: QueryClient;

  beforeEach(() => {
    mockChange.mockReset();
    client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
  });

  it("on success: flips done=true, returns ok", async () => {
    mockChange.mockResolvedValue(undefined);

    const { result } = renderHook(() => useChangePassword(), {
      wrapper: withQueryClient(client),
    });

    let outcome: Awaited<ReturnType<typeof result.current.execute>> | null = null;
    await act(async () => {
      outcome = await result.current.execute("oldPass1234", "newPass1234");
    });

    expect(outcome).toEqual({ ok: true });
    expect(result.current.done).toBe(true);
    expect(mockChange).toHaveBeenCalledWith({
      currentPassword: "oldPass1234",
      newPassword: "newPass1234",
    });
  });

  it("on 401: returns wrongCurrent", async () => {
    mockChange.mockRejectedValue(axiosError({ statusCode: 401 }, 401));

    const { result } = renderHook(() => useChangePassword(), {
      wrapper: withQueryClient(client),
    });

    let outcome: Awaited<ReturnType<typeof result.current.execute>> | null = null;
    await act(async () => {
      outcome = await result.current.execute("wrong", "newPass1234");
    });

    expect(outcome).toEqual({ ok: false, kind: "wrongCurrent" });
    expect(result.current.done).toBe(false);
  });

  it("on 400 WEAK_PASSWORD: returns weakNew", async () => {
    mockChange.mockRejectedValue(
      axiosError({ statusCode: 400, error: "WEAK_PASSWORD" }, 400),
    );

    const { result } = renderHook(() => useChangePassword(), {
      wrapper: withQueryClient(client),
    });

    let outcome: Awaited<ReturnType<typeof result.current.execute>> | null = null;
    await act(async () => {
      outcome = await result.current.execute("oldPass1234", "weak");
    });

    expect(outcome).toEqual({ ok: false, kind: "weakNew" });
  });

  it("reset() flips done back to false", async () => {
    mockChange.mockResolvedValue(undefined);

    const { result } = renderHook(() => useChangePassword(), {
      wrapper: withQueryClient(client),
    });
    await act(async () => {
      await result.current.execute("a-pass-1234", "b-pass-1234");
    });
    expect(result.current.done).toBe(true);

    act(() => {
      result.current.reset();
    });
    expect(result.current.done).toBe(false);
  });
});
