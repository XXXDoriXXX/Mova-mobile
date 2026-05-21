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
};

/**
 * Circular progress arc — used on the home "voice training" card and
 * billing "free minutes used" indicator. Renders a single SVG so it
 * stays crisp on every density without a bitmap mask.
 */
export function RingProgress({
  size = 52,
  value,
  track,
  stroke,
  width = 6,
}: Props) {
  const theme = useTheme();
  const trackColor = track ?? "rgba(255,255,255,0.18)";
  const strokeColor = stroke ?? theme.colors.accent;

  const clamped = Math.max(0, Math.min(1, value));
  const r = (size - width) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - clamped);

  return (
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
  );
}
