import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  StyleSheet,
  View,
} from "react-native";

import { Text } from "./Text";
import { useTheme } from "@/theme/ThemeProvider";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export type ButtonProps = Omit<PressableProps, "style" | "children"> & {
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
  fullWidth?: boolean;
};

export function Button({
  label,
  variant = "primary",
  loading = false,
  fullWidth = true,
  disabled,
  ...rest
}: ButtonProps) {
  const theme = useTheme();

  const isDisabled = disabled || loading;

  const bg = (pressed: boolean) => {
    if (variant === "primary") {
      return pressed ? theme.colors.primaryPressed : theme.colors.primary;
    }
    if (variant === "danger") {
      return pressed ? theme.colors.primaryPressed : theme.colors.danger;
    }
    if (variant === "secondary") {
      return pressed ? theme.colors.surfaceMuted : theme.colors.surface;
    }
    return "transparent";
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: bg(pressed),
          borderColor:
            variant === "ghost" ? theme.colors.border : "transparent",
          borderWidth: variant === "ghost" ? 1 : 0,
          borderRadius: theme.radii.md,
          opacity: isDisabled ? 0.6 : 1,
          alignSelf: fullWidth ? "stretch" : "auto",
        },
      ]}
      {...rest}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator
            color={
              variant === "primary" || variant === "danger"
                ? theme.colors.primaryText
                : theme.colors.text
            }
          />
        ) : (
          <Text
            variant="button"
            style={{
              color:
                variant === "primary" || variant === "danger"
                  ? theme.colors.primaryText
                  : variant === "secondary"
                    ? theme.colors.text
                    : theme.colors.link,
            }}
          >
            {label}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    paddingHorizontal: 20,
    paddingVertical: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  content: { flexDirection: "row", alignItems: "center", gap: 8 },
});
