/** Graveyard-at-night palette for the Zombidoku theme: deep plum sky,
 * bone/parchment cards for contrast, toxic green as the primary accent,
 * moonlight yellow as the secondary one. */
export const colors = {
  background: '#241B33',
  surface: '#F5F1E6',
  surfaceMuted: '#E8E0CC',
  ink: '#2A2140',
  inkSoft: '#6B5F7D',
  accent: '#8BC34A',
  accentDark: '#6B9B2F',
  accentSecondary: '#F0C23E',
  success: '#3FA55A',
  danger: '#E0554F',
  cardShadow: 'rgba(20, 10, 30, 0.35)',
} as const;

/** Palette for puzzle regions ("cimetières"). Chosen to be distinguishable
 * at a glance (including for common forms of color-blindness) at up to 10
 * regions, while staying in the graveyard-at-night family. */
export const regionPalette = [
  '#8BC34A', // toxic green
  '#6B4F7D', // deep purple
  '#D97757', // pumpkin
  '#4F7DC9', // moonlit blue
  '#C9A66B', // grave dirt
  '#7DC9A6', // swamp teal
  '#C96B8A', // bruise pink
  '#A6C96B', // olive slime
  '#F0C23E', // moon yellow
  '#8A6BC9', // violet fog
] as const;

export function regionColor(regionId: number): string {
  return regionPalette[regionId % regionPalette.length];
}
