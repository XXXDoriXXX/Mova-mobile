import { apiClient } from "./client";
import type { ConversationStyle, StylesResponse } from "@/types/api";

export async function listStyles(): Promise<StylesResponse> {
  const { data } = await apiClient.get<StylesResponse>("/users/me/styles");
  return data;
}

export async function createStyle(input: {
  name: string;
  instructions: string;
}): Promise<Extract<ConversationStyle, { kind: "custom" }>> {
  const { data } = await apiClient.post<
    Extract<ConversationStyle, { kind: "custom" }>
  >("/users/me/styles", input);
  return data;
}

export async function updateStyle(
  id: string,
  patch: { name?: string; instructions?: string },
): Promise<Extract<ConversationStyle, { kind: "custom" }>> {
  const { data } = await apiClient.patch<
    Extract<ConversationStyle, { kind: "custom" }>
  >(`/users/me/styles/${encodeURIComponent(id)}`, patch);
  return data;
}

export async function deleteStyle(id: string): Promise<void> {
  await apiClient.delete(`/users/me/styles/${encodeURIComponent(id)}`);
}

export async function setPreferredStyle(
  styleId: string | null,
): Promise<{ preferredStyleId: string | null }> {
  const { data } = await apiClient.patch<{ preferredStyleId: string | null }>(
    "/users/me/preferences/style",
    { styleId },
  );
  return data;
}
