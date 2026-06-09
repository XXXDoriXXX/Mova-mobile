import { View } from "react-native";
import { useTranslation } from "react-i18next";

import { Bubble } from "@/components/Bubble";
import { Text } from "@/components/Text";
import type { Message } from "@/types/api";

type Props = { messages: Message[] };

export function TranscriptView({ messages }: Props) {
  const { t } = useTranslation();
  return (
    <View style={{ gap: 10 }}>
      {messages.map((m) => {
        if (m.role === "system") {
          return (
            <View key={m.id} style={{ alignSelf: "center" }}>
              <Text
                variant="label"
                color="textMuted"
                style={{ textTransform: "uppercase" }}
              >
                {m.content}
              </Text>
            </View>
          );
        }

        const side = m.role === "interlocutor" ? "left" : "right";
        const who =
          m.role === "interlocutor"
            ? t("live.whoInterlocutor")
            : m.role === "ai"
              ? t("live.whoAi")
              : t("live.whoYou");

        return (
          <View key={m.id} style={{ gap: 4 }}>
            <Bubble side={side} who={who} text={m.content} />
            {m.ttsStatus === "interrupted" ? (
              <Text
                variant="caption"
                color="textMuted"
                style={{ alignSelf: side === "left" ? "flex-start" : "flex-end" }}
              >
                {t("conversation.interrupted")}
              </Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
