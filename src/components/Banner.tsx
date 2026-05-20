import type { ReactNode } from "react";
import { View } from "react-native";

import { Text } from "./Text";
import { useTheme } from "@/theme/ThemeProvider";

export type BannerTone = "info" | "success" | "warning" | "danger";

type Props = {
  tone?: BannerTone;
  title?: string;
  message: string;
  action?: ReactNode;
};

const TONE_COLOR: Record<BannerTone, keyof import("@/theme/colors").Palette> = {
  info: "primary",
  success: "success",
  warning: "warning",
  danger: "danger",
};

export function Banner({ tone = "info", title, message, action }: Props) {
  const theme = useTheme();
  const colorKey = TONE_COLOR[tone];
  return (
    <View
      style={{
        padding: theme.spacing.lg,
        borderRadius: theme.radii.md,
        borderWidth: 1,
        borderColor: theme.colors[colorKey],
        backgroundColor: theme.colors.surface,
        gap: theme.spacing.sm,
      }}
    >
      {title ? (
        <Text variant="subtitle" style={{ color: theme.colors[colorKey] }}>
          {title}
        </Text>
      ) : null}
      <Text variant="body">{message}</Text>
      {action}
    </View>
  );
}
