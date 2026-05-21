import type { ReactNode } from "react";
import { View } from "react-native";
import Svg, { Circle } from "react-native-svg";

import { useTheme } from "@/theme/ThemeProvider";

type Props = {
  /** Diameter in dp. */
  size?: number;
  /** 0 → 1. Clamped. */
  value: number;
  /** Track (unfilled) colour. Defaults to a subtle white tint suitable
   *  for the dark forest card; pass a colour for use on light surfaces. */
  track?: string;
  /** Stroke colour for the filled arc. Defaults to lime. */
  stroke?: string;
  /** Stroke width in dp. */
  width?: number;
  /** Optional content rendered absolutely-positioned at the centre of the
   *  ring. Used by BalanceWidget to put the % / minutes-left label inside
   *  the arc so the indicator carries its own legend. */
  children?: ReactNode;
};

/**
 * Circular progress arc — used on the home balance card and billing
 * indicators. Renders a single SVG so it stays crisp on every density
 * without a bitmap mask. When `children` are supplied, they're centred
 * inside the ring on a transparent overlay layer.
 */
export function RingProgress({
  size = 52,
  value,
  track,
  stroke,
  width = 6,
  children,
}: Props) {
  const theme = useTheme();
  const trackColor = track ?? "rgba(255,255,255,0.18)";
  const strokeColor = stroke ?? theme.colors.accent;

  const clamped = Math.max(0, Math.min(1, value));
  const r = (size - width) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - clamped);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={trackColor}
          strokeWidth={width}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={strokeColor}
          strokeWidth={width}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {children ? (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {children}
        </View>
      ) : null}
    </View>
  );
}
