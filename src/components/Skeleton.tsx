import { useEffect } from "react";
import { type ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";

import { useTheme } from "@/theme/ThemeProvider";

type Props = {
  width?: ViewStyle["width"];
  height?: ViewStyle["height"];
  radius?: number;
  style?: ViewStyle;
};

export function Skeleton({
  width = "100%",
  height = 16,
  radius,
  style,
}: Props) {
  const theme = useTheme();
  const progress = useSharedValue(0.3);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(0.8, { duration: 800, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [progress]);

  const animated = useAnimatedStyle(() => ({ opacity: progress.value }));

  return (
    <Animated.View
      accessibilityRole="progressbar"
      style={[
        {
          width,
          height,
          borderRadius: radius ?? theme.radii.sm,
          backgroundColor: theme.colors.surfaceMuted,
        },
        style,
        animated,
      ]}
    />
  );
}
