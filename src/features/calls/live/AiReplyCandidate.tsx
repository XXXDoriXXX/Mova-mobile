import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedProps,
  useSharedValue,
  withTiming,
  cancelAnimation,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";
import { triggerHaptic } from "@/utils/haptics";
import type { PendingAiReply } from "./callStore";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
  candidate: PendingAiReply;
  onAccept: (candidateId: string) => void;
  onCancel: (candidateId: string) => void;
};

/**
 * "About to speak" preview card. Shown above the composer/chips when
 * the backend has produced an AI reply but hasn't TTS'd it yet.
 * Behaviour depends on autoAcceptInMs:
 *
 *   - non-null (auto mode) → countdown ring sweeps from full → empty
 *     over autoAcceptInMs; at zero we fire onAccept ourselves and
 *     the chip dissolves. User can tap "Скасувати" to drop or
 *     "Озвучити зараз" to skip the wait.
 *
 *   - null (manual mode) → no ring, no timer; card stays until the
 *     user taps either action. Send button gets accent colour to
 *     read as the primary action.
 *
 * The countdown ring is drawn with react-native-svg's stroke-dasharray
 * trick — animating `strokeDashoffset` on the UI thread via reanimated
 * shared values gives a smooth sweep that doesn't tick with React's
 * render cadence and survives a JS-thread stall during a transcript
 * burst.
 */
export function AiReplyCandidate({ candidate, onAccept, onCancel }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  // While streaming, the reply text is still arriving — no countdown runs
  // and the badge shows a generating spinner. Auto-accept only applies to a
  // finalized candidate with a non-null window.
  const isStreaming = candidate.streaming;
  const isAuto = !isStreaming && candidate.autoAcceptInMs != null;

  // Local tick — only used to drive the textual "Xs" countdown next to
  // the ring. The ring itself runs on the UI thread (see below) and
  // doesn't need React re-renders.
  const totalMs = candidate.autoAcceptInMs ?? 0;
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!isAuto) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [isAuto]);
  const remainingMs = isAuto
    ? Math.max(0, totalMs - (now - candidate.receivedAt))
    : 0;
  const remainingS = Math.ceil(remainingMs / 1000);

  // Self-fire accept when the countdown ring runs out. Guard against
  // double-fire by checking on each tick — the parent only re-renders
  // when state changes, so a stale candidate won't fire twice.
  useEffect(() => {
    if (!isAuto) return;
    if (remainingMs > 0) return;
    onAccept(candidate.candidateId);
    // Eslint-react-hooks/exhaustive-deps: we don't depend on `onAccept`
    // reference identity — it's stable per render and re-firing on
    // identity change here would re-trigger accept on parent re-renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuto, remainingMs, candidate.candidateId]);

  // Reset → animate the ring sweep. Width sweeps from full (offset 0)
  // to empty (offset = circumference) over totalMs.
  const RING_SIZE = 40;
  const RING_STROKE = 3;
  const radius = (RING_SIZE - RING_STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = useSharedValue(0);
  useEffect(() => {
    if (!isAuto) return;
    dashOffset.value = 0;
    dashOffset.value = withTiming(circumference, {
      duration: totalMs,
      easing: Easing.linear,
    });
    return () => cancelAnimation(dashOffset);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidate.candidateId, isAuto]);
  // useAnimatedProps is the right primitive for SVG attribute animation:
  // strokeDashoffset is an SVG attribute, not a CSS-style key, so
  // useAnimatedStyle types reject it. AnimatedCircle (via
  // createAnimatedComponent) consumes animatedProps as actual SVG attrs.
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: dashOffset.value,
  }));

  function handleAccept() {
    triggerHaptic("light");
    onAccept(candidate.candidateId);
  }
  function handleCancel() {
    triggerHaptic("warning");
    onCancel(candidate.candidateId);
  }

  // Reuse a stable layout for the body so the chip doesn't reflow when
  // the countdown text shrinks from "3s" to "1s".
  const bodyStyle = useMemo(
    () => ({
      flex: 1,
      gap: 4,
    }),
    [],
  );

  return (
    <Animated.View
      key={candidate.candidateId}
      entering={FadeIn.duration(180)}
      exiting={FadeOut.duration(140)}
      style={{
        marginHorizontal: theme.spacing.page,
        marginBottom: 8,
        padding: 12,
        borderRadius: theme.radii.xl,
        borderWidth: 1,
        borderColor: theme.colors.accent,
        backgroundColor: theme.colors.surface,
        gap: 12,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        {/* Left badge: countdown ring with the seconds-remaining
            number inside (auto mode) OR a stable mic icon (manual). */}
        <View
          style={{
            width: RING_SIZE,
            height: RING_SIZE,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isStreaming ? (
            <View
              style={{
                width: RING_SIZE,
                height: RING_SIZE,
                borderRadius: RING_SIZE / 2,
                backgroundColor: theme.colors.surfaceMuted,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ActivityIndicator size="small" color={theme.colors.accent} />
            </View>
          ) : isAuto ? (
            <>
              <Svg
                width={RING_SIZE}
                height={RING_SIZE}
                style={{ position: "absolute" }}
              >
                <Circle
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={radius}
                  stroke={theme.colors.surfaceMuted}
                  strokeWidth={RING_STROKE}
                  fill="none"
                />
                <AnimatedCircle
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={radius}
                  stroke={theme.colors.accent}
                  strokeWidth={RING_STROKE}
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${circumference} ${circumference}`}
                  // Rotate -90deg so the sweep starts at 12 o'clock,
                  // which reads as the canonical "timer running down".
                  transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
                  animatedProps={animatedProps}
                />
              </Svg>
              <Text
                variant="label"
                weight="bold"
                style={{ fontSize: 13, color: theme.colors.text }}
              >
                {remainingS}
              </Text>
            </>
          ) : (
            <View
              style={{
                width: RING_SIZE,
                height: RING_SIZE,
                borderRadius: RING_SIZE / 2,
                backgroundColor: theme.colors.surfaceMuted,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons
                name="mic-outline"
                size={18}
                color={theme.colors.text}
              />
            </View>
          )}
        </View>

        <View style={bodyStyle}>
          <Text
            variant="label"
            color="textMuted"
            style={{ textTransform: "uppercase", fontSize: 10, letterSpacing: 0.6 }}
          >
            {isStreaming
              ? t("liveCandidate.generating")
              : isAuto
                ? t("liveCandidate.autoLabel")
                : t("liveCandidate.manualLabel")}
          </Text>
          <Text variant="body" color="text" numberOfLines={4}>
            {candidate.text || "…"}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 8 }}>
        <Pressable
          onPress={handleCancel}
          accessibilityRole="button"
          accessibilityLabel={t("liveCandidate.cancel")}
          style={({ pressed }) => ({
            flex: 1,
            paddingVertical: 10,
            borderRadius: theme.radii.pill,
            borderWidth: 1,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
            alignItems: "center",
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text variant="button" color="text">
            {t("liveCandidate.cancel")}
          </Text>
        </Pressable>
        <Pressable
          onPress={handleAccept}
          accessibilityRole="button"
          accessibilityLabel={t("liveCandidate.send")}
          style={({ pressed }) => ({
            flex: 1.4,
            paddingVertical: 10,
            borderRadius: theme.radii.pill,
            backgroundColor: theme.colors.accent,
            alignItems: "center",
            opacity: pressed ? 0.9 : 1,
            flexDirection: "row",
            justifyContent: "center",
            gap: 6,
          })}
        >
          <Ionicons name="send" size={14} color={theme.colors.accentText} />
          <Text variant="button" style={{ color: theme.colors.accentText }}>
            {isAuto ? t("liveCandidate.sendNow") : t("liveCandidate.send")}
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}
