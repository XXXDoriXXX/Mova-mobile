import { darkPalette, lightPalette, type Palette } from "./colors";
import { radii, spacing } from "./spacing";
import { typography } from "./typography";

export type Theme = {
  scheme: "light" | "dark";
  colors: Palette;
  spacing: typeof spacing;
  radii: typeof radii;
  typography: typeof typography;
};

export const lightTheme: Theme = {
  scheme: "light",
  colors: lightPalette,
  spacing,
  radii,
  typography,
};

export const darkTheme: Theme = {
  scheme: "dark",
  colors: darkPalette,
  spacing,
  radii,
  typography,
};

export { spacing, radii, typography };
export type { Palette };
