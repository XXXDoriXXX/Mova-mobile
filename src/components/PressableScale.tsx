import { forwardRef, type ReactNode } from "react";
import {
  Pressable,
  type PressableProps,
  type View,
  type ViewStyle,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { triggerHaptic, type HapticKind } from "@/utils/haptics";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, "style" | "children"> & {
  children: ReactNode;
  style?: ViewStyle | ViewStyle[];
  scaleTo?: number;
  haptic?: HapticKind | null;
  pressedOpacity?: number;
};

export const PressableScale = forwardRef<View, Props>(function PressableScale(
  { children, style, scaleTo = 0.96, haptic = "light", pressedOpacity, onPress, onPressIn, onPressOut, ...rest },
  ref,
) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <AnimatedPressable
      ref={ref}
      onPressIn={(e) => {
        // Pure timed ease — no spring physics, so it can never overshoot/bounce.
        scale.value = withTiming(scaleTo, {
          duration: 90,
          easing: Easing.out(Easing.quad),
        });
        if (pressedOpacity !== undefined) {
          opacity.value = withTiming(pressedOpacity, { duration: 80 });
        }
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withTiming(1, {
          duration: 130,
          easing: Easing.out(Easing.quad),
        });
        if (pressedOpacity !== undefined) {
          opacity.value = withTiming(1, { duration: 120 });
        }
        onPressOut?.(e);
      }}
      onPress={(e) => {
        if (haptic) triggerHaptic(haptic);
        onPress?.(e);
      }}
      style={[animStyle, style as ViewStyle]}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
});
