# Proposal

## Why

La landing (`/` y `/en`) ya presenta las herramientas y los ejemplos de uso, pero es completamente estática: las secciones aparecen todas de golpe y nada guía la mirada al hacer scroll. Unas animaciones sutiles de entrada le dan un aspecto más cuidado y ayudan a leer la página por bloques. GSAP con ScrollTrigger es el estándar para este tipo de animación y, desde la versión 3.13, todos sus plugins son gratuitos.

## What Changes

- **Dependencias nuevas** en `apps/web`: `gsap` y `@gsap/react` (hook `useGSAP`, que limpia las animaciones al desmontar).
- **Entrada del hero** al cargar: insignia, título, subtítulo y botones aparecen escalonados, y el mock del navegador entra justo después.
- **Aparición al hacer scroll** (ScrollTrigger), una sola vez por elemento:
  - encabezados de sección (título y subtítulo);
  - pasos de "Cómo funciona" y tarjetas de herramientas, escalonados;
  - bloque de ejemplos de uso, preguntas frecuentes y llamada final.
- **Contadores en las cifras**: los valores numéricos (7, 2, 4) cuentan desde 0 al entrar en pantalla; los no numéricos (`JSON-LD`) solo aparecen.
- **Movimiento reducido**: con `prefers-reduced-motion: reduce` no hay ninguna animación y todo se muestra desde el principio.
- **Sin perder contenido**: el texto sigue en el HTML del servidor, y sin JavaScript (o si GSAP no llega a cargar) la página se ve completa.

**Fuera de alcance**: parallax, secciones fijadas con scrub, animación de texto por palabras o letras, animar el encabezado global, otras páginas de la aplicación y transiciones entre rutas.

## Capabilities

### New Capabilities
- `landing-motion`: animaciones de entrada y de scroll de la landing pública, con respeto a la preferencia de movimiento reducido y sin depender de JavaScript para mostrar el contenido.

### Modified Capabilities
<!-- landing-page (del cambio landing-page-redesign, sin archivar) no cambia sus requisitos: el contenido sigue en el HTML del servidor y el orden de secciones es el mismo. -->

## Impact

- `seoaudit/apps/web/package.json` y `seoaudit/package-lock.json`: `gsap` y `@gsap/react`.
- Nuevo componente cliente `seoaudit/apps/web/components/landing/LandingMotion.tsx` y helper puro con test en `seoaudit/apps/web/lib/landing/`.
- Atributos `data-motion` en `Hero.tsx`, `Stats.tsx`, `HowItWorks.tsx`, `Tools.tsx`, `UseCases.tsx`, `Faq.tsx` y `FinalCta.tsx`; `Landing.tsx` monta el componente de animación.
- `app/globals.css`: regla que oculta el hero solo mientras se espera la animación.
- Las secciones siguen siendo Server Components. GSAP solo se carga en `/` y `/en` (unos 40 KB comprimidos con ScrollTrigger).
