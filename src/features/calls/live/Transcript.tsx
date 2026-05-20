import { useEffect, useRef } from "react";
import { ScrollView, View } from "react-native";

import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";

import type { Bubble } from "./callStore";

type Props = { bubbles: Bubble[]; aiThinking: boolean };

export function Transcript({ bubbles, aiThinking }: Props) {
  const theme = useTheme();
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [bubbles.length, aiThinking]);

  return (
    <ScrollView
      ref={scrollRef}
      style={{ flex: 1 }}
      contentContainerStyle={{ gap: theme.spacing.sm, padding: theme.spacing.sm }}
    >
      {bubbles.map((b) => {
        const isUser = b.role === "user";
        const isAi = b.role === "ai";
        const isSystem = b.role === "system";

        if (isSystem) {
          return (
            <View key={b.id} style={{ alignSelf: "center" }}>
              <Text variant="caption" color="textMuted">
                {b.content}
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
            key={b.id}
            style={{
              alignSelf: align,
              maxWidth: "82%",
              backgroundColor: bg,
              borderRadius: theme.radii.lg,
              paddingHorizontal: theme.spacing.md,
              paddingVertical: theme.spacing.sm,
              opacity: b.partial ? 0.75 : 1,
              borderWidth: isAi ? 1 : 0,
              borderColor: theme.colors.border,
            }}
          >
            <Text variant="body" style={{ color: fg }}>
              {b.content}
            </Text>
          </View>
        );
      })}
      {aiThinking ? (
        <View style={{ alignSelf: "flex-start" }}>
          <Text variant="caption" color="textMuted">
            …
          </Text>
        </View>
      ) : null}
    </ScrollView>
  );
}
