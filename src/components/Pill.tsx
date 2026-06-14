import type { ReactNode } from "react";
import { View, type ViewProps } from "react-native";

import { Text } from "./Text";
import { useTheme } from "@/theme/ThemeProvider";

export type PillTone = "ink" | "surface" | "accent" | "inverse" | "danger";

type PillProps = ViewProps & {
  label: string;
  tone?: PillTone;
  leading?: ReactNode;
  trailing?: ReactNode;
};

export function Pill({ label, tone = "ink", leading, trailing, style, ...rest }: PillProps) {
  const theme = useTheme();
  const { bg, fg } = (() => {
    switch (tone) {
      case "ink":     return { bg: theme.colors.primary,        fg: theme.colors.primaryText };
      case "accent":  return { bg: theme.colors.accent,         fg: theme.colors.accentText };
      case "inverse": return { bg: theme.colors.surfaceInverse, fg: theme.colors.textOnInverse };
      case "danger":  return { bg: theme.colors.danger,         fg: theme.colors.primaryText };
      default:        return { bg: theme.colors.surface,        fg: theme.colors.text };
    }
  })();
  return (
    <View
      {...rest}
      style={[
        {
          alignSelf: "flex-start",
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          backgroundColor: bg,
          paddingHorizontal: 14,
          paddingVertical: 7,
          borderRadius: theme.radii.pill,
        },
        style,
      ]}
    >
      {leading}
      <Text variant="caption" weight="semibold" style={{ color: fg }}>
        {label}
      </Text>
      {trailing}
    </View>
  );
}
