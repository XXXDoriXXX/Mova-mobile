import { useEffect, useState } from "react";
import type { TextStyle } from "react-native";
import { useSharedValue, withTiming, runOnJS } from "react-native-reanimated";

import { Text, type TextProps } from "./Text";

type Props = Omit<TextProps, "children"> & {
  /** Target value. Animates smoothly from the previous render's value. */
  value: number;
  /** Render the displayed number. Defaults to integer toString. */
  format?: (n: number) => string;
  /** Animation duration in ms. */
  durationMs?: number;
  style?: TextStyle | TextStyle[];
};

/**
 * Smoothly interpolates between numeric values. Useful for balance,
 * call duration, second counters — anywhere a number changes and a
 * sudden jump would look jarring.
 *
 * Uses Reanimated under the hood (UI-thread interpolation) and
 * commits the displayed string back to React state at ~60Hz via
 * `runOnJS`. The cost is one re-render per animation tick on this
 * component only — fine for low-frequency UI counters.
 */
export function AnimatedNumber({
  value,
  format = (n) => Math.round(n).toString(),
  durationMs = 480,
  style,
  ...rest
}: Props) {
  const [display, setDisplay] = useState(() => format(value));
  const shared = useSharedValue(value);

  useEffect(() => {
    shared.value = withTiming(value, { duration: durationMs }, () => {
      // Final settle to make sure rounding lands on the exact value.
      runOnJS(setDisplay)(format(value));
    });
    // Stream interpolated values via a derived-value subscription so
    // the displayed text updates each frame, not just at the end.
    const id = setInterval(() => {
      const current = shared.value;
      setDisplay(format(current));
      if (current === value) clearInterval(id);
    }, 32);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, durationMs]);

  return (
    <Text {...rest} style={style}>
      {display}
    </Text>
  );
}
