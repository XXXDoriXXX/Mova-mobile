import { apiClient } from "./client";
import type { UserStyleProfile } from "@/types/api";

export async function getStyleProfile(): Promise<UserStyleProfile> {
  const { data } = await apiClient.get<UserStyleProfile>(
    "/users/me/style-profile",
  );
  return data;
}

export async function resetStyleProfile(): Promise<void> {
  await apiClient.delete("/users/me/style-profile");
}
