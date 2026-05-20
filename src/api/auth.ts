import { apiClient } from "./client";
import type { AuthResponse, Language, User } from "@/types/api";

export async function register(input: {
  email: string;
  password: string;
  name: string;
  language: Language;
}): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>("/auth/register", input, {
    meta: { skipAuth: true },
  });
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

export async function logout(): Promise<void> {
  await apiClient.post("/auth/logout");
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

export async function deleteAccount(): Promise<void> {
  await apiClient.delete("/auth/me");
}
