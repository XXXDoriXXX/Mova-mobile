import { Pressable, StyleSheet, View, type PressableProps } from "react-native";

import { Text } from "./Text";
import { useTheme } from "@/theme/ThemeProvider";

export type ChipProps = Omit<PressableProps, "style" | "children"> & {
  label: string;
  selected?: boolean;
  tone?: "neutral" | "primary" | "danger";
  trailing?: React.ReactNode;
};

export function Chip({
  label,
  selected = false,
  tone = "neutral",
  trailing,
  disabled,
  ...rest
}: ChipProps) {
  const theme = useTheme();
  const isPrimary = tone === "primary" || selected;
  const isDanger = tone === "danger";

  const background = isPrimary
    ? theme.colors.primary
    : isDanger
      ? theme.colors.danger
      : theme.colors.surface;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled: !!disabled }}
      disabled={disabled}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: background,
          borderColor: theme.colors.border,
          borderRadius: theme.radii.pill,
          opacity: disabled ? 0.6 : pressed ? 0.85 : 1,
        },
      ]}
      {...rest}
    >
      <View style={styles.row}>
        <Text
          variant="label"
          style={{
            color:
              isPrimary || isDanger
                ? theme.colors.primaryText
                : theme.colors.text,
          }}
        >
          {label}
        </Text>
        {trailing}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    justifyContent: "center",
  },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
});
