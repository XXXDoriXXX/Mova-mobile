export const CallErrorCode = {
  STT_UNAVAILABLE: "STT_UNAVAILABLE",
  STT_DEGRADED: "STT_DEGRADED",
  STT_STALLED: "STT_STALLED",
  LLM_UNAVAILABLE: "LLM_UNAVAILABLE",
  LLM_DEGRADED: "LLM_DEGRADED",
  TTS_UNAVAILABLE: "TTS_UNAVAILABLE",
  TTS_DEGRADED: "TTS_DEGRADED",

  PROMPT_INJECTION: "PROMPT_INJECTION",
  CONTENT_BLOCKED: "CONTENT_BLOCKED",

  RATE_LIMITED: "RATE_LIMITED",

  BALANCE_EXHAUSTED: "BALANCE_EXHAUSTED",
  LIVEKIT_DISCONNECTED: "LIVEKIT_DISCONNECTED",
  AGENT_LOST: "AGENT_LOST",
  CALL_TIMEOUT: "CALL_TIMEOUT",
  FATAL_INTERNAL: "FATAL_INTERNAL",
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare
export type CallErrorCode = (typeof CallErrorCode)[keyof typeof CallErrorCode];

const RECOVERABLE: ReadonlySet<CallErrorCode> = new Set<CallErrorCode>([
  CallErrorCode.STT_UNAVAILABLE,
  CallErrorCode.STT_DEGRADED,
  CallErrorCode.STT_STALLED,
  CallErrorCode.LLM_UNAVAILABLE,
  CallErrorCode.LLM_DEGRADED,
  CallErrorCode.TTS_DEGRADED,
  CallErrorCode.PROMPT_INJECTION,
  CallErrorCode.CONTENT_BLOCKED,
  CallErrorCode.RATE_LIMITED,
]);

export function isRecoverable(code: CallErrorCode): boolean {
  return RECOVERABLE.has(code);
}
