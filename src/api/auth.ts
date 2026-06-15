import { apiClient } from "./client";
import { useAuthStore } from "@/auth/store";
import type { AuthResponse, Language, User } from "@/types/api";

export async function register(input: {
  email: string;
  password: string;
  name: string;
}): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>(
    "/auth/register",
    input,
    { meta: { skipAuth: true } },
  );
  return data;
}

export async function login(input: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>("/auth/login", input, {
    meta: { skipAuth: true },
  });
  return data;
}

export async function signInWithGoogle(idToken: string): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>(
    "/auth/google",
    { idToken },
    { meta: { skipAuth: true } },
  );
  return data;
}

export async function logout(): Promise<void> {
  const { refreshToken } = useAuthStore.getState();
  if (!refreshToken) return;
  await apiClient.post(
    "/auth/logout",
    { refreshToken },
    { meta: { skipAuth: true } },
  );
}

export async function getMe(): Promise<User> {
  const { data } = await apiClient.get<User>("/auth/me");
  return data;
}

export async function patchMe(
  patch: Partial<
    Pick<
      User,
      // phoneNumber is NOT patchable — it is owned by the verification flow
      // (confirmPhone). The server rejects it in a profile patch.
      | "name"
      | "language"
      | "preferredVoice"
      | "preferredLlmProvider"
      | "preferredLlmModel"
      | "preferredTtsProvider"
      | "isDeafMute"
    >
  >,
): Promise<User> {
  const { data } = await apiClient.patch<User>("/auth/me", patch);
  return data;
}

// Hand the Firebase phone-auth ID token (obtained after the SMS OTP) to the
// server, which verifies it and claims the proven number for this account.
export async function confirmPhone(
  firebaseIdToken: string,
): Promise<{ phoneNumber: string }> {
  const { data } = await apiClient.post<{ phoneNumber: string }>(
    "/auth/phone/confirm",
    { firebaseIdToken },
  );
  return data;
}

export async function changePassword(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  await apiClient.post("/auth/change-password", input);
}

export async function deleteAccount(password: string): Promise<void> {
  await apiClient.delete("/auth/me", { data: { password } });
}

export async function persistLanguage(language: Language): Promise<void> {
  try {
    await patchMe({ language });
  } catch {
  }
}
