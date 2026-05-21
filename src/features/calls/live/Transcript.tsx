import { useEffect, useRef } from "react";
import { ScrollView, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { Bubble as BubbleView } from "@/components/Bubble";
import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";

import type { Bubble } from "./callStore";

type Props = { bubbles: Bubble[]; aiThinking: boolean };

/**
 * Live transcript scroll-view. Maps the in-store bubble roles onto the
 * two-sided chat layout from the design:
 *
 *   - `interlocutor`  → left, lime (the remote person)
 *   - `ai` / `user`   → right, forest (your AI voice or your typed line)
 *   - `system`        → centred caption (call-state notices)
 *
 * Partial bubbles get the typing-dots indicator. The view auto-scrolls
 * to bottom on each new bubble so the latest exchange is always in
 * frame — there is no scrollback-while-active flow.
 */
export function Transcript({ bubbles, aiThinking }: Props) {
  const { t } = useTranslation();
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
        gap: 10,
        paddingHorizontal: theme.spacing.page,
        paddingVertical: 8,
      }}
      showsVerticalScrollIndicator={false}
    >
      {bubbles.map((b) => {
        if (b.role === "system") {
          return (
            <Animated.View
              key={b.id}
              entering={FadeIn.duration(120)}
              style={{ alignSelf: "center" }}
            >
              <Text variant="label" color="textMuted" style={{ textTransform: "uppercase" }}>
                {b.content}
              </Text>
            </Animated.View>
          );
        }

        const side = b.role === "interlocutor" ? "left" : "right";
        const who =
          b.role === "interlocutor"
            ? t("live.whoInterlocutor")
            : b.role === "ai"
              ? t("live.whoAi")
              : t("live.whoYou");

        return (
          <Animated.View
            key={b.id}
            entering={FadeIn.duration(160)}
            style={{ width: "100%" }}
          >
            <BubbleView
              side={side}
              who={who}
              text={b.content}
              partial={b.partial}
            />
          </Animated.View>
        );
      })}
      {aiThinking ? (
        <Animated.View
          entering={FadeIn.duration(120)}
          exiting={FadeOut.duration(120)}
          style={{ alignSelf: "flex-end", maxWidth: "86%" }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              paddingHorizontal: 14,
              paddingVertical: 10,
              backgroundColor: theme.colors.surfaceInverse,
              borderRadius: theme.radii.xl,
            }}
          >
            <Text variant="label" color="textOnInverse" style={{ opacity: 0.6 }}>
              {t("live.aiThinking")}
            </Text>
          </View>
        </Animated.View>
      ) : null}
    </ScrollView>
  );
}
