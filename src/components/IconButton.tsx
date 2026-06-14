import type { ReactNode } from "react";
import { View, type PressableProps, type ViewStyle } from "react-native";

import { PressableScale } from "./PressableScale";
import { useTheme } from "@/theme/ThemeProvider";
import type { HapticKind } from "@/utils/haptics";

export type IconButtonTone =
  | "surface"
  | "ink"
  | "accent"
  | "inverse"
  | "muted"
  | "danger"
  | "ghost";

export type IconButtonProps = Omit<PressableProps, "style" | "children"> & {
  children: ReactNode;
  size?: number;
  tone?: IconButtonTone;
  shadow?: boolean;
  haptic?: HapticKind | null;
};

export function IconButton({
  children,
  size = 42,
  tone = "surface",
  shadow = false,
  haptic,
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

  const resolvedHaptic: HapticKind | null = haptic === undefined
    ? (tone === "danger" ? "warning"
       : tone === "accent" ? "selection"
       : "light")
    : haptic;

  const baseStyle: ViewStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: bg,
    borderWidth: border === "transparent" ? 0 : 1,
    borderColor: border,
    alignItems: "center",
    justifyContent: "center",
    opacity: disabled ? 0.5 : 1,
  };

  const shadowStyle: ViewStyle | null = shadow
    ? {
        shadowColor: theme.colors.text,
        shadowOpacity: 0.18,
        shadowOffset: { width: 0, height: 6 },
        shadowRadius: 12,
        elevation: 4,
      }
    : null;

  return (
    <PressableScale
      accessibilityRole="button"
      disabled={disabled}
      haptic={disabled ? null : resolvedHaptic}
      scaleTo={0.9}
      style={shadowStyle ? [baseStyle, shadowStyle] : baseStyle}
      {...rest}
    >
      <View>{children}</View>
    </PressableScale>
  );
}
