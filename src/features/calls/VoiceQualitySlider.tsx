import { useEffect, useState } from "react";
import { LayoutChangeEvent, Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Extrapolation,
  FadeIn,
  interpolate,
  interpolateColor,
  runOnJS,
  SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";

export type VoiceTier = "eco" | "real" | "ultra";

const ORDER: VoiceTier[] = ["eco", "real", "ultra"];
const META: Record<
  VoiceTier,
  { colorKey: "voiceEco" | "voiceReal" | "voiceUltra"; price: number; dots: number }
> = {
  // price = illustrative retail UAH/min; the pool multiplier mirrors the backend
  // (eco 1, real 1.5, ultra 2) and lives in the i18n "pool" string.
  eco: { colorKey: "voiceEco", price: 1.5, dots: 2 },
  real: { colorKey: "voiceReal", price: 3, dots: 3 },
  ultra: { colorKey: "voiceUltra", price: 5, dots: 4 },
};

const THUMB = 28;
const BARS = 11;
const SPRING = { damping: 15, stiffness: 170 } as const;

type Props = {
  value: VoiceTier;
  onChange: (tier: VoiceTier) => void;
  /** premiumVoices entitlement — false locks real/ultra behind the paywall. */
  unlocked: boolean;
  onLockedPress?: () => void;
};

export function VoiceQualitySlider({ value, onChange, unlocked, onLockedPress }: Props) {
  const { t } = useTranslation();
  const { colors, spacing, radii } = useTheme();
  const stops = [colors.voiceEco, colors.voiceReal, colors.voiceUltra];
  const maxIndex = unlocked ? 2 : 0;

  const [current, setCurrent] = useState(ORDER.indexOf(value));
  const progress = useSharedValue(ORDER.indexOf(value));
  const trackW = useSharedValue(0);
  const start = useSharedValue(0);

  const commit = (i: number) => {
    setCurrent(i);
    onChange(ORDER[i]!);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };
  const upsell = () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    onLockedPress?.();
  };

  const pan = Gesture.Pan()
    .onBegin(() => {
      start.value = progress.value;
    })
    .onUpdate((e) => {
      const w = trackW.value || 1;
      const p = start.value + (e.translationX / w) * 2;
      progress.value = Math.max(0, Math.min(maxIndex, p));
    })
    .onEnd(() => {
      const i = Math.round(progress.value);
      progress.value = withSpring(i, SPRING);
      runOnJS(commit)(i);
    });

  const fillStyle = useAnimatedStyle(() => ({
    width: (progress.value / 2) * trackW.value,
    backgroundColor: interpolateColor(progress.value, [0, 1, 2], stops),
  }));
  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (progress.value / 2) * trackW.value - THUMB / 2 }],
    backgroundColor: interpolateColor(progress.value, [0, 1, 2], stops),
  }));
  const richness = useDerivedValue(() =>
    interpolate(progress.value, [0, 1, 2], [0.5, 0.78, 1], Extrapolation.CLAMP),
  );
  const waveColor = useDerivedValue(() =>
    interpolateColor(progress.value, [0, 1, 2], stops),
  );

  const onTrackLayout = (e: LayoutChangeEvent) => {
    trackW.value = e.nativeEvent.layout.width;
  };
  const selectStop = (i: number) => {
    if (i > maxIndex) {
      upsell();
      return;
    }
    progress.value = withSpring(i, SPRING);
    commit(i);
  };

  const tier = ORDER[current]!;
  const meta = META[tier];
  const tierColor = colors[meta.colorKey];
  const showPrice = unlocked || tier === "eco";

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: radii.lg,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
        padding: spacing.md,
        gap: spacing.sm,
      }}
    >
      <Text variant="label" color="textMuted">
        {t("preCall.vq.title")}
      </Text>

      <View
        style={{
          alignItems: "center",
          backgroundColor: colors.surfaceMuted,
          borderRadius: radii.md,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.sm,
        }}
      >
        <Waveform color={waveColor} richness={richness} />
        <Animated.View key={tier} entering={FadeIn.duration(220)} style={{ alignItems: "center", gap: 4 }}>
          <Text variant="bodyLarge" weight="bold">
            {t(`preCall.vq.${tier}.name`)}
          </Text>
          <View style={{ flexDirection: "row", gap: 6 }}>
            {[0, 1, 2, 3].map((d) => (
              <View
                key={d}
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 4,
                  backgroundColor: d < meta.dots ? tierColor : colors.border,
                }}
              />
            ))}
          </View>
          <Text variant="caption" color="textMuted" style={{ textAlign: "center" }}>
            {t(`preCall.vq.${tier}.desc`)}
          </Text>
        </Animated.View>
      </View>

      <View style={{ paddingTop: spacing.sm }}>
        <View onLayout={onTrackLayout} style={{ height: THUMB, justifyContent: "center" }}>
          <View
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              height: 6,
              borderRadius: 3,
              backgroundColor: colors.surfaceMuted,
            }}
          />
          <Animated.View
            style={[{ position: "absolute", left: 0, height: 6, borderRadius: 3 }, fillStyle]}
          />
          <GestureDetector gesture={pan}>
            <Animated.View
              style={[
                {
                  position: "absolute",
                  width: THUMB,
                  height: THUMB,
                  borderRadius: THUMB / 2,
                  borderWidth: 3,
                  borderColor: colors.surface,
                  shadowColor: tierColor,
                  shadowOpacity: 0.5,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 0 },
                  elevation: 6,
                },
                thumbStyle,
              ]}
            />
          </GestureDetector>
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: spacing.sm }}>
          {ORDER.map((id, i) => {
            const locked = i > maxIndex;
            const active = i === current;
            return (
              <Pressable
                key={id}
                onPress={() => selectStop(i)}
                hitSlop={8}
                style={{ flexDirection: "row", alignItems: "center", gap: 3 }}
                accessibilityRole="button"
                accessibilityLabel={t(`preCall.vq.${id}.name`)}
              >
                {locked ? (
                  <Ionicons name="lock-closed" size={11} color={colors.textMuted} />
                ) : null}
                <Text
                  variant="caption"
                  style={{
                    color: active ? colors[META[id].colorKey] : colors.textMuted,
                    fontWeight: active ? "600" : "400",
                  }}
                >
                  {t(`preCall.vq.${id}.name`)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          justifyContent: "space-between",
          marginTop: spacing.xs,
        }}
      >
        <View>
          <Animated.View key={`price-${tier}`} entering={FadeIn.duration(220)}>
            <Text variant="bodyLarge" weight="bold">
              {showPrice
                ? `≈ ${meta.price} ${t("preCall.vq.perMin")}`
                : t("preCall.vq.lockedPrice")}
            </Text>
          </Animated.View>
          <Text variant="caption" color="textMuted">
            {t(`preCall.vq.${tier}.pool`)}
          </Text>
        </View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: colors.border,
            borderRadius: 20,
            paddingHorizontal: 10,
            paddingVertical: 5,
          }}
        >
          <Ionicons name="flash-outline" size={12} color={colors.textMuted} />
          <Text variant="caption" color="textMuted">
            {t(`preCall.vq.${tier}.lat`)}
          </Text>
        </View>
      </View>
    </View>
  );
}

function Waveform({
  color,
  richness,
}: {
  color: SharedValue<string>;
  richness: SharedValue<number>;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", height: 44, marginBottom: 10 }}>
      {Array.from({ length: BARS }).map((_, i) => (
        <WaveBar key={i} index={i} color={color} richness={richness} />
      ))}
    </View>
  );
}

function WaveBar({
  index,
  color,
  richness,
}: {
  index: number;
  color: SharedValue<string>;
  richness: SharedValue<number>;
}) {
  const osc = useSharedValue(0.3);
  // Bars near the centre peak higher (a natural voice envelope).
  const env = 1 - (Math.abs(index - (BARS - 1) / 2) / ((BARS - 1) / 2)) * 0.55;

  useEffect(() => {
    osc.value = withDelay(
      index * 70,
      withRepeat(withTiming(1, { duration: 580 + (index % 3) * 120 }), -1, true),
    );
  }, [index, osc]);

  const style = useAnimatedStyle(() => ({
    height: 6 + osc.value * 28 * richness.value * env,
    backgroundColor: color.value as string,
  }));

  return <Animated.View style={[{ width: 5, borderRadius: 3, marginHorizontal: 2 }, style]} />;
}
