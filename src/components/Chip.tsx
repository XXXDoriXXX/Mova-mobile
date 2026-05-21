import type { ReactNode } from "react";
import { Pressable, StyleSheet, View, type PressableProps } from "react-native";

import { Text } from "./Text";
import { useTheme } from "@/theme/ThemeProvider";

export type ChipTone = "neutral" | "accent" | "danger";

export type ChipProps = Omit<PressableProps, "style" | "children"> & {
  label: string;
  /** Active state — flips the chip to the ink/lime/red filled variant. */
  selected?: boolean;
  /** Filled background when selected. `accent` paints lime; `danger` red. */
  tone?: ChipTone;
  leading?: ReactNode;
  trailing?: ReactNode;
};

/**
 * Pill-shaped tag. Inactive = white card with hairline border, active =
 * ink fill with inverse text (or lime/red when `tone` overrides). Use
 * for filters, quick replies, multi-select tags.
 */
export function Chip({
  label,
  selected = false,
  tone = "neutral",
  leading,
  trailing,
  disabled,
  ...rest
}: ChipProps) {
  const theme = useTheme();

  const { bg, fg, border } = (() => {
    if (!selected) {
      return {
        bg: theme.colors.surface,
        fg: theme.colors.text,
        border: theme.colors.border,
      };
    }
    if (tone === "accent") {
      return { bg: theme.colors.accent, fg: theme.colors.accentText, border: "transparent" };
    }
    if (tone === "danger") {
      return { bg: theme.colors.danger, fg: theme.colors.primaryText, border: "transparent" };
    }
    return { bg: theme.colors.primary, fg: theme.colors.primaryText, border: "transparent" };
  })();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled: !!disabled }}
      disabled={disabled}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: bg,
          borderColor: border,
          borderWidth: border === "transparent" ? 0 : 1,
          borderRadius: theme.radii.pill,
          opacity: disabled ? 0.5 : pressed ? 0.88 : 1,
        },
      ]}
      {...rest}
    >
      <View style={styles.row}>
        {leading}
        <Text variant="button" style={{ color: fg }}>
          {label}
        </Text>
        {trailing}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: "center",
  },
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
});
