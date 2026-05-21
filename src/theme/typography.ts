import type { TextStyle } from "react-native";

/**
 * Onest is the brand sans; JetBrains Mono is the brand mono (small-caps
 * labels, timers, counters). Each weight maps to a distinct PostScript
 * family name — React Native resolves `fontFamily` to the bundled face,
 * so we cannot rely on `fontWeight` alone for selecting weight.
 *
 * Prefer the `Text` component's `weight` / `mono` / `italic` props over
 * wiring `fontFamily` by hand at call sites.
 */
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
  | "display"        // hero — 50px, used sparingly
  | "displayLarge"   // legacy alias kept for back-compat — also 50px now
  | "title"          // section headline — 26px
  | "subtitle"       // card title — 17px
  | "body"           // default — 15px
  | "bodyLarge"      // emphasised body — 17px
  | "caption"        // supporting copy — 12px
  | "label"          // mono uppercase tag — 10px
  | "labelLarge"     // mono caption — 12px
  | "button"         // CTA inside button — 14px bold
  | "numeric";       // timer / metric — 28px mono

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
