import type { ReactNode } from "react";
import { View, type ViewProps } from "react-native";

import { useTheme } from "@/theme/ThemeProvider";

export type CardTone = "surface" | "muted" | "inverse" | "accent";

type CardProps = ViewProps & {
  children: ReactNode;
  /** Visual surface. Defaults to white card with hairline border. */
  tone?: CardTone;
  padded?: boolean;
  /** Override the default radius. */
  radius?: number;
};

/**
 * Surface primitive. The default `surface` tone is white with a faint
 * ink border; `inverse` is the dark forest card; `accent` is the lime
 * card; `muted` is the beige chip background. Border is suppressed on
 * coloured tones — borders only make sense on the white surface.
 */
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
