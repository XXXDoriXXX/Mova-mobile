import type { ReactNode } from "react";
import { View, type ViewProps } from "react-native";

import { useTheme } from "@/theme/ThemeProvider";

export type CardTone = "surface" | "muted" | "inverse" | "accent";

type CardProps = ViewProps & {
  children: ReactNode;
  tone?: CardTone;
  padded?: boolean;
  radius?: number;
};

export function Card({
  children,
  tone = "surface",
  padded = true,
  radius,
  style,
  ...rest
}: CardProps) {
  const theme = useTheme();
  const bg = (() => {
    switch (tone) {
      case "inverse": return theme.colors.surfaceInverse;
      case "accent":  return theme.colors.surfaceAccent;
      case "muted":   return theme.colors.surfaceMuted;
      default:        return theme.colors.surface;
    }
  })();

  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: bg,
          borderRadius: radius ?? theme.radii.xxl,
          padding: padded ? theme.spacing.lg : 0,
          borderWidth: tone === "surface" ? 1 : 0,
          borderColor: theme.colors.border,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
