import type { CallErrorCode } from "@/realtime/error-codes";
import type { TFunction } from "i18next";

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

const DISMISSIBLE: ReadonlySet<CallErrorCode> = new Set<CallErrorCode>([
  "STT_DEGRADED" as CallErrorCode,
  "STT_UNAVAILABLE" as CallErrorCode,
  "STT_STALLED" as CallErrorCode,
  "LLM_DEGRADED" as CallErrorCode,
  "LLM_UNAVAILABLE" as CallErrorCode,
  "TTS_DEGRADED" as CallErrorCode,
]);
