// Kept design tokens — neobrutalist: thick ink borders, hard offset shadows,
// olive-green accent on warm cream. Mirrors the HTML prototype.

export const colors = {
  ink: '#111111',
  cream: '#f4f1e7',
  creamDeep: '#e7e3d5',
  surface: '#ffffff',
  green: '#8fae5e',
  greenDark: '#3f6b3a',
  greenSoft: '#e9efdc',
  olive: '#a7c579',
  red: '#cf6a52',
  redSoft: '#f3ddd6',
  redHeat: '#e4b0a4',
  muted: '#8a8570',
  muted2: '#6b6754',
  faint: '#a8a48f',
  border: '#e4e1d2',
  flame: '#ff8a4c',
  // GitHub-style intensity ramp for the yearly heatmap
  heat: ['#e7e3d5', '#cfe0b0', '#a9c97e', '#7f9e4e', '#5f7d3a'] as const,
};

export const fonts = {
  // Bricolage Grotesque — display / headings
  display: 'Bricolage_700Bold',
  displayBold: 'Bricolage_800ExtraBold',
  // Plus Jakarta Sans — body / UI
  body: 'Jakarta_500Medium',
  bodySemi: 'Jakarta_600SemiBold',
  bodyBold: 'Jakarta_700Bold',
};

// Hard neobrutalist shadow (RN 0.76+ supports the CSS-like boxShadow prop).
export function hardShadow(offset = 4, color = colors.ink) {
  return { boxShadow: `${offset}px ${offset}px 0 ${color}` } as const;
}

export const radius = {
  sm: 11,
  md: 14,
  lg: 18,
  xl: 22,
  pill: 999,
};
