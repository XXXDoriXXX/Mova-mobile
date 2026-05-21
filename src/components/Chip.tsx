import type { ReactNode } from "react";
import { StyleSheet, View, type PressableProps } from "react-native";

import { PressableScale } from "./PressableScale";
import { Text } from "./Text";
import { useTheme } from "@/theme/ThemeProvider";
import type { HapticKind } from "@/utils/haptics";

export type ChipTone = "neutral" | "accent" | "danger";

export type ChipProps = Omit<PressableProps, "style" | "children"> & {
  label: string;
  /** Active state — flips the chip to the ink/lime/red filled variant. */
  selected?: boolean;
  /** Filled background when selected. `accent` paints lime; `danger` red. */
  tone?: ChipTone;
  leading?: ReactNode;
  trailing?: ReactNode;
  /** Override the haptic. Defaults to `selection` for filter chips and
   *  `light` for action chips — close to the iOS picker tick. */
  haptic?: HapticKind | null;
};

/**
 * Pill-shaped tag. Inactive = white card with hairline border, active =
 * ink fill with inverse text (or lime/red when `tone` overrides). Use
 * for filters, quick replies, multi-select tags. Tapping a chip fires a
 * `selection` haptic by default — the same tick iOS uses for pickers
 * so the user's wrist feels the choice landing.
 */
export function Chip({
  label,
  selected = false,
  tone = "neutral",
  leading,
  trailing,
  disabled,
  haptic = "selection",
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
    <PressableScale
      accessibilityRole="button"
      accessibilityState={{ selected, disabled: !!disabled }}
      disabled={disabled}
      haptic={disabled ? null : haptic}
      scaleTo={0.94}
      style={{
        ...styles.chip,
        backgroundColor: bg,
        borderColor: border,
        borderWidth: border === "transparent" ? 0 : 1,
        borderRadius: theme.radii.pill,
        opacity: disabled ? 0.5 : 1,
      }}
      {...rest}
    >
      <View style={styles.row}>
        {leading}
        <Text variant="button" style={{ color: fg }}>
          {label}
        </Text>
        {trailing}
      </View>
    </PressableScale>
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
