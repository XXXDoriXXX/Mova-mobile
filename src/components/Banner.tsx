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

const TONE_BG: Record<BannerTone, string> = {
  info: "rgba(15,58,46,0.06)",
  success: "rgba(31,138,76,0.10)",
  warning: "rgba(199,119,0,0.10)",
  danger: "rgba(229,72,61,0.08)",
};

const TONE_TEXT: Record<BannerTone, keyof import("@/theme/colors").Palette> = {
  info: "text",
  success: "success",
  warning: "warning",
  danger: "danger",
};

export function Banner({ tone = "info", title, message, action }: Props) {
  const theme = useTheme();
  return (
    <View
      style={{
        padding: theme.spacing.lg,
        borderRadius: theme.radii.lg,
        backgroundColor: TONE_BG[tone],
        gap: theme.spacing.sm,
      }}
    >
      {title ? (
        <Text variant="subtitle" style={{ color: theme.colors[TONE_TEXT[tone]] }}>
          {title}
        </Text>
      ) : null}
      <Text variant="body" color={tone === "info" ? "text" : (TONE_TEXT[tone] as never)}>
        {message}
      </Text>
      {action}
    </View>
  );
}
