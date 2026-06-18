import { useEffect } from "react";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { useStreamedText } from "./useStreamedText";

const WORD_MS = 220;

/**
 * The newest word eases in — fades up and "focuses" from a soft text-shadow
 * blur to a sharp glyph. Exactly ONE of these is alive at a time (the rest of
 * the text is plain), so it stays cheap no matter how long the message is.
 */
function FadeWord({ word, color }: { word: string; color: string }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(1, {
      duration: WORD_MS,
      easing: Easing.out(Easing.quad),
    });
  }, [progress]);

  const style = useAnimatedStyle(() => ({
    opacity: 0.15 + progress.value * 0.85,
    textShadowColor: color,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: (1 - progress.value) * 6,
  }));

  return <Animated.Text style={style}>{word}</Animated.Text>;
}

/**
 * Renders text with a smooth, steady word-by-word reveal decoupled from how the
 * backend streamed it. Must be used INSIDE a parent <Text> (inherits colour /
 * line-height); returns inline children only.
 */
export function StreamingText({ text, color }: { text: string; color: string }) {
  const { head, tail, tailKey } = useStreamedText(text);
  return (
    <>
      {head}
      {tail ? <FadeWord key={tailKey} word={tail} color={color} /> : null}
    </>
  );
}
