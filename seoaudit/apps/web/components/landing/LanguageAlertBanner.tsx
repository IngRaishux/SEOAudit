'use client';

import { useEffect, useState } from 'react';
import { RiCloseLine, RiTranslate2 } from '@remixicon/react';
import type { Language } from '@/lib/i18n/ui';

export const LANGUAGE_ALERT_TIMEOUT_MS = 12_000;
const FADE_MS = 300;

interface LanguageAlertBannerProps {
  lang: Language;
  href: string;
  message: string;
  action: string;
  closeLabel: string;
}

type Phase = 'visible' | 'leaving' | 'gone';

/** Aviso de idioma descartable: se cierra con el botón o solo a los 12 s, salvo mientras se interactúa. */
export function LanguageAlertBanner({ lang, href, message, action, closeLabel }: LanguageAlertBannerProps) {
  const [phase, setPhase] = useState<Phase>('visible');
  const [paused, setPaused] = useState(false);

  // Cuenta atrás; se reinicia al salir el cursor o el foco
  useEffect(() => {
    if (phase !== 'visible' || paused) return;
    const timer = setTimeout(() => setPhase('leaving'), LANGUAGE_ALERT_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [phase, paused]);

  // Deja terminar el fundido antes de quitarlo del DOM
  useEffect(() => {
    if (phase !== 'leaving') return;
    const timer = setTimeout(() => setPhase('gone'), FADE_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  if (phase === 'gone') return null;

  return (
    <div className="px-4 pt-4 pb-6">
      <div
        role="status"
        lang={lang}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        className={`alert max-w-6xl mx-auto bg-base-200 border-base-300 shadow-sm grid-flow-row grid-cols-[auto_1fr_auto] sm:grid-cols-[auto_1fr_auto_auto] justify-items-start text-left gap-x-3 gap-y-1 transition-opacity duration-300 ${
          phase === 'leaving' ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <RiTranslate2 className="size-5 text-info col-start-1 row-start-1" aria-hidden="true" />
        <span className="col-start-2 row-start-1">{message}</span>
        {/* <a> nativo: el cambio de idioma necesita recargar el layout */}
        <a
          href={href}
          hrefLang={lang}
          className="btn btn-sm btn-ghost col-start-2 row-start-2 -ml-3 sm:ml-0 sm:col-start-3 sm:row-start-1"
        >
          {action}
        </a>
        <button
          type="button"
          onClick={() => setPhase('leaving')}
          aria-label={closeLabel}
          title={closeLabel}
          className="btn btn-sm btn-ghost btn-circle col-start-3 row-start-1 sm:col-start-4"
        >
          <RiCloseLine className="size-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
