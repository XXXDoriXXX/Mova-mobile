import { View } from "react-native";

import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";
import type { Message } from "@/types/api";

type Props = { messages: Message[] };

export function TranscriptView({ messages }: Props) {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.spacing.sm }}>
      {messages.map((m) => {
        const isUser = m.role === "user_typed";
        const isAi = m.role === "ai";
        const isSystem = m.role === "system";

        if (isSystem) {
          return (
            <View key={m.id} style={{ alignSelf: "center" }}>
              <Text variant="caption" color="textMuted">
                {m.content}
              </Text>
            </View>
          );
        }

        const align = isUser ? "flex-end" : "flex-start";
        const bg = isUser
          ? theme.colors.primary
          : isAi
            ? theme.colors.surface
            : theme.colors.surfaceMuted;
        const fg = isUser ? theme.colors.primaryText : theme.colors.text;

        return (
          <View
            key={m.id}
            style={{
              alignSelf: align,
              maxWidth: "82%",
              backgroundColor: bg,
              borderRadius: theme.radii.lg,
              paddingHorizontal: theme.spacing.md,
              paddingVertical: theme.spacing.sm,
              borderWidth: isAi ? 1 : 0,
              borderColor: theme.colors.border,
            }}
          >
            <Text variant="body" style={{ color: fg }}>
              {m.content}
            </Text>
            {m.ttsStatus === "interrupted" ? (
              <Text variant="caption" color="textMuted">
                (перервано)
              </Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
