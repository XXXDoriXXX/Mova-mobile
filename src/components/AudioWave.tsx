import { useEffect, useMemo, useRef } from "react";
import { Animated, View } from "react-native";

import { useTheme } from "@/theme/ThemeProvider";

type Props = {
  /** Number of bars. The default 14 matches the design reference. */
  count?: number;
  /** Max height of the tallest bar in dp. */
  height?: number;
  /** Bar colour. Defaults to lime so the wave reads on the dark card. */
  color?: string;
  /** Pause the animation. */
  paused?: boolean;
};

/**
 * Animated VU-meter-style bars. The pattern is fixed per-render but each
 * bar rides a sine wave with a phase offset, so the column reads as a
 * living waveform without a heavy audio decoder behind it. This is a
 * UI ornament; real wave data would be a separate component.
 *
 * We use the JS animation driver (not native) because `height` is not
 * one of the layout props supported by Reanimated's worklets; the cost
 * is tiny here (≤14 small bars at 60Hz).
 */
export function AudioWave({
  count = 14,
  height = 22,
  color,
  paused = false,
}: Props) {
  const theme = useTheme();
  const strokeColor = color ?? theme.colors.accent;

  // Stable per-bar base height + phase so a re-render does not jitter
  // the column. Heights pulled from a normal-ish distribution around 60%.
  const bars = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        base: 0.35 + ((i * 37) % 100) / 160,    // 0.35 – 0.97
        phase: (i / count) * Math.PI * 2,
      })),
    [count],
  );

  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (paused) return;
    const anim = Animated.loop(
      Animated.timing(t, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: false,
      }),
    );
    anim.start();
    return () => anim.stop();
  }, [paused, t]);

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 3, height }}>
      {bars.map((b, i) => {
        // sin(2π·t + phase) mapped to 0..1, then scaled to bar's base * height
        const h = t.interpolate({
          inputRange: [0, 0.25, 0.5, 0.75, 1],
          outputRange: [0.35, 0.95, 0.55, 0.85, 0.35]
            .map((v) => Math.max(0.15, b.base * v * height)),
        });
        return (
          <Animated.View
            key={i}
            style={{
              width: 3,
              borderRadius: 2,
              backgroundColor: strokeColor,
              height: h,
            }}
          />
        );
      })}
    </View>
  );
}
