import type { ReactNode } from "react";
import { Pressable, type PressableProps, View } from "react-native";

import { useTheme } from "@/theme/ThemeProvider";

export type IconButtonTone =
  | "surface"   // white card with hairline border (default)
  | "ink"       // ink filled, white icon
  | "accent"    // lime filled, ink icon
  | "inverse"   // forest filled, white icon
  | "muted"     // beige chip background
  | "danger"    // red filled, white icon (hangup)
  | "ghost";    // transparent over coloured surface

export type IconButtonProps = Omit<PressableProps, "style" | "children"> & {
  /** The icon node — typically `<Ionicons />` or a custom SVG. */
  children: ReactNode;
  size?: number;
  tone?: IconButtonTone;
  shadow?: boolean;
};

/**
 * Round button used for header controls (back, brand, hangup) and the
 * `→` affordances on cards. Tone maps to the brand palette; pick the
 * one that contrasts with the surface it sits on.
 */
export function IconButton({
  children,
  size = 42,
  tone = "surface",
  shadow = false,
  disabled,
  ...rest
}: IconButtonProps) {
  const theme = useTheme();

  const { bg, border } = (() => {
    switch (tone) {
      case "ink":     return { bg: theme.colors.primary,        border: "transparent" };
      case "accent":  return { bg: theme.colors.accent,         border: "transparent" };
      case "inverse": return { bg: theme.colors.surfaceInverse, border: "transparent" };
      case "muted":   return { bg: theme.colors.surfaceMuted,   border: "transparent" };
      case "danger":  return { bg: theme.colors.danger,         border: "transparent" };
      case "ghost":   return { bg: theme.colors.inverseLight,   border: "transparent" };
      default:        return { bg: theme.colors.surface,        border: theme.colors.border };
    }
  })();

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
          borderWidth: border === "transparent" ? 0 : 1,
          borderColor: border,
          alignItems: "center",
          justifyContent: "center",
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
        shadow && {
          shadowColor: theme.colors.text,
          shadowOpacity: 0.18,
          shadowOffset: { width: 0, height: 6 },
          shadowRadius: 12,
          elevation: 4,
        },
      ]}
      {...rest}
    >
      <View>{children}</View>
    </Pressable>
  );
}
