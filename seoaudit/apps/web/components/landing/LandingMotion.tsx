'use client';

import { useRef, type ReactNode } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { parseCountTarget } from '@/lib/landing/motion';

gsap.registerPlugin(useGSAP, ScrollTrigger);

// clearProps: al terminar se quitan los estilos en línea. Un transform residual crea un contexto de
// apilamiento por elemento y, en los pasos de daisyUI, la línea de un paso tapaba el número del anterior.
// El hero no lo usa: su visibility en línea es lo que anula la ocultación del CSS.
const REVEAL = {
  y: 32,
  autoAlpha: 0,
  duration: 0.7,
  ease: 'power2.out',
  clearProps: 'transform,opacity,visibility',
} as const;
// Una sola vez: al subir y volver a bajar no se repite, y lo que ya quedó atrás (salto a #faq) se muestra al momento
const onEnter = (trigger: Element) => ({ trigger, start: 'top 85%', once: true });

/**
 * Anima la landing a partir de los atributos data-motion del HTML del servidor: las secciones siguen
 * siendo Server Components. Usa gsap.from, así que el estado final es el del HTML y, si algo no corre,
 * el contenido queda visible. Con movimiento reducido no se crea ninguna animación.
 */
export function LandingMotion({ children }: { children: ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(scope);
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // El CSS oculta el hero mientras espera esta timeline (ver globals.css)
        const hero = q('[data-motion="hero"]');
        if (hero.length) gsap.from(hero, { y: 24, autoAlpha: 0, duration: 0.6, ease: 'power2.out', stagger: 0.08 });

        q('[data-motion="reveal"]').forEach((el) => gsap.from(el, { ...REVEAL, scrollTrigger: onEnter(el) }));
        q('[data-motion="stagger"]').forEach((el) =>
          gsap.from(el.children, { ...REVEAL, stagger: 0.1, scrollTrigger: onEnter(el) }),
        );

        const restoreCounters: Array<() => void> = [];
        q('[data-motion-count]').forEach((el) => {
          const text = el.textContent ?? '';
          const target = parseCountTarget(text);
          if (target === null) return;
          const counter = { value: 0 };
          el.textContent = '0';
          gsap.to(counter, {
            value: target,
            duration: 1.2,
            ease: 'power1.out',
            snap: { value: 1 },
            scrollTrigger: onEnter(el),
            onUpdate: () => {
              el.textContent = String(counter.value);
            },
            // Se restaura el texto exacto del servidor
            onComplete: () => {
              el.textContent = text;
            },
          });
          restoreCounters.push(() => {
            el.textContent = text;
          });
        });

        return () => restoreCounters.forEach((restore) => restore());
      });

      // Las fuentes web cambian alturas: se recalculan los puntos de disparo cuando terminan de cargar
      document.fonts?.ready.then(() => ScrollTrigger.refresh());
    },
    { scope },
  );

  return (
    <div ref={scope} className="contents">
      {children}
    </div>
  );
}
