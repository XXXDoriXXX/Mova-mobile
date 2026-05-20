// Mirrors docs/08-error-codes.md.
// `recoverable: true` → toast, call keeps going.
// `recoverable: false` → banner, WS closes, call ends.

export type CallErrorCode =
  | "STT_UNAVAILABLE"
  | "STT_DEGRADED"
  | "STT_STALLED"
  | "LLM_UNAVAILABLE"
  | "LLM_DEGRADED"
  | "TTS_DEGRADED"
  | "PROMPT_INJECTION"
  | "CONTENT_BLOCKED"
  | "RATE_LIMITED"
  | "BALANCE_EXHAUSTED"
  | "LIVEKIT_DISCONNECTED"
  | "AGENT_LOST"
  | "TTS_UNAVAILABLE"
  | "CALL_TIMEOUT"
  | "FATAL_INTERNAL";

export const RECOVERABLE_CALL_ERRORS: Record<CallErrorCode, boolean> = {
  STT_UNAVAILABLE: true,
  STT_DEGRADED: true,
  STT_STALLED: true,
  LLM_UNAVAILABLE: true,
  LLM_DEGRADED: true,
  TTS_DEGRADED: true,
  PROMPT_INJECTION: true,
  CONTENT_BLOCKED: true,
  RATE_LIMITED: true,
  BALANCE_EXHAUSTED: false,
  LIVEKIT_DISCONNECTED: false,
  AGENT_LOST: false,
  TTS_UNAVAILABLE: false,
  CALL_TIMEOUT: false,
  FATAL_INTERNAL: false,
};

export function isRecoverable(code: CallErrorCode): boolean {
  return RECOVERABLE_CALL_ERRORS[code];
}
