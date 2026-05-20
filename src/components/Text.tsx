import { useMemo } from "react";
import {
  Text as RNText,
  StyleSheet,
  type TextProps as RNTextProps,
  type TextStyle,
} from "react-native";

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

  // Scale font size + line height by the user-chosen accessibility multiplier.
  const scaled = useMemo<TextStyle>(() => {
    const base = theme.typography[variant];
    const scale = theme.fontScale;
    const fontSize =
      typeof base.fontSize === "number"
        ? Math.round(base.fontSize * scale)
        : base.fontSize;
    const lineHeight =
      typeof base.lineHeight === "number"
        ? Math.round(base.lineHeight * scale)
        : base.lineHeight;
    return {
      ...base,
      fontSize: fontSize as TextStyle["fontSize"],
      lineHeight: lineHeight as TextStyle["lineHeight"],
    };
  }, [theme.typography, variant, theme.fontScale]);

  return (
    <RNText
      {...rest}
      style={StyleSheet.flatten([
        scaled,
        { color: theme.colors[color], textAlign: align },
        style,
      ])}
    />
  );
}
