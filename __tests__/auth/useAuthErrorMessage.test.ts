/* eslint-disable @typescript-eslint/no-require-imports */
import { renderHook } from "@testing-library/react-native";

import { useAuthErrorMapper } from "@/features/auth/useAuthErrorMessage";

// Force-fix the i18n language to UA so the mapped strings are stable.
const originalLanguage = "uk";

function makeAxiosError(payload: unknown, status?: number) {
  const err: any = new Error("Request failed");
  err.isAxiosError = true;
  err.response = { status: status ?? 400, data: payload };
  return err;
}

describe("useAuthErrorMapper", () => {
  it("409 maps to emailTaken inline error", () => {
    const { result } = renderHook(() => useAuthErrorMapper());
    const mapped = result.current(
      makeAxiosError({ statusCode: 409, message: "Email taken" }, 409),
    );
    expect(mapped.emailError).toBeTruthy();
    expect(mapped.banner).toBeUndefined();
  });

  it("401 maps to invalidCredentials banner", () => {
    const { result } = renderHook(() => useAuthErrorMapper());
    const mapped = result.current(
      makeAxiosError({ statusCode: 401, message: "Bad creds" }, 401),
    );
    expect(mapped.banner).toBeTruthy();
    expect(mapped.emailError).toBeUndefined();
  });

  it("403 with a reason produces a blocked banner containing the reason", () => {
    const { result } = renderHook(() => useAuthErrorMapper());
    const mapped = result.current(
      makeAxiosError({ statusCode: 403, message: "spam abuse" }, 403),
    );
    expect(mapped.banner).toContain("spam abuse");
  });

  it("400 WEAK_PASSWORD maps to passwordError", () => {
    const { result } = renderHook(() => useAuthErrorMapper());
    const mapped = result.current(
      makeAxiosError(
        { statusCode: 400, error: "WEAK_PASSWORD", message: "weak" },
        400,
      ),
    );
    expect(mapped.passwordError).toBeTruthy();
  });

  it("unknown error returns a generic banner (offline-shaped)", () => {
    const { result } = renderHook(() => useAuthErrorMapper());
    const mapped = result.current(new Error("Network down"));
    expect(mapped.banner).toBeTruthy();
  });
});
