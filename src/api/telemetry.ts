import { apiClient } from "./client";

export type ClientErrorEvent = {
  name: string;
  message: string;
  stack?: string;
  fatal: boolean;
  platform: "ios" | "android" | "web";
  appVersion?: string;
  deviceModel?: string;
  osVersion?: string;
  screen?: string;
  conversationId?: string;
  breadcrumbs?: {
    ts: number;
    level?: "debug" | "info" | "warning" | "error";
    category?: string;
    message: string;
    data?: Record<string, unknown>;
  }[];
  context?: Record<string, unknown>;
  clientCreatedAt?: string;
};

export async function sendClientErrors(
  events: ClientErrorEvent[],
): Promise<void> {
  await apiClient.post(
    "/telemetry/client-errors",
    { events },
    // Best-effort: a delivery failure must never trigger the auth-refresh
    // retry loop or surface to the user. The endpoint is public; the token
    // (if present) is still attached by the request interceptor for user
    // attribution.
    { meta: { retried: true }, timeout: 8_000 },
  );
}
