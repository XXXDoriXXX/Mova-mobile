import { apiClient } from "./client";
import type { PushPlatform, PushTokenKind } from "@/types/api";

export type RegisterPushTokenInput = {
  token: string;
  platform: PushPlatform;
  kind?: PushTokenKind;
};

export async function registerPushToken(
  input: RegisterPushTokenInput,
): Promise<void> {
  await apiClient.post("/push-tokens", input);
}

export async function unregisterPushToken(token: string): Promise<void> {
  await apiClient.delete("/push-tokens", { data: { token } });
}
