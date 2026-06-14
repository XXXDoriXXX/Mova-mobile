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

export function AiReplyCandidate({ candidate, onAccept, onCancel }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isStreaming = candidate.streaming;
  const isAuto = !isStreaming && candidate.autoAcceptInMs != null;

  const totalMs = candidate.autoAcceptInMs ?? 0;
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!isAuto) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [isAuto]);
  const remainingMs = isAuto
    ? Math.max(0, totalMs - Math.max(0, now - candidate.receivedAt))
    : 0;
  const remainingS = Math.ceil(remainingMs / 1000);

  useEffect(() => {
    if (!isAuto) return;
    if (remainingMs > 0) return;
    onAccept(candidate.candidateId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuto, remainingMs, candidate.candidateId]);

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
