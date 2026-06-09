import { act, renderHook } from "@testing-library/react-native";

import { persistLanguage, register as registerApi } from "@/api/auth";
import { useAuthStore } from "@/auth/store";
import { useRegisterUseCase } from "@/features/auth/application/useRegisterUseCase";

jest.mock("@/api/auth", () => ({
  login: jest.fn(),
  persistLanguage: jest.fn(),
  register: jest.fn(),
  signInWithGoogle: jest.fn(),
}));
jest.mock("@/utils/haptics", () => ({ triggerHaptic: jest.fn() }));

const mockRegister = registerApi as jest.MockedFunction<typeof registerApi>;
const mockPersistLanguage = persistLanguage as jest.MockedFunction<typeof persistLanguage>;

function makeSession(overrides: Partial<{ email: string; language: "uk" | "en" }> = {}) {
  return {
    user: {
      id: "u-1",
      email: overrides.email ?? "u@example.com",
      name: "Test",
      language: overrides.language ?? ("uk" as const),
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

function axiosError(payload: unknown, status: number) {
  return {
    isAxiosError: true,
    response: { status, data: payload },
    message: "Request failed",
  };
}

describe("useRegisterUseCase", () => {
  beforeEach(() => {
    mockRegister.mockReset();
    mockPersistLanguage.mockReset();
    useAuthStore.setState({
      status: "guest",
      user: null,
      accessToken: null,
      refreshToken: null,
      refreshExpiresAt: null,
    });
  });

  it("on success: writes session and reports ok=true", async () => {
    mockRegister.mockResolvedValue(makeSession());

    const { result } = renderHook(() => useRegisterUseCase());
    let outcome: Awaited<ReturnType<typeof result.current.execute>> | null = null;
    await act(async () => {
      outcome = await result.current.execute({
        email: "u@example.com",
        password: "Strong-Pass-1",
        name: "Test",
        language: "uk",
      });
    });

    expect(outcome!.ok).toBe(true);
    expect(useAuthStore.getState().status).toBe("authed");
    expect(mockPersistLanguage).not.toHaveBeenCalled();
  });

  it("persists language when user picked a non-default and server returned the default", async () => {
    mockRegister.mockResolvedValue(makeSession({ language: "uk" }));

    const { result } = renderHook(() => useRegisterUseCase());
    await act(async () => {
      await result.current.execute({
        email: "u@example.com",
        password: "Strong-Pass-1",
        name: "Test",
        language: "en",
      });
    });

    expect(mockPersistLanguage).toHaveBeenCalledWith("en");
  });

  it("does NOT persist language when it matches what the server returned", async () => {
    mockRegister.mockResolvedValue(makeSession({ language: "en" }));

    const { result } = renderHook(() => useRegisterUseCase());
    await act(async () => {
      await result.current.execute({
        email: "u@example.com",
        password: "Strong-Pass-1",
        name: "Test",
        language: "en",
      });
    });

    expect(mockPersistLanguage).not.toHaveBeenCalled();
  });

  it("on 409: returns inline emailError, no banner, session untouched", async () => {
    mockRegister.mockRejectedValue(
      axiosError({ statusCode: 409, message: "taken" }, 409),
    );

    const { result } = renderHook(() => useRegisterUseCase());
    let outcome: Awaited<ReturnType<typeof result.current.execute>> | null = null;
    await act(async () => {
      outcome = await result.current.execute({
        email: "u@example.com",
        password: "Strong-Pass-1",
        name: "Test",
        language: "uk",
      });
    });

    expect(outcome!.ok).toBe(false);
    if (!outcome!.ok) {
      expect(outcome!.error.emailError).toBeTruthy();
      expect(outcome!.error.banner).toBeUndefined();
    }
    expect(useAuthStore.getState().status).toBe("guest");
  });

  it("on 400 WEAK_PASSWORD: returns inline passwordError", async () => {
    mockRegister.mockRejectedValue(
      axiosError({ statusCode: 400, error: "WEAK_PASSWORD", message: "weak" }, 400),
    );

    const { result } = renderHook(() => useRegisterUseCase());
    let outcome: Awaited<ReturnType<typeof result.current.execute>> | null = null;
    await act(async () => {
      outcome = await result.current.execute({
        email: "u@example.com",
        password: "weak",
        name: "Test",
        language: "uk",
      });
    });

    expect(outcome!.ok).toBe(false);
    if (!outcome!.ok) expect(outcome!.error.passwordError).toBeTruthy();
  });
});
