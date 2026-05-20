import { Text as RNText, type TextProps as RNTextProps } from "react-native";

import { useTheme } from "@/theme/ThemeProvider";
import type { TypographyVariant } from "@/theme/typography";

export type TextProps = RNTextProps & {
  variant?: TypographyVariant;
  color?: "text" | "textMuted" | "primary" | "danger" | "success" | "warning";
  align?: "left" | "center" | "right";
};

export function Text({
  variant = "body",
  color = "text",
  align,
  style,
  ...rest
}: TextProps) {
  const theme = useTheme();
  return (
    <RNText
      {...rest}
      style={[
        theme.typography[variant],
        { color: theme.colors[color], textAlign: align },
        style,
      ]}
    />
  );
}
