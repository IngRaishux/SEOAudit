import { useCallback } from 'react';
import { translations, type Language, t } from './ui';

export function useI18n(lang: Language = 'es') {
  const i18n = translations[lang];

  const translate = useCallback(
    (path: string, defaultValue = '') => {
      return t(lang, path, defaultValue);
    },
    [lang]
  );

  return {
    lang,
    t: translate,
    i18n,
  };
}

// Hook para usar el idioma desde localStorage o sistema
export function useCurrentLanguage(): Language {
  if (typeof window === 'undefined') return 'es';

  try {
    const stored = localStorage.getItem('language');
    if (stored === 'es' || stored === 'en') {
      return stored;
    }
  } catch (error) {
    console.error('Error reading language from localStorage:', error);
  }

  // Detectar idioma del navegador
  const browserLang = navigator.language.toLowerCase().split('-')[0];
  return browserLang === 'en' ? 'en' : 'es';
}

// Función para establecer el idioma
export function setLanguage(lang: Language) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('language', lang);
    } catch (error) {
      console.error('Error saving language to localStorage:', error);
    }
  }
}
