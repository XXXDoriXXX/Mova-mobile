import type { Message } from "@/types/api";

type ExportInput = {
  phone: string;
  startedAt: string;
  durationSeconds: number;
  messages: Message[];
};

const ROLE_LABEL: Record<Message["role"], string> = {
  interlocutor: "Інший абонент",
  ai: "AI (від мене)",
  user_typed: "Я (введено)",
  system: "Система",
};

function fmtClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Plain-text dump of a conversation suitable for OS Share sheet. Includes
 * header (phone, time, duration) and a per-message log with role label.
 * No PII beyond what the user already sees; safe to share.
 */
export function transcriptToText(input: ExportInput): string {
  const lines: string[] = [];
  lines.push(`MOVA — ${input.phone}`);
  lines.push(new Date(input.startedAt).toLocaleString());
  if (input.durationSeconds > 0) {
    lines.push(`Тривалість: ${fmtClock(input.durationSeconds)}`);
  }
  lines.push("");
  for (const m of input.messages) {
    const label = ROLE_LABEL[m.role];
    lines.push(`${label}: ${m.content}`);
  }
  return lines.join("\n");
}
