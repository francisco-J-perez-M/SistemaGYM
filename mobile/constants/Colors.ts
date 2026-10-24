/**
 * Paleta de colores GymPro — espejo del design system del web.
 * Todos los valores coinciden con las CSS variables del frontend.
 */
export const Colors = {
  background:      '#0f0f1a',
  card:            '#16213e',
  cardAlt:         '#1a1a2e',
  surface:         '#1e293b',
  accent:          '#6c63ff',
  accentLight:     '#8b83ff',
  accentDark:      '#4f46e5',
  text:            '#e2e8f0',
  textSecondary:   '#94a3b8',
  textMuted:       '#64748b',
  border:          '#2d3748',
  borderLight:     '#374151',
  success:         '#22c55e',
  successBg:       'rgba(34,197,94,0.12)',
  warning:         '#f59e0b',
  warningBg:       'rgba(245,158,11,0.12)',
  error:           '#ef4444',
  errorBg:         'rgba(239,68,68,0.12)',
  info:            '#3b82f6',
  infoBg:          'rgba(59,130,246,0.12)',
  purple:          '#8b5cf6',
  purpleBg:        'rgba(139,92,246,0.12)',
  overlay:         'rgba(0,0,0,0.6)',
  inputBg:         '#1e293b',

  // Gradientes (para LinearGradient)
  gradientAccent:  ['#6c63ff', '#8b5cf6'] as const,
  gradientCard:    ['#16213e', '#1a1a2e'] as const,
  gradientDark:    ['#0f0f1a', '#16213e'] as const,
};

export type ColorKey = keyof typeof Colors;
