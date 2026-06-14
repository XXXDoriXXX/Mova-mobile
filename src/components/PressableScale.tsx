import { forwardRef, type ReactNode } from "react";
import {
  Pressable,
  type PressableProps,
  type View,
  type ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
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
        scale.value = withSpring(scaleTo, { damping: 18, stiffness: 320 });
        if (pressedOpacity !== undefined) {
          opacity.value = withTiming(pressedOpacity, { duration: 80 });
        }
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, { damping: 14, stiffness: 240 });
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
