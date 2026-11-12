import { useCallback, useContext } from 'react';
import { translations, type Language, t } from './ui';
import { LANGUAGE_COOKIE, LANGUAGE_EVENT, languageCookie } from './language';
import { LanguageContext } from './LanguageProvider';

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

// El idioma lo decide el servidor (cookie o Accept-Language) y llega por LanguageProvider
export function useCurrentLanguage(): Language {
  return useContext(LanguageContext);
}

// Guarda en cookie (la lee el servidor) y en localStorage, y avisa al provider para re-renderizar
export function setLanguage(lang: Language) {
  if (typeof window === 'undefined') return;
  document.cookie = languageCookie(lang);
  try {
    localStorage.setItem(LANGUAGE_COOKIE, lang);
  } catch (error) {
    console.error('Error saving language to localStorage:', error);
  }
  window.dispatchEvent(new CustomEvent(LANGUAGE_EVENT, { detail: lang }));
}
