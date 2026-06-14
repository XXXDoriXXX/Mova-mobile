import type { TextStyle } from "react-native";

export const FONT_FAMILY = {
  sansRegular: "Onest_400Regular",
  sansMedium: "Onest_500Medium",
  sansSemibold: "Onest_600SemiBold",
  sansBold: "Onest_700Bold",
  monoMedium: "JetBrainsMono_500Medium",
  monoSemibold: "JetBrainsMono_600SemiBold",
} as const;

export type FontWeight = "regular" | "medium" | "semibold" | "bold";

export function familyFor(weight: FontWeight): string {
  switch (weight) {
    case "regular":  return FONT_FAMILY.sansRegular;
    case "medium":   return FONT_FAMILY.sansMedium;
    case "semibold": return FONT_FAMILY.sansSemibold;
    case "bold":     return FONT_FAMILY.sansBold;
  }
}

export type TypographyVariant =
  | "display"
  | "displayLarge"
  | "title"
  | "subtitle"
  | "body"
  | "bodyLarge"
  | "caption"
  | "label"
  | "labelLarge"
  | "button"
  | "numeric";

type Variant = TextStyle & { fontFamily: string };

export const typography: Record<TypographyVariant, Variant> = {
  display: {
    fontSize: 50,
    lineHeight: 50,
    letterSpacing: -2.2,
    fontFamily: FONT_FAMILY.sansBold,
  },
  displayLarge: {
    fontSize: 50,
    lineHeight: 50,
    letterSpacing: -2.2,
    fontFamily: FONT_FAMILY.sansBold,
  },
  title: {
    fontSize: 26,
    lineHeight: 30,
    letterSpacing: -0.8,
    fontFamily: FONT_FAMILY.sansBold,
  },
  subtitle: {
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.2,
    fontFamily: FONT_FAMILY.sansBold,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: -0.1,
    fontFamily: FONT_FAMILY.sansMedium,
  },
  bodyLarge: {
    fontSize: 17,
    lineHeight: 24,
    letterSpacing: -0.2,
    fontFamily: FONT_FAMILY.sansMedium,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: FONT_FAMILY.sansMedium,
  },
  label: {
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1,
    fontFamily: FONT_FAMILY.monoSemibold,
  },
  labelLarge: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.8,
    fontFamily: FONT_FAMILY.monoSemibold,
  },
  button: {
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: -0.1,
    fontFamily: FONT_FAMILY.sansBold,
  },
  numeric: {
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.8,
    fontFamily: FONT_FAMILY.monoSemibold,
  },
};
