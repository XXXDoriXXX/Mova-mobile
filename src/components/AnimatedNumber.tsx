import { useEffect, useRef, useState } from "react";
import type { TextStyle } from "react-native";

import { Text, type TextProps } from "./Text";

type Props = Omit<TextProps, "children"> & {
  value: number;
  format?: (n: number) => string;
  durationMs?: number;
  style?: TextStyle | TextStyle[];
};

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
    from.current = display;
    startedAt.current = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startedAt.current;
      const t = Math.min(1, elapsed / Math.max(1, durationMs));
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, durationMs]);

  return (
    <Text {...rest} style={style}>
      {format(display)}
    </Text>
  );
}
