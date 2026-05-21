import { palette, type Palette } from "./colors";
import { radii, spacing } from "./spacing";
import { typography } from "./typography";

/**
 * MOVA ships a single light theme. Dark mode was intentionally removed —
 * the design is built around warm-white canvas + lime/forest accents and
 * inverting it breaks the character. The `scheme` field stays so
 * components that key off it (e.g. `StatusBar`) keep compiling, but it
 * is always `"light"`.
 */
export type Theme = {
  scheme: "light";
  colors: Palette;
  spacing: typeof spacing;
  radii: typeof radii;
  typography: typeof typography;
};

export const theme: Theme = {
  scheme: "light",
  colors: palette,
  spacing,
  radii,
  typography,
};

// Legacy aliases — keeps `lightTheme` / `darkTheme` imports compiling.
// Both point at the same single theme.
export const lightTheme = theme;
export const darkTheme = theme;

export { spacing, radii, typography };
export type { Palette };
