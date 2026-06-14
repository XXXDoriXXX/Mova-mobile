export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  xxl: 32,
  xxxl: 48,
  page: 22,
} as const;

export type Spacing = keyof typeof spacing;

export const radii = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 22,
  xxl: 24,
  pill: 999,
} as const;

export type Radius = keyof typeof radii;
