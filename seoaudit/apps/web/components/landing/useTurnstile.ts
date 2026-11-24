'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

interface TurnstileApi {
  render: (container: HTMLElement, options: Record<string, unknown>) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<TurnstileApi> | null = null;

function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  scriptPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('turnstile')));
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error('turnstile'));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export interface TurnstileEvents {
  /** Cloudflare entregó un token nuevo. */
  onToken?: (token: string) => void;
  /** El widget o el script fallaron. */
  onError?: () => void;
}

/**
 * Widget de Cloudflare Turnstile cargado bajo demanda (al llamar a `load`, p. ej. al enfocar el campo).
 * Modo "interaction-only": la mayoría de visitantes no ve nada. `token` es de un solo uso: tras
 * enviarlo hay que llamar a `reset` para obtener otro.
 */
export function useTurnstile(siteKey: string, lang: string, events: TurnstileEvents = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const eventsRef = useRef(events);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    eventsRef.current = events;
  });

  const load = useCallback(() => {
    if (widgetId.current || !containerRef.current) return;
    const container = containerRef.current;
    loadTurnstile()
      .then((api) => {
        if (widgetId.current) return;
        widgetId.current = api.render(container, {
          sitekey: siteKey,
          language: lang,
          appearance: 'interaction-only',
          callback: (value: string) => {
            setToken(value);
            eventsRef.current.onToken?.(value);
          },
          'expired-callback': () => setToken(null),
          'error-callback': () => {
            setToken(null);
            eventsRef.current.onError?.();
          },
        });
      })
      .catch(() => eventsRef.current.onError?.());
  }, [siteKey, lang]);

  const reset = useCallback(() => {
    setToken(null);
    if (widgetId.current) window.turnstile?.reset(widgetId.current);
  }, []);

  useEffect(
    () => () => {
      if (widgetId.current) window.turnstile?.remove(widgetId.current);
      widgetId.current = null;
    },
    [],
  );

  return { containerRef, token, load, reset };
}
