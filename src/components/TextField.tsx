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

export const TextField = forwardRef<TextInput, TextFieldProps>(
  function TextField(
    { label, error, helperText, onFocus, onBlur, ...rest },
    ref,
  ) {
    const theme = useTheme();
    const [focused, setFocused] = useState(false);
    // Visual states (in order of priority):
    //  - error      → red 1px border
    //  - focused    → primary 2px border (no layout shift; we compensate with
    //                 negative-margin? actually just keep padding constant by
    //                 letting RN render an extra pixel — acceptable)
    //  - default    → muted 1px border
    const borderColor = error
      ? theme.colors.danger
      : focused
        ? theme.colors.primary
        : theme.colors.border;
    const borderWidth = focused && !error ? 2 : 1;

    return (
      <View style={styles.wrapper}>
        {label ? (
          <Text variant="label" style={{ marginBottom: theme.spacing.xs }}>
            {label}
          </Text>
        ) : null}
        <TextInput
          ref={ref}
          placeholderTextColor={theme.colors.textMuted}
          style={[
            styles.input,
            theme.typography.body,
            {
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
              borderColor,
              borderWidth,
              borderRadius: theme.radii.md,
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
            style={{ marginTop: theme.spacing.xs }}
          >
            {error}
          </Text>
        ) : helperText ? (
          <Text
            variant="caption"
            color="textMuted"
            style={{ marginTop: theme.spacing.xs }}
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
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
