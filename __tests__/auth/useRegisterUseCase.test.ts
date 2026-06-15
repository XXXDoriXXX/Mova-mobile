import { act, renderHook } from "@testing-library/react-native";

import { register as registerApi } from "@/api/auth";
import { useAuthStore } from "@/auth/store";
import { useRegisterUseCase } from "@/features/auth/application/useRegisterUseCase";

jest.mock("@/api/auth", () => ({
  login: jest.fn(),
  register: jest.fn(),
  resendVerification: jest.fn(),
  signInWithGoogle: jest.fn(),
}));
jest.mock("@/utils/haptics", () => ({ triggerHaptic: jest.fn() }));

const mockRegister = registerApi as jest.MockedFunction<typeof registerApi>;

const VALUES = {
  email: "u@example.com",
  password: "Strong-Pass-1",
  name: "Test",
  username: "tester",
  language: "uk" as const,
};

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
    useAuthStore.setState({
      status: "guest",
      user: null,
      accessToken: null,
      refreshToken: null,
      refreshExpiresAt: null,
    });
  });

  it("on success: issues NO session, returns the email for the verify gate", async () => {
    mockRegister.mockResolvedValue({
      verificationRequired: true,
      email: "u@example.com",
    });

    const { result } = renderHook(() => useRegisterUseCase());
    let outcome: Awaited<ReturnType<typeof result.current.execute>> | null = null;
    await act(async () => {
      outcome = await result.current.execute(VALUES);
    });

    expect(outcome!.ok).toBe(true);
    if (outcome!.ok) expect(outcome!.email).toBe("u@example.com");
    // Hard gate: the store must stay a guest until the user verifies + logs in.
    expect(useAuthStore.getState().status).toBe("guest");
  });

  it("forwards the username to the API", async () => {
    mockRegister.mockResolvedValue({
      verificationRequired: true,
      email: "u@example.com",
    });

    const { result } = renderHook(() => useRegisterUseCase());
    await act(async () => {
      await result.current.execute(VALUES);
    });

    expect(mockRegister).toHaveBeenCalledWith(
      expect.objectContaining({ username: "tester" }),
    );
  });

  it("on 409: returns inline emailError, no banner, session untouched", async () => {
    mockRegister.mockRejectedValue(
      axiosError({ statusCode: 409, message: "taken" }, 409),
    );

    const { result } = renderHook(() => useRegisterUseCase());
    let outcome: Awaited<ReturnType<typeof result.current.execute>> | null = null;
    await act(async () => {
      outcome = await result.current.execute(VALUES);
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
      outcome = await result.current.execute({ ...VALUES, password: "weak" });
    });

    expect(outcome!.ok).toBe(false);
    if (!outcome!.ok) expect(outcome!.error.passwordError).toBeTruthy();
  });
});
