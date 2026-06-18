import { useEffect } from "react";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const WORD_REVEAL_MS = 240;

/**
 * Renders text word-by-word: each word fades and "focuses in" from a soft blur
 * to a sharp glyph. Only newly-mounted words animate, so as a bubble's text
 * grows (streamed STT, appended segments) just the fresh words reveal — already
 * visible ones stay put. The reveal is purely client-side and independent of
 * how the backend chunks the text.
 *
 * Rendered as inline <Animated.Text> children, so it must live INSIDE a parent
 * <Text> (it inherits colour / line-height from it).
 */
function RevealWord({ text, color }: { text: string; color: string }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(1, {
      duration: WORD_REVEAL_MS,
      easing: Easing.out(Easing.quad),
    });
  }, [progress]);

  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    // A wide text-shadow in the word's own colour reads as a blur that tightens
    // to zero as the word lands — a light "focus-in" without a blur library.
    textShadowColor: color,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: (1 - progress.value) * 7,
  }));

  return <Animated.Text style={style}>{text}</Animated.Text>;
}

export function WordReveal({ text, color }: { text: string; color: string }) {
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <>
      {words.map((w, i) => (
        <RevealWord
          key={i}
          text={i === words.length - 1 ? w : `${w} `}
          color={color}
        />
      ))}
    </>
  );
}
