# Tasks

## 1. Dependencias

- [x] 1.1 Instalar `gsap@3.15.1` y `@gsap/react@2.1.2` en `apps/web` con `npm install … -w apps/web` desde `seoaudit/` y verificar que aparecen en `apps/web/package.json` y en `package-lock.json`, y que `npx tsc --noEmit` sigue limpio

## 2. Helper de contadores

- [x] 2.1 Crear `lib/landing/motion.ts` con `parseCountTarget(text)` y `lib/landing/motion.test.ts` (dígitos → número; `'JSON-LD'`, `''`, `'7+'`, `' 7'` → null); verificar con `npm test` en `apps/web`

## 3. Componente de animación

- [x] 3.1 Crear `components/landing/LandingMotion.tsx` (`'use client'`) con contenedor `display: contents`, `useGSAP` con `scope`, `gsap.matchMedia` para `prefers-reduced-motion: no-preference`, timeline del hero, `reveal`, `stagger` con ScrollTrigger `once: true`, contadores y `ScrollTrigger.refresh()` tras `document.fonts.ready`; verificar con `tsc` y `eslint`
- [x] 3.2 Añadir en `app/globals.css` la regla `[data-motion="hero"]` (oculto solo sin movimiento reducido, con animación CSS de respaldo a los 2,5 s), el `<noscript>` que la anula en `Landing.tsx` y envolver las secciones con `LandingMotion`; verificar que `Landing` sigue siendo Server Component (`next build` sin errores)

## 4. Marcado de las secciones

- [x] 4.1 `Hero.tsx`: `data-motion="hero"` en insignia, `h1`, subtítulo, contenedor de botones y maqueta; verificar en el navegador que la entrada es escalonada y termina en menos de 1,5 s
- [x] 4.2 `Stats.tsx`: `data-motion="stagger"` en `.stats` y `data-motion-count` en cada `stat-value`; verificar que 7, 2 y 4 cuentan y que `JSON-LD` solo aparece
- [x] 4.3 `HowItWorks.tsx`, `Tools.tsx`, `UseCases.tsx`, `Faq.tsx` y `FinalCta.tsx`: `reveal` en encabezados, `tablist` y tarjeta final; `stagger` en los pasos, la rejilla (con un `div` envoltorio por tarjeta) y la lista de preguntas; verificar en el navegador que el hover de las tarjetas sigue funcionando y que las pestañas y las preguntas plegables responden igual

## 5. Verificación integral (Playwright contra `next build` + `next start`)

- [x] 5.1 Sin JavaScript: `/` y `/en` muestran todas las secciones visibles y todos los textos en el HTML
- [x] 5.2 Con `reducedMotion: 'reduce'`: ningún elemento con `opacity` menor que 1 ni `transform` en línea durante el recorrido, y cifras con su valor final desde el inicio
- [x] 5.3 Con movimiento: tras recorrer la página todo queda con `opacity: 1`; al abrir `/#faq` directamente la sección se ve; sin errores en consola
- [x] 5.4 A 360 px no hay desplazamiento horizontal en ningún momento del recorrido animado
- [x] 5.5 Navegar de `/` a `/en` y a `/login`: en `/login` no quedan elementos animados ni errores al hacer scroll, al volver a `/` el hero se anima de nuevo y `/en` termina visible (GSAP no es global en la página, así que `ScrollTrigger.getAll()` no se puede inspectar desde Playwright)
- [x] 5.6 Simular fallo bloqueando el chunk de `LandingMotion`: el hero se ve completo antes de 3 s
- [x] 5.7 `npm test`, `npx eslint` y `npx tsc --noEmit` limpios en `apps/web`, y `openspec validate landing-gsap-animations --strict` pasa

## 6. Ajustes tras revisión

- [x] 6.1 Los números de "Cómo funciona" quedaban tapados por la línea del paso siguiente (el `transform` residual creaba un contexto de apilamiento por `<li>`): `clearProps` en `reveal` y `stagger` al terminar; verificado en el navegador que los pasos no conservan estilos en línea, que cada círculo queda encima en su centro y que tras recorrer la página nada queda oculto
