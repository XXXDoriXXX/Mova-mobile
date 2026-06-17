import type { ReactNode } from "react";
import type { ViewStyle } from "react-native";
import Animated, { Easing, FadeIn, FadeInDown } from "react-native-reanimated";

type Props = {
  children: ReactNode;
  // Stagger: ms to wait before this element appears (pass index * step).
  delay?: number;
  // "up" eases in from a few px below (default); "fade" is a plain fade.
  variant?: "up" | "fade";
  style?: ViewStyle;
};

// Standard easing for incoming content: a calm decelerate (ease-out) over a
// short duration with a small displacement — no spring/overshoot. Matches the
// Material/iOS guidance that entrances should settle, not bounce.
const DURATION = 280;
const EASING = Easing.out(Easing.cubic);

export function Reveal({ children, delay = 0, variant = "up", style }: Props) {
  const entering =
    variant === "fade"
      ? FadeIn.duration(DURATION).easing(EASING).delay(delay)
      : FadeInDown.duration(DURATION).easing(EASING).delay(delay);
  return (
    <Animated.View entering={entering} style={style}>
      {children}
    </Animated.View>
  );
}
