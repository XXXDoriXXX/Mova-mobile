import { act, renderHook } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import React from "react";

import { deleteAccount as deleteAccountApi } from "@/api/auth";
import { useAuthStore } from "@/auth/store";
import { useDeleteAccount } from "@/features/settings/application/useDeleteAccount";

jest.mock("@/api/auth", () => ({
  deleteAccount: jest.fn(),
  login: jest.fn(),
  register: jest.fn(),
  signInWithGoogle: jest.fn(),
  changePassword: jest.fn(),
  patchMe: jest.fn(),
  persistLanguage: jest.fn(),
}));
jest.mock("@/feedback/toast", () => ({
  toast: { success: jest.fn(), error: jest.fn(), warning: jest.fn() },
}));

const mockDelete = deleteAccountApi as jest.MockedFunction<typeof deleteAccountApi>;

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

describe("useDeleteAccount", () => {
  let client: QueryClient;

  beforeEach(() => {
    mockDelete.mockReset();
    client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    useAuthStore.setState({
      status: "authed",
      user: { id: "u-1", email: "u@x", name: "X" } as never,
      accessToken: "at",
      refreshToken: "rt",
      refreshExpiresAt: new Date().toISOString(),
    });
  });

  it("on success: clears auth store and reports ok=true", async () => {
    mockDelete.mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteAccount(), {
      wrapper: withQueryClient(client),
    });

    let outcome: Awaited<ReturnType<typeof result.current.execute>> | null = null;
    await act(async () => {
      outcome = await result.current.execute("secret");
    });

    expect(outcome).toEqual({ ok: true });
    expect(useAuthStore.getState().status).toBe("guest");
    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it("on 401: returns wrongPassword without clearing the session", async () => {
    mockDelete.mockRejectedValue(axiosError({ statusCode: 401 }, 401));

    const { result } = renderHook(() => useDeleteAccount(), {
      wrapper: withQueryClient(client),
    });

    let outcome: Awaited<ReturnType<typeof result.current.execute>> | null = null;
    await act(async () => {
      outcome = await result.current.execute("bad");
    });

    expect(outcome).toEqual({ ok: false, kind: "wrongPassword" });
    expect(useAuthStore.getState().status).toBe("authed");
  });

  it("on 500: returns generic", async () => {
    mockDelete.mockRejectedValue(axiosError({ statusCode: 500 }, 500));

    const { result } = renderHook(() => useDeleteAccount(), {
      wrapper: withQueryClient(client),
    });

    let outcome: Awaited<ReturnType<typeof result.current.execute>> | null = null;
    await act(async () => {
      outcome = await result.current.execute("any");
    });

    expect(outcome).toEqual({ ok: false, kind: "generic" });
  });
});
