import { useEffect, useRef, useState } from "react";
import type { TextStyle } from "react-native";

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
 * Implementation: a plain JS `requestAnimationFrame` driver that
 * walks the displayed value from `previous` to `value` over
 * `durationMs`. We deliberately avoid Reanimated worklets here — the
 * formatter is a JS closure that doesn't survive worklet
 * serialisation, and the cost of re-rendering this single component
 * at 60Hz is negligible compared to debugging closure-capture bugs.
 */
export function AnimatedNumber({
  value,
  format = (n) => Math.round(n).toString(),
  durationMs = 480,
  style,
  ...rest
}: Props) {
  const [display, setDisplay] = useState(value);
  const from = useRef(value);
  const startedAt = useRef(0);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    // Stash the visible value at the moment a new target arrives so the
    // tween starts from where the user actually saw the number, not
    // from the last raw `value` prop (which could already have moved).
    from.current = display;
    startedAt.current = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startedAt.current;
      const t = Math.min(1, elapsed / Math.max(1, durationMs));
      // ease-out cubic — fast start, gentle settle.
      const eased = 1 - Math.pow(1 - t, 3);
      const next = from.current + (value - from.current) * eased;
      setDisplay(t >= 1 ? value : next);
      if (t < 1) {
        rafId.current = requestAnimationFrame(tick);
      } else {
        rafId.current = null;
      }
    };

    if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(tick);
    return () => {
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
      rafId.current = null;
    };
    // `display` is intentionally excluded — we read it as a snapshot
    // at the start of each tween, not as a reactive dep.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, durationMs]);

  return (
    <Text {...rest} style={style}>
      {format(display)}
    </Text>
  );
}
