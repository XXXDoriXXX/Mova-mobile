import { forwardRef, useState } from "react";
import {
  StyleSheet,
  TextInput,
  type TextInputProps,
  View,
} from "react-native";

import { Text } from "./Text";
import { useTheme } from "@/theme/ThemeProvider";

export type TextFieldProps = Omit<TextInputProps, "style"> & {
  label?: string;
  error?: string;
  helperText?: string;
};

/**
 * Form text field. Renders as a soft beige pill — borderless until
 * focus, then promoted to an ink hairline. Error state paints a red
 * hairline regardless of focus. Matches the in-call composer footprint
 * used by `CallSettingsDrawer`.
 */
export const TextField = forwardRef<TextInput, TextFieldProps>(
  function TextField(
    { label, error, helperText, onFocus, onBlur, ...rest },
    ref,
  ) {
    const theme = useTheme();
    const [focused, setFocused] = useState(false);

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
          <Text
            variant="caption"
            color="danger"
            style={{ marginTop: 6 }}
          >
            {error}
          </Text>
        ) : helperText ? (
          <Text
            variant="caption"
            color="textMuted"
            style={{ marginTop: 6 }}
          >
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
