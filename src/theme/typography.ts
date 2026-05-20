import type { TextStyle } from "react-native";

export type TypographyVariant =
  | "displayLarge"
  | "title"
  | "subtitle"
  | "body"
  | "bodyLarge"
  | "caption"
  | "label"
  | "button";

export const typography: Record<TypographyVariant, TextStyle> = {
  displayLarge: { fontSize: 34, lineHeight: 40, fontWeight: "700" },
  title: { fontSize: 24, lineHeight: 30, fontWeight: "700" },
  subtitle: { fontSize: 20, lineHeight: 26, fontWeight: "600" },
  body: { fontSize: 18, lineHeight: 26, fontWeight: "400" },
  bodyLarge: { fontSize: 20, lineHeight: 28, fontWeight: "400" },
  caption: { fontSize: 14, lineHeight: 20, fontWeight: "400" },
  label: { fontSize: 14, lineHeight: 18, fontWeight: "600" },
  button: { fontSize: 18, lineHeight: 22, fontWeight: "600" },
};
