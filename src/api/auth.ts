import { apiClient } from "./client";
import { useAuthStore } from "@/auth/store";
import type { AuthResponse, Language, User } from "@/types/api";

export async function register(input: {
  email: string;
  password: string;
  name: string;
}): Promise<AuthResponse> {
  // Backend `RegisterSchema` (auth.schemas.ts) only accepts these three
  // fields — `language` is set server-side and changed via PATCH /auth/me.
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
  // `POST /auth/logout` requires `{ refreshToken }` (LogoutDto). Best-effort —
  // callers always proceed to local clear even if this fails.
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
      | "phoneNumber"
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

export async function changePassword(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  await apiClient.post("/auth/change-password", input);
}

export async function deleteAccount(password: string): Promise<void> {
  // `DELETE /auth/me` requires `{ password }` (DeleteAccountDto).
  await apiClient.delete("/auth/me", { data: { password } });
}

/**
 * Persist a non-default UI language to the user's profile after register.
 * The register endpoint silently drops `language`, so the choice would be
 * lost otherwise. Best-effort: failure is non-fatal.
 */
export async function persistLanguage(language: Language): Promise<void> {
  try {
    await patchMe({ language });
  } catch {
    // Non-fatal: language stays at backend default; user can change it later.
  }
}
