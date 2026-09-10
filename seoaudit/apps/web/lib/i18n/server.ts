import { translations, type Language, t } from './ui';

export function getServerTranslations(lang: Language = 'es') {
  return translations[lang];
}

export function serverT(lang: Language, path: string, defaultValue = '') {
  return t(lang, path, defaultValue);
}
