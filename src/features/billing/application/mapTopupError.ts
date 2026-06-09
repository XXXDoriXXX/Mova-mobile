import { extractErrorPayload } from "@/api/client";

export type TopupErrorKind = "rate-limited" | "bad-amount" | "generic";

export type TopupErrorMapping = {
  kind: TopupErrorKind;
  serverMessage?: string;
};

export function mapTopupError(err: unknown): TopupErrorMapping {
  const payload = extractErrorPayload(err);
  if (payload?.statusCode === 429) {
    return { kind: "rate-limited" };
  }
  if (payload?.statusCode === 400) {
    const serverMessage = Array.isArray(payload.message)
      ? payload.message.join(" ")
      : payload.message;
    return { kind: "bad-amount", serverMessage };
  }
  return { kind: "generic" };
}
