import { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, G, Path, Rect } from "react-native-svg";

// In-app boot loader. Renders the MOVA mark on the same green as the native
// splash (expo-splash-screen backgroundColor) so the hand-off is seamless: the
// native splash hides once fonts load, this animated logo covers the auth
// hydration gap, then fades out when the app is ready to route.

const BG = "#062018";
const LIME = "#D2F438";
const WHITE = "#FFFFFF";

const AnimatedRect = Animated.createAnimatedComponent(Rect);

// A single equalizer bar that pulses its height around a fixed vertical centre.
function Bar({
  x,
  centerY,
  baseHeight,
  fill,
  delay,
  width = 28,
  rx = 14,
}: {
  x: number;
  centerY: number;
  baseHeight: number;
  fill: string;
  delay: number;
  width?: number;
  rx?: number;
}) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.5, { duration: 520, easing: Easing.inOut(Easing.quad) }),
          withTiming(1, { duration: 520, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
      ),
    );
    return () => cancelAnimation(scale);
  }, [scale, delay]);

  const animatedProps = useAnimatedProps(() => {
    const h = baseHeight * scale.value;
    return { height: h, y: centerY - h / 2 };
  });

  return (
    <AnimatedRect
      x={x}
      width={width}
      rx={rx}
      fill={fill}
      animatedProps={animatedProps}
    />
  );
}

export function BootSplash({ visible }: { visible: boolean }) {
  const opacity = useSharedValue(1);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (visible) {
      setGone(false);
      opacity.value = 1;
      return;
    }
    opacity.value = withTiming(0, { duration: 320, easing: Easing.out(Easing.quad) });
    const t = setTimeout(() => setGone(true), 340);
    return () => clearTimeout(t);
  }, [visible, opacity]);

  const fadeStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  if (gone) return null;

  return (
    <Animated.View
      pointerEvents={visible ? "auto" : "none"}
      style={[StyleSheet.absoluteFill, styles.container, fadeStyle]}
    >
      <Svg width={260} height={260} viewBox="0 0 512 512">
        <G transform="translate(13,0)">
          {/* static identity shapes */}
          <Circle cx={242} cy={290} r={16} fill={WHITE} />
          <Path d="M272 234 L300 200 L328 234 L328 332 L272 332 Z" fill={WHITE} />
          {/* pulsing equalizer bars (staggered) */}
          <Bar x={130} centerY={256} baseHeight={152} fill={LIME} delay={0} />
          <Bar x={185} centerY={276} baseHeight={112} fill={LIME} delay={140} />
          <Bar x={356} centerY={266} baseHeight={132} fill={WHITE} delay={280} rx={2} />
        </G>
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: BG,
    alignItems: "center",
    justifyContent: "center",
  },
});
