import { forwardRef } from "react";
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
  function TextField({ label, error, helperText, ...rest }, ref) {
    const theme = useTheme();
    const borderColor = error ? theme.colors.danger : theme.colors.border;

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
              borderRadius: theme.radii.md,
            },
          ]}
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
    borderWidth: 1,
  },
});
