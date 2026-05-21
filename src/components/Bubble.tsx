import { useEffect, useRef } from "react";
import { Animated, View, type ViewStyle } from "react-native";

import { Text } from "./Text";
import { AudioWave } from "./AudioWave";
import { useTheme } from "@/theme/ThemeProvider";

export type BubbleSide = "left" | "right";

type Props = {
  /** "left" = remote speaker (lime); "right" = local / AI (forest). */
  side: BubbleSide;
  /** Mono uppercase label above the message ("Мама", "Ти · ШІ-голос"). */
  who?: string;
  text: string;
  /** Show the three-dot typing pulse after the text. */
  partial?: boolean;
  /** Show the audio wave under the text (live speaker). */
  live?: boolean;
  style?: ViewStyle;
};

/**
 * Chat bubble — the live-call transcript and conversation history both
 * render through this. The "tail" is faked by squashing the corner radius
 * on the speaker's side (`borderBottomLeftRadius` for left, etc.) which
 * gives the design's softly-pinched silhouette without a separate path.
 */
export function Bubble({ side, who, text, partial, live, style }: Props) {
  const theme = useTheme();
  const isLeft = side === "left";
  const bg = isLeft ? theme.colors.accent : theme.colors.surfaceInverse;
  const fg = isLeft ? theme.colors.accentText : theme.colors.textOnInverse;
  const labelColor = isLeft
    ? "rgba(10,10,10,0.6)"
    : "rgba(255,255,255,0.65)";

  return (
    <View
      style={[
        {
          alignItems: isLeft ? "flex-start" : "flex-end",
          width: "100%",
        },
        style,
      ]}
    >
      <View
        style={{
          backgroundColor: bg,
          borderRadius: theme.radii.xl,
          borderBottomLeftRadius: isLeft ? 6 : theme.radii.xl,
          borderBottomRightRadius: isLeft ? theme.radii.xl : 6,
          paddingHorizontal: 14,
          paddingVertical: 12,
          maxWidth: "86%",
        }}
      >
        {who ? (
          <Text
            variant="label"
            style={{ color: labelColor, textTransform: "uppercase", marginBottom: 4 }}
          >
            {who}
          </Text>
        ) : null}
        <Text variant="body" style={{ color: fg, lineHeight: 22 }}>
          {text}
          {partial ? <TypingDots color={fg} /> : null}
        </Text>
        {live ? (
          <View style={{ marginTop: 8 }}>
            <AudioWave
              color={isLeft ? theme.colors.text : theme.colors.accent}
              count={16}
              height={16}
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}

/** Three dots that pulse — pure decorative loader for the partial state. */
function TypingDots({ color }: { color: string }) {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <Dot key={i} color={color} delay={i * 180} />
      ))}
    </>
  );
}

function Dot({ color, delay }: { color: string; delay: number }) {
  const v = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(v, { toValue: 1, duration: 360, useNativeDriver: true }),
        Animated.timing(v, { toValue: 0.3, duration: 360, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [v, delay]);
  return (
    <Animated.Text style={{ color, opacity: v, fontSize: 18, lineHeight: 18 }}>
      {" •"}
    </Animated.Text>
  );
}
