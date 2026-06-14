import { palette, type Palette } from "./colors";
import { radii, spacing } from "./spacing";
import { typography } from "./typography";

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

export const lightTheme = theme;
export const darkTheme = theme;

export { spacing, radii, typography };
export type { Palette };
