import type { ReactNode } from "react";
import {
  ActivityIndicator,
  type PressableProps,
  StyleSheet,
  View,
} from "react-native";

import { PressableScale } from "./PressableScale";
import { Text } from "./Text";
import { useTheme } from "@/theme/ThemeProvider";
import type { HapticKind } from "@/utils/haptics";

export type ButtonVariant =
  | "primary"
  | "accent"
  | "secondary"
  | "ghost"
  | "danger";

export type ButtonSize = "md" | "lg";

export type ButtonProps = Omit<PressableProps, "style" | "children"> & {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
  haptic?: HapticKind | null;
};

export function Button({
  label,
  variant = "primary",
  size = "lg",
  loading = false,
  fullWidth = true,
  leading,
  trailing,
  disabled,
  haptic,
  ...rest
}: ButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const bg = (pressed: boolean): string => {
    if (variant === "primary")   return pressed ? theme.colors.primaryPressed : theme.colors.primary;
    if (variant === "accent")    return pressed ? theme.colors.accentPressed  : theme.colors.accent;
    if (variant === "danger")    return pressed ? theme.colors.dangerPressed  : theme.colors.danger;
    if (variant === "secondary") return pressed ? theme.colors.surfaceMuted   : theme.colors.surface;
    return pressed ? theme.colors.surfaceMuted : "transparent";
  };

  const fg: string = (() => {
    if (variant === "primary" || variant === "danger") return theme.colors.primaryText;
    if (variant === "accent") return theme.colors.accentText;
    return theme.colors.text;
  })();

  const borderColor: string =
    variant === "secondary" || variant === "ghost" ? theme.colors.border : "transparent";

  const sizing = size === "lg"
    ? { minHeight: 54, paddingHorizontal: 22, paddingVertical: 14 }
    : { minHeight: 44, paddingHorizontal: 18, paddingVertical: 10 };

  const resolvedHaptic: HapticKind | null = haptic === undefined
    ? (variant === "danger" ? "warning"
       : variant === "accent" ? "selection"
       : "light")
    : haptic;

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      haptic={isDisabled ? null : resolvedHaptic}
      scaleTo={0.97}
      style={{
        ...styles.base,
        ...sizing,
        backgroundColor: bg(false),
        borderColor,
        borderWidth: borderColor === "transparent" ? 0 : 1,
        borderRadius: theme.radii.pill,
        opacity: isDisabled ? 0.55 : 1,
        alignSelf: fullWidth ? "stretch" : "auto",
      }}
      {...rest}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={fg} />
        ) : (
          <>
            {leading}
            <Text variant="button" style={{ color: fg }}>
              {label}
            </Text>
            {trailing}
          </>
        )}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: { justifyContent: "center", alignItems: "center" },
  content: { flexDirection: "row", alignItems: "center", gap: 8 },
});
