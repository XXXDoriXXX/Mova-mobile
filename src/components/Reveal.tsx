import type { ReactNode } from "react";
import type { ViewStyle } from "react-native";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";

type Props = {
  children: ReactNode;
  // Stagger: ms to wait before this element appears (pass index * step).
  delay?: number;
  // "up" slides in from slightly below (default); "fade" is a plain fade.
  variant?: "up" | "fade";
  style?: ViewStyle;
};

// Small declarative entrance wrapper so screen content/list items fade-and-rise
// into place instead of popping. Reanimated runs it on the UI thread.
export function Reveal({ children, delay = 0, variant = "up", style }: Props) {
  const entering =
    variant === "fade"
      ? FadeIn.duration(280).delay(delay)
      : FadeInDown.springify().damping(20).mass(0.7).delay(delay);
  return (
    <Animated.View entering={entering} style={style}>
      {children}
    </Animated.View>
  );
}
