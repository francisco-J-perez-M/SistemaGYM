/**
 * Store de accesibilidad — persiste con expo-secure-store.
 *
 * Preferencias:
 *   theme        → 'dark' | 'light' | 'system'
 *   fontScale    → 1 | 1.15 | 1.3
 *   highContrast → boolean
 *   reduceMotion → boolean
 */
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Appearance } from 'react-native';
import type { ThemeMode, FontScale } from '../constants/themes';

const STORAGE_KEY = 'gympro_a11y_prefs';

interface AccessibilityState {
  theme:        ThemeMode;
  fontScale:    FontScale;
  highContrast: boolean;
  reduceMotion: boolean;
  hydrated:     boolean;

  // Acciones
  setTheme:        (t: ThemeMode)  => void;
  setFontScale:    (s: FontScale)  => void;
  setHighContrast: (v: boolean)    => void;
  setReduceMotion: (v: boolean)    => void;
  hydrate:         () => Promise<void>;

  // Helpers
  resolvedTheme: () => 'dark' | 'light';
}

async function persist(state: Partial<AccessibilityState>) {
  const toSave = {
    theme:        state.theme,
    fontScale:    state.fontScale,
    highContrast: state.highContrast,
    reduceMotion: state.reduceMotion,
  };
  await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(toSave));
}

export const useAccessibilityStore = create<AccessibilityState>((set, get) => ({
  theme:        'dark',
  fontScale:    1,
  highContrast: false,
  reduceMotion: false,
  hydrated:     false,

  resolvedTheme: () => {
    const { theme } = get();
    if (theme === 'system') {
      return Appearance.getColorScheme() === 'light' ? 'light' : 'dark';
    }
    return theme;
  },

  setTheme: (theme) => {
    set({ theme });
    persist({ ...get(), theme });
  },
  setFontScale: (fontScale) => {
    set({ fontScale });
    persist({ ...get(), fontScale });
  },
  setHighContrast: (highContrast) => {
    set({ highContrast });
    persist({ ...get(), highContrast });
  },
  setReduceMotion: (reduceMotion) => {
    set({ reduceMotion });
    persist({ ...get(), reduceMotion });
  },

  hydrate: async () => {
    try {
      const raw = await SecureStore.getItemAsync(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        set({
          theme:        saved.theme        ?? 'dark',
          fontScale:    saved.fontScale    ?? 1,
          highContrast: saved.highContrast ?? false,
          reduceMotion: saved.reduceMotion ?? false,
        });
      }
    } catch {
      // prefs corruptas → defaults
    } finally {
      set({ hydrated: true });
    }
  },
}));
