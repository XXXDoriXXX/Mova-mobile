import { useEffect, useRef } from "react";
import { Animated, View, type ViewStyle } from "react-native";

import { Text } from "./Text";
import { AudioWave } from "./AudioWave";
import { useTheme } from "@/theme/ThemeProvider";

export type BubbleSide = "left" | "right";

type Props = {
  side: BubbleSide;
  who?: string;
  text: string;
  partial?: boolean;
  live?: boolean;
  style?: ViewStyle;
};

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
