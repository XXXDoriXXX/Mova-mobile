export type Palette = {
  background: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  text: string;
  textMuted: string;
  textInverse: string;
  primary: string;
  primaryPressed: string;
  primaryText: string;
  danger: string;
  success: string;
  warning: string;
  link: string;
  overlay: string;
};

export const lightPalette: Palette = {
  background: "#FFFFFF",
  surface: "#F6F7F9",
  surfaceMuted: "#EEF0F4",
  border: "#D7DBE2",
  text: "#0E1116",
  textMuted: "#5B6573",
  textInverse: "#FFFFFF",
  primary: "#2D6CDF",
  primaryPressed: "#1F58C2",
  primaryText: "#FFFFFF",
  danger: "#D64545",
  success: "#1F8A4C",
  warning: "#C77700",
  link: "#2D6CDF",
  overlay: "rgba(14, 17, 22, 0.45)",
};

export const darkPalette: Palette = {
  background: "#0E1116",
  surface: "#161A21",
  surfaceMuted: "#1E232C",
  border: "#2A313C",
  text: "#F2F4F7",
  textMuted: "#8A95A6",
  textInverse: "#0E1116",
  primary: "#5C8DEF",
  primaryPressed: "#7AA3F3",
  primaryText: "#0E1116",
  danger: "#FF6B6B",
  success: "#4FBF7C",
  warning: "#E8A23B",
  link: "#7AA3F3",
  overlay: "rgba(0, 0, 0, 0.65)",
};
