import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import uz from './uz.json';
import ru from './ru.json';

export const SUPPORTED_LANGUAGES = ['uz', 'ru'] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_LABELS: Record<Language, string> = {
  uz: "O'zbekcha",
  ru: 'Русский',
};

export function isLanguage(value: string | undefined | null): value is Language {
  return value === 'uz' || value === 'ru';
}

void i18n.use(initReactI18next).init({
  resources: {
    uz: { translation: uz },
    ru: { translation: ru },
  },
  lng: 'uz',
  fallbackLng: 'uz',
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
