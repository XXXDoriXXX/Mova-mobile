import { extractErrorPayload } from "@/api/client";

export type TemplateFormErrorMapping =
  | { kind: "field"; field: "systemPrompt"; code: "promptInjection" }
  | { kind: "banner"; code: "generic" };

export function mapTemplateFormError(err: unknown): TemplateFormErrorMapping {
  const payload = extractErrorPayload(err);
  if (payload?.error === "PROMPT_INJECTION") {
    return { kind: "field", field: "systemPrompt", code: "promptInjection" };
  }
  return { kind: "banner", code: "generic" };
}
