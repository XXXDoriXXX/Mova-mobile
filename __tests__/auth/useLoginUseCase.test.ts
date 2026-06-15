import { act, renderHook } from "@testing-library/react-native";

import { login as loginApi } from "@/api/auth";
import { useAuthStore } from "@/auth/store";
import { useLoginUseCase } from "@/features/auth/application/useLoginUseCase";

jest.mock("@/api/auth", () => ({
  login: jest.fn(),
  persistLanguage: jest.fn(),
  register: jest.fn(),
  signInWithGoogle: jest.fn(),
}));
jest.mock("@/utils/haptics", () => ({ triggerHaptic: jest.fn() }));

const mockLogin = loginApi as jest.MockedFunction<typeof loginApi>;

function makeSession(email = "u@example.com") {
  return {
    user: {
      id: "u-1",
      email,
      name: "Test",
      language: "uk" as const,
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
      refreshExpiresAt: new Date(Date.now() + 60_000).toISOString(),
    },
  };
}

function makeAxiosError(payload: unknown, status: number) {
  const err: { isAxiosError: boolean; response: unknown; message: string } = {
    isAxiosError: true,
    response: { status, data: payload },
    message: "Request failed",
  };
  return err;
}

describe("useLoginUseCase", () => {
  beforeEach(() => {
    mockLogin.mockReset();
    useAuthStore.setState({
      status: "guest",
      user: null,
      accessToken: null,
      refreshToken: null,
      refreshExpiresAt: null,
    });
  });

  it("on success: writes session into the store and reports ok=true", async () => {
    mockLogin.mockResolvedValue(makeSession());

    const { result } = renderHook(() => useLoginUseCase());

    let outcome: Awaited<ReturnType<typeof result.current.execute>> | null = null;
    await act(async () => {
      outcome = await result.current.execute({
        email: "u@example.com",
        password: "secret123",
      });
    });

    expect(outcome).not.toBeNull();
    expect(outcome!.ok).toBe(true);
    expect(useAuthStore.getState().status).toBe("authed");
    expect(useAuthStore.getState().accessToken).toBe("at");
  });

  it("on 401: returns mapped banner without touching the session", async () => {
    mockLogin.mockRejectedValue(
      makeAxiosError({ statusCode: 401, message: "Bad" }, 401),
    );

    const { result } = renderHook(() => useLoginUseCase());

    let outcome: Awaited<ReturnType<typeof result.current.execute>> | null = null;
    await act(async () => {
      outcome = await result.current.execute({
        email: "u@example.com",
        password: "wrong",
      });
    });

    expect(outcome!.ok).toBe(false);
    if (!outcome!.ok) expect(outcome!.error.banner).toBeTruthy();
    expect(useAuthStore.getState().status).toBe("guest");
  });

  it("on 403 EMAIL_NOT_VERIFIED: routes to the verify gate, not a blocked banner", async () => {
    mockLogin.mockRejectedValue(
      makeAxiosError(
        { code: "EMAIL_NOT_VERIFIED", message: "Confirm your email" },
        403,
      ),
    );

    const { result } = renderHook(() => useLoginUseCase());

    let outcome: Awaited<ReturnType<typeof result.current.execute>> | null = null;
    await act(async () => {
      outcome = await result.current.execute({
        email: "u@example.com",
        password: "secret123",
      });
    });

    expect(outcome!.ok).toBe(false);
    if (!outcome!.ok && "needsVerification" in outcome!) {
      expect(outcome!.needsVerification).toBe(true);
      expect(outcome!.email).toBe("u@example.com");
    } else {
      throw new Error("expected needsVerification result");
    }
    expect(useAuthStore.getState().status).toBe("guest");
  });

  it("on 409: returns emailError (inline) and no banner", async () => {
    mockLogin.mockRejectedValue(
      makeAxiosError({ statusCode: 409, message: "Taken" }, 409),
    );

    const { result } = renderHook(() => useLoginUseCase());

    let outcome: Awaited<ReturnType<typeof result.current.execute>> | null = null;
    await act(async () => {
      outcome = await result.current.execute({
        email: "u@example.com",
        password: "secret123",
      });
    });

    expect(outcome!.ok).toBe(false);
    if (!outcome!.ok) {
      expect(outcome!.error.emailError).toBeTruthy();
      expect(outcome!.error.banner).toBeUndefined();
    }
  });

  it("submitting flips true then false around the call", async () => {
    let resolve!: (v: ReturnType<typeof makeSession>) => void;
    mockLogin.mockReturnValue(
      new Promise<ReturnType<typeof makeSession>>((r) => {
        resolve = r;
      }),
    );

    const { result } = renderHook(() => useLoginUseCase());
    expect(result.current.submitting).toBe(false);

    let promise!: Promise<unknown>;
    act(() => {
      promise = result.current.execute({
        email: "u@example.com",
        password: "secret123",
      });
    });
    expect(result.current.submitting).toBe(true);

    await act(async () => {
      resolve(makeSession());
      await promise;
    });

    expect(result.current.submitting).toBe(false);
  });
});
