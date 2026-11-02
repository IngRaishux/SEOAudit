'use client';

import { createContext, useEffect, useState, type ReactNode } from 'react';
import type { Language } from './ui';
import { DEFAULT_LANGUAGE, LANGUAGE_COOKIE, LANGUAGE_EVENT, languageCookie, parseLanguage } from './language';

export const LanguageContext = createContext<Language>(DEFAULT_LANGUAGE);

function hasLanguageCookie(): boolean {
  return document.cookie.split('; ').some((c) => c.startsWith(`${LANGUAGE_COOKIE}=`));
}

/**
 * Recibe el idioma que el servidor ya usó para renderizar, así la hidratación coincide.
 * Se actualiza cuando setLanguage() dispara el evento de cambio.
 */
export function LanguageProvider({ initialLanguage, children }: { initialLanguage: Language; children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(initialLanguage);

  useEffect(() => {
    const onChange = (event: Event) => {
      const next = parseLanguage((event as CustomEvent<string>).detail);
      if (next) setLanguageState(next);
    };
    window.addEventListener(LANGUAGE_EVENT, onChange);

    // Quien eligió idioma antes de usar la cookie solo lo tiene en localStorage: se migra una vez
    if (!hasLanguageCookie()) {
      try {
        const stored = parseLanguage(localStorage.getItem(LANGUAGE_COOKIE));
        if (stored) {
          document.cookie = languageCookie(stored);
          if (stored !== initialLanguage) window.dispatchEvent(new CustomEvent(LANGUAGE_EVENT, { detail: stored }));
        }
      } catch {
        // localStorage bloqueado: se queda el idioma del servidor
      }
    }
    return () => window.removeEventListener(LANGUAGE_EVENT, onChange);
  }, [initialLanguage]);

  return <LanguageContext.Provider value={language}>{children}</LanguageContext.Provider>;
}
