import { useEffect, useRef } from "react";
import { ScrollView, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

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
      contentContainerStyle={{
        gap: theme.spacing.sm,
        padding: theme.spacing.sm,
      }}
    >
      {bubbles.map((b) => {
        const isUser = b.role === "user";
        const isAi = b.role === "ai";
        const isSystem = b.role === "system";

        if (isSystem) {
          return (
            <Animated.View
              key={b.id}
              entering={FadeIn.duration(120)}
              style={{ alignSelf: "center" }}
            >
              <Text variant="caption" color="textMuted">
                {b.content}
              </Text>
            </Animated.View>
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
          <Animated.View
            key={b.id}
            entering={FadeIn.duration(160)}
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
          </Animated.View>
        );
      })}
      {aiThinking ? (
        <Animated.View
          entering={FadeIn.duration(120)}
          exiting={FadeOut.duration(120)}
          style={{ alignSelf: "flex-start" }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: theme.spacing.xs,
              paddingHorizontal: theme.spacing.md,
              paddingVertical: theme.spacing.sm,
              backgroundColor: theme.colors.surfaceMuted,
              borderRadius: theme.radii.pill,
            }}
          >
            <Text variant="caption" color="textMuted">
              ●
            </Text>
            <Text variant="caption" color="textMuted">
              ●
            </Text>
            <Text variant="caption" color="textMuted">
              ●
            </Text>
          </View>
        </Animated.View>
      ) : null}
    </ScrollView>
  );
}
