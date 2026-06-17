import { forwardRef, useEffect, useRef, useState, type ReactNode } from "react";
import {
  StyleSheet,
  TextInput,
  type TextInputProps,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { Text } from "./Text";
import { triggerHaptic } from "@/utils/haptics";
import { useTheme } from "@/theme/ThemeProvider";

// Canonical "invalid input" feedback: a short horizontal shake when an error
// first appears, paired with a warning haptic. Damped so it nudges, not flails.
function useErrorShake(error: string | undefined) {
  const shake = useSharedValue(0);
  const prev = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (error && error !== prev.current) {
      triggerHaptic("warning");
      shake.value = withSequence(
        withTiming(-7, { duration: 45 }),
        withTiming(7, { duration: 45 }),
        withTiming(-5, { duration: 40 }),
        withTiming(5, { duration: 40 }),
        withTiming(0, { duration: 40 }),
      );
    }
    prev.current = error;
  }, [error, shake]);
  return useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));
}

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
    const shakeStyle = useErrorShake(error);

    if (variant === "card") {
      const borderColor = error
        ? theme.colors.danger
        : focused
          ? theme.colors.text
          : theme.colors.border;
      return (
        <View style={styles.wrapper}>
          <Animated.View
            style={[
              {
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
              },
              shakeStyle,
            ]}
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
          </Animated.View>
          {error ? (
            <Animated.View entering={FadeIn.duration(180)}>
              <Text variant="caption" color="danger" style={{ marginTop: 6 }}>
                {error}
              </Text>
            </Animated.View>
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
        <Animated.View style={shakeStyle}>
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
        </Animated.View>
        {error ? (
          <Animated.View entering={FadeIn.duration(180)}>
            <Text variant="caption" color="danger" style={{ marginTop: 6 }}>
              {error}
            </Text>
          </Animated.View>
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
