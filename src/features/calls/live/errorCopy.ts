import type { CallErrorCode } from "@/realtime/error-codes";
import type { TFunction } from "i18next";

/**
 * Maps a backend CallErrorCode into a user-friendly, Ukrainian-first
 * banner copy. The agent emits English-y technical strings ("STT
 * degraded — switching to fallback") that read like server logs;
 * none of our users care about provider names. This module hides the
 * vocabulary behind sentences that explain "what's happening to MY
 * call right now".
 *
 * Returns an object so the banner can render:
 *   - `tone` (warning vs danger vs info) — picks the colour palette
 *   - `title` short headline, e.g. "Зв'язок підвис"
 *   - `body` one-sentence detail with a hint of what we're doing
 *     about it ("перемикаюсь на резерв")
 *   - `dismissible` whether the user can swipe / X it away (degraded
 *     states yes; rate-limit no — would just re-fire and re-surface)
 *
 * Falls back to the backend's raw `message` if the code is unknown
 * — extension point for new server-side codes that haven't reached
 * mobile yet.
 */
export type ErrorBannerCopy = {
  tone: "info" | "warning" | "danger";
  title: string;
  body: string;
  dismissible: boolean;
};

export function copyForError(
  code: CallErrorCode,
  fallbackMessage: string,
  t: TFunction,
): ErrorBannerCopy {
  const key = `callErrors.${code}`;
  // The i18n bundle ships titles + bodies side-by-side under
  // `callErrors.<CODE>.{title,body}`; absence falls back to the
  // raw backend message so a new server code at least surfaces
  // something rather than going silent.
  const titleKey = `${key}.title`;
  const bodyKey = `${key}.body`;
  const hasI18n = t(titleKey) !== titleKey;
  return {
    tone: TONES[code] ?? "warning",
    title: hasI18n ? t(titleKey) : t("callErrors.generic.title"),
    body: hasI18n ? t(bodyKey) : fallbackMessage || t("callErrors.generic.body"),
    dismissible: DISMISSIBLE.has(code),
  };
}

const TONES: Partial<Record<CallErrorCode, ErrorBannerCopy["tone"]>> = {
  STT_DEGRADED: "warning",
  STT_UNAVAILABLE: "warning",
  STT_STALLED: "warning",
  LLM_DEGRADED: "warning",
  LLM_UNAVAILABLE: "warning",
  TTS_DEGRADED: "warning",
  PROMPT_INJECTION: "danger",
  CONTENT_BLOCKED: "danger",
  RATE_LIMITED: "info",
};

// Anything provider-degraded is dismissible — it's a status update,
// not blocking. Safety / rate limits stay until the relevant condition
// clears so the user doesn't miss the reason their message was rejected.
const DISMISSIBLE: ReadonlySet<CallErrorCode> = new Set<CallErrorCode>([
  "STT_DEGRADED" as CallErrorCode,
  "STT_UNAVAILABLE" as CallErrorCode,
  "STT_STALLED" as CallErrorCode,
  "LLM_DEGRADED" as CallErrorCode,
  "LLM_UNAVAILABLE" as CallErrorCode,
  "TTS_DEGRADED" as CallErrorCode,
]);
