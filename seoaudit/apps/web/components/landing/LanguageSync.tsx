'use client';

import { useEffect } from 'react';
import { LANGUAGE_EVENT } from '@/lib/i18n/language';
import { useCurrentLanguage } from '@/lib/i18n/useI18n';
import type { Language } from '@/lib/i18n/ui';

/**
 * En una navegación del cliente el root layout no se vuelve a renderizar, así que el
 * provider y <html lang> pueden quedarse con el idioma anterior. Los alinea con la ruta.
 */
export function LanguageSync({ lang }: { lang: Language }) {
  const current = useCurrentLanguage();

  useEffect(() => {
    if (document.documentElement.lang !== lang) document.documentElement.lang = lang;
    if (current !== lang) window.dispatchEvent(new CustomEvent(LANGUAGE_EVENT, { detail: lang }));
  }, [current, lang]);

  return null;
}
