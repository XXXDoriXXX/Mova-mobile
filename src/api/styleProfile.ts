import { apiClient } from "./client";
import type { UserStyleProfile } from "@/types/api";

/** `GET /users/me/style-profile` — fetch writing-style adaptation state. */
export async function getStyleProfile(): Promise<UserStyleProfile> {
  const { data } = await apiClient.get<UserStyleProfile>(
    "/users/me/style-profile",
  );
  return data;
}

/** `DELETE /users/me/style-profile` — reset adaptation; next typed message restarts training. */
export async function resetStyleProfile(): Promise<void> {
  await apiClient.delete("/users/me/style-profile");
}
