export type Palette = {
  background: string;
  surface: string;
  surfaceMuted: string;
  surfaceInverse: string;
  surfaceAccent: string;

  border: string;
  borderStrong: string;

  text: string;
  textMuted: string;
  textInverse: string;
  textOnAccent: string;
  textOnInverse: string;

  primary: string;
  primaryPressed: string;
  primaryText: string;
  accent: string;
  accentPressed: string;
  accentText: string;

  inverse: string;
  inverseLight: string;

  avatarPeach: string;
  avatarSage: string;
  avatarLavender: string;
  avatarSky: string;
  avatarSand: string;

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

export const lightPalette = palette;
