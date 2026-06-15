import { apiClient } from "./client";
import { useAuthStore } from "@/auth/store";
import type { AuthResponse, Language, User } from "@/types/api";

// Registration is gated on email verification: the server creates the
// account, mails a confirmation link and issues NO session. The user must
// confirm via the emailed link before they can log in.
export type RegisterResult = { verificationRequired: true; email: string };

export async function register(input: {
  email: string;
  password: string;
  name: string;
  username: string;
}): Promise<RegisterResult> {
  const { data } = await apiClient.post<RegisterResult>(
    "/auth/register",
    input,
    { meta: { skipAuth: true } },
  );
  return data;
}

// Re-send the verification link for an unconfirmed account (used from the
// post-register gate and the EMAIL_NOT_VERIFIED login path). Public route.
export async function resendVerification(email: string): Promise<void> {
  await apiClient.post(
    "/auth/email/resend",
    { email },
    { meta: { skipAuth: true } },
  );
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

// Ask the server to email a verification link to the current (authenticated)
// account.
export async function sendEmailVerification(): Promise<void> {
  await apiClient.post("/auth/email/send-verification");
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
