import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Language } from '@/i18n';

export type ThemePreference = 'light' | 'dark' | 'system';

interface UiState {
  themePreference: ThemePreference;
  language: Language;
  /** Theme actually applied to the document, resolved by ThemeProvider. */
  resolvedTheme: 'light' | 'dark';
  setThemePreference: (preference: ThemePreference) => void;
  setLanguage: (language: Language) => void;
  setResolvedTheme: (theme: 'light' | 'dark') => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      themePreference: 'system',
      language: 'uz',
      resolvedTheme: 'light',
      setThemePreference: (themePreference) => set({ themePreference }),
      setLanguage: (language) => set({ language }),
      setResolvedTheme: (resolvedTheme) => set({ resolvedTheme }),
    }),
    {
      name: 'testhub.ui.v1',
      partialize: (state) => ({
        themePreference: state.themePreference,
        language: state.language,
      }),
    },
  ),
);
