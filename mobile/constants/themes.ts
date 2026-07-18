/**
 * Paletas de colores GymPro.
 * Exporta dark, light y variantes de alto contraste.
 * Usado por useColors() — nunca importar directamente en componentes.
 */

type Palette = typeof darkPalette;

export const darkPalette = {
  background:    '#0f0f1a',
  card:          '#16213e',
  cardAlt:       '#1a1a2e',
  surface:       '#1e293b',
  accent:        '#6c63ff',
  accentLight:   '#8b83ff',
  accentDark:    '#4f46e5',
  text:          '#e2e8f0',
  textSecondary: '#94a3b8',
  textMuted:     '#64748b',
  border:        '#2d3748',
  borderLight:   '#374151',
  success:       '#22c55e',
  successBg:     'rgba(34,197,94,0.12)',
  warning:       '#f59e0b',
  warningBg:     'rgba(245,158,11,0.12)',
  error:         '#ef4444',
  errorBg:       'rgba(239,68,68,0.12)',
  info:          '#3b82f6',
  infoBg:        'rgba(59,130,246,0.12)',
  purple:        '#8b5cf6',
  purpleBg:      'rgba(139,92,246,0.12)',
  overlay:       'rgba(0,0,0,0.6)',
  inputBg:       '#1e293b',
  heroTop:       '#1e1b4b',
  statusBar:     'light' as const,
  gradientAccent: ['#6c63ff', '#8b5cf6'] as [string, string],
  gradientCard:   ['#16213e', '#1a1a2e'] as [string, string],
  gradientDark:   ['#0f0f1a', '#16213e'] as [string, string],
};

export const lightPalette: Palette = {
  background:    '#f8fafc',
  card:          '#ffffff',
  cardAlt:       '#f1f5f9',
  surface:       '#e2e8f0',
  accent:        '#5b52e8',
  accentLight:   '#7c75f0',
  accentDark:    '#4338ca',
  text:          '#0f172a',
  textSecondary: '#475569',
  textMuted:     '#94a3b8',
  border:        '#e2e8f0',
  borderLight:   '#f1f5f9',
  success:       '#16a34a',
  successBg:     'rgba(22,163,74,0.12)',
  warning:       '#b45309',
  warningBg:     'rgba(180,83,9,0.12)',
  error:         '#dc2626',
  errorBg:       'rgba(220,38,38,0.12)',
  info:          '#1d4ed8',
  infoBg:        'rgba(29,78,216,0.12)',
  purple:        '#7c3aed',
  purpleBg:      'rgba(124,58,237,0.12)',
  overlay:       'rgba(0,0,0,0.35)',
  inputBg:       '#f1f5f9',
  heroTop:       '#312e81',
  statusBar:     'dark' as const,
  gradientAccent: ['#5b52e8', '#7c3aed'] as [string, string],
  gradientCard:   ['#ffffff', '#f1f5f9'] as [string, string],
  gradientDark:   ['#f8fafc', '#e2e8f0'] as [string, string],
};

export const darkHighContrast: Palette = {
  ...darkPalette,
  background:    '#000000',
  card:          '#0d0d0d',
  cardAlt:       '#111111',
  surface:       '#1a1a1a',
  text:          '#ffffff',
  textSecondary: '#e0e0e0',
  textMuted:     '#aaaaaa',
  border:        '#555555',
  borderLight:   '#666666',
  accent:        '#8b83ff',
  accentLight:   '#a09aff',
  heroTop:       '#050520',
};

export const lightHighContrast: Palette = {
  ...lightPalette,
  background:    '#ffffff',
  card:          '#f0f0f0',
  cardAlt:       '#e8e8e8',
  surface:       '#d8d8d8',
  text:          '#000000',
  textSecondary: '#1a1a1a',
  textMuted:     '#444444',
  border:        '#999999',
  borderLight:   '#bbbbbb',
  accent:        '#3730a3',
  accentLight:   '#4338ca',
  heroTop:       '#1e1b5e',
};

export type ThemeMode  = 'dark' | 'light' | 'system';
export type FontScale  = 1 | 1.15 | 1.3;
export type { Palette };
