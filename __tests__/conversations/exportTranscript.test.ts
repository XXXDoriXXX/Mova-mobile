import { transcriptToText } from "@/features/conversations/exportTranscript";
import type { Message } from "@/types/api";

function msg(partial: Partial<Message> & Pick<Message, "role" | "content">): Message {
  return {
    id: partial.id ?? "m-" + Math.random().toString(36).slice(2),
    conversationId: partial.conversationId ?? "c-1",
    role: partial.role,
    content: partial.content,
    ttsStatus: null,
    source: null,
    llmProvider: null,
    llmModel: null,
    ttsProvider: null,
    ttsVoice: null,
    durationMs: null,
    createdAt: partial.createdAt ?? new Date().toISOString(),
  };
}

describe("transcriptToText", () => {
  const baseInput = {
    phone: "+380501234567",
    startedAt: "2026-05-20T12:00:00.000Z",
    durationSeconds: 90,
    messages: [
      msg({ role: "interlocutor", content: "Алло, я слухаю." }),
      msg({ role: "user_typed", content: "Доброго дня, я хочу записатись." }),
      msg({ role: "ai", content: "Доброго дня, маю записатись на прийом." }),
    ],
  };

  it("includes the phone number and duration in the header", () => {
    const text = transcriptToText(baseInput);
    expect(text).toContain("+380501234567");
    expect(text).toContain("1:30");
  });

  it("renders one labelled line per message in input order", () => {
    const text = transcriptToText(baseInput);
    const lines = text.split("\n");
    const bodyLines = lines.filter((l) => l.includes(":") && !l.startsWith("MOVA"));
    expect(lines[lines.length - 3]).toContain("Інший абонент");
    expect(lines[lines.length - 2]).toContain("Я (введено)");
    expect(lines[lines.length - 1]).toContain("AI (від мене)");
    expect(bodyLines.length).toBeGreaterThanOrEqual(3);
  });

  it("omits duration line when seconds === 0", () => {
    const text = transcriptToText({ ...baseInput, durationSeconds: 0 });
    expect(text).not.toContain("Тривалість");
  });

  it("handles empty message list without throwing", () => {
    expect(() =>
      transcriptToText({ ...baseInput, messages: [] }),
    ).not.toThrow();
  });
});
