import { forwardRef, useState, type ReactNode } from "react";
import {
  StyleSheet,
  TextInput,
  type TextInputProps,
  View,
} from "react-native";

import { Text } from "./Text";
import { useTheme } from "@/theme/ThemeProvider";

export type TextFieldVariant = "filled" | "card";

export type TextFieldProps = Omit<TextInputProps, "style"> & {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: TextFieldVariant;
  rightSlot?: ReactNode;
};

export const TextField = forwardRef<TextInput, TextFieldProps>(
  function TextField(
    {
      label,
      error,
      helperText,
      variant = "filled",
      rightSlot,
      onFocus,
      onBlur,
      ...rest
    },
    ref,
  ) {
    const theme = useTheme();
    const [focused, setFocused] = useState(false);

    if (variant === "card") {
      const borderColor = error
        ? theme.colors.danger
        : focused
          ? theme.colors.text
          : theme.colors.border;
      return (
        <View style={styles.wrapper}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radii.lg,
              borderWidth: focused || error ? 1.5 : 1,
              borderColor,
              paddingHorizontal: 18,
              paddingVertical: 12,
              gap: 12,
              minHeight: 64,
            }}
          >
            <View style={{ flex: 1, gap: 2 }}>
              {label ? (
                <Text
                  variant="caption"
                  color="textMuted"
                  style={{ textTransform: "uppercase", letterSpacing: 0.6 }}
                >
                  {label}
                </Text>
              ) : null}
              <TextInput
                ref={ref}
                placeholderTextColor={theme.colors.textMuted}
                style={[
                  theme.typography.bodyLarge,
                  { color: theme.colors.text, padding: 0, margin: 0, minHeight: 24 },
                ]}
                onFocus={(e) => {
                  setFocused(true);
                  onFocus?.(e);
                }}
                onBlur={(e) => {
                  setFocused(false);
                  onBlur?.(e);
                }}
                {...rest}
              />
            </View>
            {rightSlot ? <View>{rightSlot}</View> : null}
          </View>
          {error ? (
            <Text variant="caption" color="danger" style={{ marginTop: 6 }}>
              {error}
            </Text>
          ) : helperText ? (
            <Text variant="caption" color="textMuted" style={{ marginTop: 6 }}>
              {helperText}
            </Text>
          ) : null}
        </View>
      );
    }

    const borderColor = error
      ? theme.colors.danger
      : focused
        ? theme.colors.text
        : "transparent";
    const borderWidth = error || focused ? 1.5 : 0;

    return (
      <View style={styles.wrapper}>
        {label ? (
          <Text
            variant="label"
            color="textMuted"
            style={{ marginBottom: 6, textTransform: "uppercase" }}
          >
            {label}
          </Text>
        ) : null}
        <TextInput
          ref={ref}
          placeholderTextColor={theme.colors.textMuted}
          style={[
            styles.input,
            theme.typography.bodyLarge,
            {
              backgroundColor: theme.colors.surfaceMuted,
              color: theme.colors.text,
              borderColor,
              borderWidth,
              borderRadius: theme.radii.lg,
            },
          ]}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />
        {error ? (
          <Text variant="caption" color="danger" style={{ marginTop: 6 }}>
            {error}
          </Text>
        ) : helperText ? (
          <Text variant="caption" color="textMuted" style={{ marginTop: 6 }}>
            {helperText}
          </Text>
        ) : null}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  wrapper: { width: "100%" },
  input: {
    minHeight: 54,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
});
