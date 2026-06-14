import type { ReactNode } from "react";
import { View } from "react-native";
import Svg, { Circle } from "react-native-svg";

import { useTheme } from "@/theme/ThemeProvider";

type Props = {
  size?: number;
  value: number;
  track?: string;
  stroke?: string;
  width?: number;
  children?: ReactNode;
};

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
