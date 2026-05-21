import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  StyleSheet,
  View,
} from "react-native";

import { Text } from "./Text";
import { useTheme } from "@/theme/ThemeProvider";

export type ButtonVariant =
  | "primary"   // ink solid pill — default CTA
  | "accent"    // lime solid pill — highlight CTA
  | "secondary" // white card pill with ink border
  | "ghost"     // transparent + ink text
  | "danger";   // red pill

export type ButtonSize = "md" | "lg";

export type ButtonProps = Omit<PressableProps, "style" | "children"> & {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  /** Optional leading icon (an `<Ionicons>` or any node). */
  leading?: ReactNode;
  /** Optional trailing icon. Useful for "→" affordances. */
  trailing?: ReactNode;
};

/**
 * Primary CTA primitive. Variants map 1:1 to the brand palette: `primary`
 * is the ink pill, `accent` the lime pill, `secondary` the white card with
 * hairline border. Size `lg` is the home-screen "Start call" footprint;
 * `md` is the in-form / in-card footprint.
 */
export function Button({
  label,
  variant = "primary",
  size = "lg",
  loading = false,
  fullWidth = true,
  leading,
  trailing,
  disabled,
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

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        sizing,
        {
          backgroundColor: bg(pressed),
          borderColor,
          borderWidth: borderColor === "transparent" ? 0 : 1,
          borderRadius: theme.radii.pill,
          opacity: isDisabled ? 0.55 : 1,
          alignSelf: fullWidth ? "stretch" : "auto",
        },
      ]}
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
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { justifyContent: "center", alignItems: "center" },
  content: { flexDirection: "row", alignItems: "center", gap: 8 },
});
