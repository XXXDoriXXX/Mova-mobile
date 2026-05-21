/**
 * MOVA palette — warm-white canvas with lime + forest accent.
 *
 * Tokens are semantic where the role is unambiguous, brand-named where the
 * character matters more than the function (`accent`, `inverse`). Keys named
 * after the old design (`primary`, `surface`, `border`, …) are kept so the
 * existing call-sites do not need to change — they just point at the new
 * values.
 */
export type Palette = {
  // Surfaces
  background: string;       // page background (warm white)
  surface: string;          // default card / pill (white)
  surfaceMuted: string;     // chip background (beige)
  surfaceInverse: string;   // forest card
  surfaceAccent: string;    // lime accent card

  // Strokes
  border: string;           // hairline (ink with low alpha)
  borderStrong: string;     // dashed / emphasized stroke

  // Text
  text: string;             // primary ink
  textMuted: string;
  textInverse: string;      // white text (used inside dark cards)
  textOnAccent: string;     // text on lime (still ink)
  textOnInverse: string;    // text on forest (white)

  // CTA
  primary: string;          // ink — default solid CTA
  primaryPressed: string;
  primaryText: string;      // white
  accent: string;           // lime — highlight / accent CTA
  accentPressed: string;
  accentText: string;       // ink

  // Brand surfaces
  inverse: string;          // forest
  inverseLight: string;     // transparent white on forest

  // Avatar bgs (intentionally pastel)
  avatarPeach: string;
  avatarSage: string;
  avatarLavender: string;
  avatarSky: string;
  avatarSand: string;

  // States
  danger: string;
  dangerPressed: string;
  dangerSoft: string;
  success: string;
  warning: string;
  link: string;
  overlay: string;
};

export const palette: Palette = {
  background: "#FAFAF6",
  surface: "#FFFFFF",
  surfaceMuted: "#F1F1EB",
  surfaceInverse: "#0F3A2E",
  surfaceAccent: "#D7F25C",

  border: "rgba(10,10,10,0.08)",
  borderStrong: "rgba(10,10,10,0.33)",

  text: "#0A0A0A",
  textMuted: "#8A8A85",
  textInverse: "#FFFFFF",
  textOnAccent: "#0A0A0A",
  textOnInverse: "#FFFFFF",

  primary: "#0A0A0A",
  primaryPressed: "#1F1F1F",
  primaryText: "#FAFAF6",
  accent: "#D7F25C",
  accentPressed: "#C5E04A",
  accentText: "#0A0A0A",

  inverse: "#0F3A2E",
  inverseLight: "rgba(255,255,255,0.10)",

  avatarPeach: "#E8A582",
  avatarSage: "#B8D8C5",
  avatarLavender: "#D8C8FF",
  avatarSky: "#BFD4F2",
  avatarSand: "#F2C9A0",

  danger: "#E5483D",
  dangerPressed: "#C93B31",
  dangerSoft: "#FBE4E2",
  success: "#1F8A4C",
  warning: "#C77700",
  link: "#0F3A2E",
  overlay: "rgba(10,10,10,0.45)",
};

// Old code imports `lightPalette`; keep the alias so we don't have to chase
// every usage to flip the variable name.
export const lightPalette = palette;
