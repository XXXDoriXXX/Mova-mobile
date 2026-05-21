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
  /** How much to scale down on press. 0.96 is subtle and matches the
   *  iOS default tap feedback; use 0.92 for big "feature" cards. */
  scaleTo?: number;
  /** Haptic fired on press. Default is `light` — set to `null` to
   *  suppress (e.g. when the calling primitive already triggers its
   *  own haptic). */
  haptic?: HapticKind | null;
  /** Press-in opacity in addition to the scale. */
  pressedOpacity?: number;
};

/**
 * Reusable tactile wrapper. Scales the child down 4 % on press-in, snaps
 * back on press-out, and fires a light haptic on tap. Use everywhere a
 * `Pressable` would feel flat (cards, large CTA areas, list rows).
 *
 * Built on Reanimated so the animation runs on the UI thread — no JS
 * round-trip when the user taps quickly.
 */
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
