/**
 * Layout scale. The design uses 22px page padding, large card radii
 * (20–24) and pill-shaped chips. Tokens stay generic — `lg` is the
 * common "card padding" / "section gap" value.
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  xxl: 32,
  xxxl: 48,
  /** Standard horizontal page inset. Matches the design canvas. */
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
