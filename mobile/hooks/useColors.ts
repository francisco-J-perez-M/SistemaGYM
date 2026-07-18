/**
 * useColors() — devuelve la paleta activa según tema + alto contraste.
 * useFontScale() — devuelve el multiplicador de tamaño de fuente.
 *
 * Usar estos hooks en componentes UI. Las pantallas que usan
 * StyleSheet.create() estático seguirán funcionando con la paleta dark
 * por defecto; los componentes base (Card, Button, Drawer) sí reaccionan.
 */
import {
  darkPalette, lightPalette,
  darkHighContrast, lightHighContrast,
} from '../constants/themes';
import { useAccessibilityStore } from '../store/accessibilityStore';
import type { Palette, FontScale } from '../constants/themes';

export function useColors(): Palette {
  const resolvedTheme = useAccessibilityStore((s) => s.resolvedTheme());
  const highContrast  = useAccessibilityStore((s) => s.highContrast);

  if (resolvedTheme === 'light') {
    return highContrast ? lightHighContrast : lightPalette;
  }
  return highContrast ? darkHighContrast : darkPalette;
}

export function useFontScale(): FontScale {
  return useAccessibilityStore((s) => s.fontScale);
}

export function useReduceMotion(): boolean {
  return useAccessibilityStore((s) => s.reduceMotion);
}
