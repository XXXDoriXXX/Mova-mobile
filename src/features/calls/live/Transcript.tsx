import { useEffect, useRef } from "react";
import { ScrollView, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
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

/**
 * Live transcript scroll-view. Maps in-store bubble roles onto the
 * two-sided chat layout from the design:
 *
 *   - `interlocutor`           → left, lime (the remote person)
 *   - `ai` / `user`            → right, forest (your AI voice or typed line)
 *   - `system`                 → centred caption (call-state notices)
 *   - AI bubble `kind="idle_probe"` → ghost-style with a small "checking
 *     in…" label so the user understands the agent is probing silence,
 *     not asking a real question
 *   - AI bubble `kind="fallback"`   → ghost-style with "filler reply"
 *     label so a "Перепрошую, можете повторити?" doesn't read as a
 *     genuine follow-up to whatever the user just said
 *
 * Auto-scrolls to bottom on each new bubble so the latest exchange is
 * always in frame — there's no scrollback-while-active flow.
 *
 * AiThinking indicator uses three animated dots (typing-style) instead
 * of the previous static text — communicates "active work" across a
 * silent network without needing the user to read the words.
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

        // Synthetic AI utterances (idle probe / silence-fallback) render
        // with a muted "ghost" treatment + a one-line label above the
        // bubble explaining what they are. Otherwise the user could
        // mistake "Алло, чи мене чути?" for the AI actually asking them
        // a follow-up question.
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

/**
 * Three-dots typing indicator — the universal "the other side is
 * working on a reply" signal. Drives the animation on the UI thread
 * via shared values so it doesn't tick with React's render cadence
 * and doesn't drop frames if JS is busy parsing a transcript burst.
 *
 * Each dot animates opacity in a staggered loop (0 / 160 / 320 ms
 * offsets) so the row reads as a wave rather than a flicker.
 */
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
