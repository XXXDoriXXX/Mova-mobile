import { useMemo } from "react";
import {
  Text as RNText,
  StyleSheet,
  type TextProps as RNTextProps,
  type TextStyle,
} from "react-native";

import { useTheme } from "@/theme/ThemeProvider";
import { familyFor, type FontWeight, type TypographyVariant } from "@/theme/typography";

export type TextColor =
  | "text"
  | "textMuted"
  | "textInverse"
  | "textOnAccent"
  | "textOnInverse"
  | "accent"
  | "accentText"
  | "primary"
  | "danger"
  | "success"
  | "warning";

export type TextProps = RNTextProps & {
  variant?: TypographyVariant;
  weight?: FontWeight;
  italic?: boolean;
  color?: TextColor;
  align?: "left" | "center" | "right";
};

export function Text({
  variant = "body",
  weight,
  italic,
  color = "text",
  align,
  style,
  ...rest
}: TextProps) {
  const theme = useTheme();

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
      ...(weight ? { fontFamily: familyFor(weight) } : null),
      ...(italic ? { fontStyle: "italic" } : null),
    };
  }, [theme.typography, theme.fontScale, variant, weight, italic]);

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
