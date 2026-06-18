import { useEffect, useRef } from "react";
import { ScrollView, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { Bubble as BubbleView } from "@/components/Bubble";
import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";

import type { Bubble } from "./callStore";

type Props = { bubbles: Bubble[]; aiThinking: boolean };

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

        if (b.role === "ai" && (b.kind === "idle_probe" || b.kind === "fallback")) {
          const labelKey =
            b.kind === "idle_probe"
              ? "live.aiProbeLabel"
              : "live.aiFallbackLabel";
          return (
            <Animated.View
              key={b.id}
              entering={FadeIn.duration(160)}
              style={{ alignSelf: "flex-end", maxWidth: "86%", gap: 4 }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  alignSelf: "flex-end",
                  gap: 4,
                }}
              >
                <Ionicons
                  name={b.kind === "idle_probe" ? "ear-outline" : "time-outline"}
                  size={11}
                  color={theme.colors.textMuted}
                />
                <Text
                  variant="label"
                  color="textMuted"
                  style={{ textTransform: "uppercase", fontSize: 9 }}
                >
                  {t(labelKey)}
                </Text>
              </View>
              <View
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: theme.radii.xl,
                  borderBottomRightRadius: 4,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surface,
                }}
              >
                <Text variant="body" color="textMuted" style={{ fontStyle: "italic" }}>
                  {b.content}
                </Text>
              </View>
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
            // Smoothly grow the bubble as a turn's micro-pause segments append,
            // instead of snapping to the new height.
            layout={LinearTransition.duration(220).easing(Easing.out(Easing.quad))}
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
      {aiThinking ? <ThinkingDots label={t("liveStatus.aiThinkingChat")} /> : null}
    </ScrollView>
  );
}

function ThinkingDots({ label }: { label: string }) {
  const theme = useTheme();
  return (
    <Animated.View
      entering={FadeIn.duration(120)}
      exiting={FadeOut.duration(120)}
      style={{ alignSelf: "flex-end", maxWidth: "86%" }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          paddingHorizontal: 14,
          paddingVertical: 10,
          backgroundColor: theme.colors.surfaceInverse,
          borderRadius: theme.radii.xl,
        }}
      >
        <View style={{ flexDirection: "row", gap: 3 }}>
          <Dot delay={0} color={theme.colors.accent} />
          <Dot delay={160} color={theme.colors.accent} />
          <Dot delay={320} color={theme.colors.accent} />
        </View>
        <Text variant="label" color="textOnInverse" style={{ opacity: 0.7 }}>
          {label}
        </Text>
      </View>
    </Animated.View>
  );
}

function Dot({ delay, color }: { delay: number; color: string }) {
  const opacity = useSharedValue(0.25);
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.25, { duration: delay, easing: Easing.linear }),
        withTiming(1, { duration: 280, easing: Easing.out(Easing.quad) }),
        withTiming(0.25, { duration: 380, easing: Easing.in(Easing.quad) }),
      ),
      -1,
      false,
    );
    return () => cancelAnimation(opacity);
  }, [delay, opacity]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      style={[
        {
          width: 5,
          height: 5,
          borderRadius: 2.5,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}
