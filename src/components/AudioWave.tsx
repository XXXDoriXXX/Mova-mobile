import { useEffect, useMemo, useRef } from "react";
import { Animated, View } from "react-native";

import { useTheme } from "@/theme/ThemeProvider";

type Props = {
  count?: number;
  height?: number;
  color?: string;
  paused?: boolean;
};

export function AudioWave({
  count = 14,
  height = 22,
  color,
  paused = false,
}: Props) {
  const theme = useTheme();
  const strokeColor = color ?? theme.colors.accent;

  const bars = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        base: 0.35 + ((i * 37) % 100) / 160,
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
