# Design

## Context

Ver proposal.md (Why). Estado actual relevante:

- `components/landing/Landing.tsx` es un Server Component que compone `Hero`, `Stats`, `HowItWorks`, `Tools`, `UseCases`, `Faq`, `FinalCta` y `Footer`, todos Server Components. Solo `LanguageSync`, `LanguageAlert` y su banner son cliente.
- `/` y `/en` renderizan `<Landing lang>`; el `Header` global vive en `app/layout.tsx`.
- Las tarjetas de `Tools` tienen `transition hover:-translate-y-1`: una transición CSS sobre `transform`.
- Las cifras de `Stats` vienen de `lib/i18n/ui.ts`: `'7'`, `'2'`, `'4'` y `'JSON-LD'`.
- Monorepo npm workspaces (`seoaudit/package-lock.json`); vitest solo cubre `lib/**/*.test.ts` en entorno node.
- Versiones actuales: `gsap@3.15.1`, `@gsap/react@2.1.2` (compatible con React 19).

## Goals / Non-Goals

**Goals:**
- Que las secciones sigan siendo Server Components: la animación vive en un único componente cliente.
- Que el contenido nunca dependa de que GSAP se ejecute.
- Lógica testeable fuera del DOM (parseo de las cifras).

**Non-Goals:**
- Una biblioteca de animaciones reutilizable para el resto de la app.
- Tests de componentes con jsdom: la verificación visual se hace con Playwright, como en los cambios anteriores.

## Decisions

### 1. Un componente cliente que anima por atributos `data-motion`

`LandingMotion` (`'use client'`) se monta dentro de `<main>` y, con `useGSAP({ scope: mainRef })`, busca los elementos marcados en el HTML del servidor:

| Atributo | Uso | Animación |
|---|---|---|
| `data-motion="hero"` | hijos del hero, en orden | timeline al cargar: `y: 24 → 0`, `autoAlpha 0 → 1`, `stagger 0.08`, `duration 0.6`, `ease power2.out` |
| `data-motion="reveal"` | bloques sueltos (encabezados, ejemplos, CTA final) | `y: 32 → 0`, `autoAlpha`, al entrar (`start: 'top 85%'`, `once: true`) |
| `data-motion="stagger"` | contenedor de una lista (pasos, tarjetas, FAQ) | sus hijos directos escalonados `0.1`, mismo disparador |
| `data-motion-count` | `stat-value` | contador si el valor es numérico |

Para que `Landing.tsx` siga siendo servidor, `LandingMotion` recibe la referencia vía un contenedor propio: renderiza `<div ref>{children}</div>` envolviendo las secciones, con `display: contents` para no alterar el layout.

Alternativas descartadas: convertir cada sección en cliente (envía más JS y rompe la separación actual) y `framer-motion` (más peso para el mismo resultado, y el usuario pidió GSAP).

### 2. Animar con `gsap.from` y `matchMedia`

Todo se registra dentro de `gsap.matchMedia()` con la condición `(prefers-reduced-motion: no-preference)`. Con movimiento reducido no se crea ningún tween, así que los elementos quedan como los dejó el servidor. `useGSAP` revierte el contexto al desmontar (cambio de ruta o de `/` a `/en`), lo que mata los ScrollTrigger y limpia los estilos en línea.

Se usa `gsap.from`: el estado final es el del HTML, así que si un tween no corre, el elemento queda visible.

### 3. Evitar el parpadeo del hero

El hero está visible antes de que hidrate React; un `from` posterior lo mostraría, lo ocultaría y lo volvería a mostrar. Se evita solo con CSS en `globals.css`, sin scripts en línea:

- Dentro de `@media (prefers-reduced-motion: no-preference)`, `[data-motion="hero"]` tiene `visibility: hidden` y una animación CSS de `0s` con retraso de 2,5 s y `forwards` que lo vuelve visible: red de seguridad si GSAP no llega a ejecutarse (el spec pide menos de 3 s).
- `Landing.tsx` incluye un `<noscript>` con una regla que muestra el hero y anula la animación: sin JavaScript se ve desde el principio.
- La timeline de GSAP parte de `autoAlpha: 0` y termina con `visibility` en línea, que gana a la hoja de estilos.

Con movimiento reducido la media query no aplica y nada se oculta. Solo se oculta el hero: lo demás está fuera de la ventana al hidratar y lo maneja ScrollTrigger.

Alternativas descartadas: un `<script>` en línea que marque `<html>` con una clase antes de hidratar, porque cambia un atributo que renderiza React y provoca avisos de hidratación; y ocultar con CSS todo lo animable, porque si el bundle tarda la página entera quedaría en blanco.

### 4. Elementos que ya están en la ventana o se saltan

ScrollTrigger con `once: true` dispara también para elementos que ya están por encima del punto de inicio al crearse (salto a `#faq`, recarga a mitad de página): se reproducen de inmediato y terminan visibles. Tras crear los triggers se llama a `ScrollTrigger.refresh()` una vez cargadas las fuentes (`document.fonts.ready`) para que las posiciones sean correctas.

### 5. Tarjetas con hover CSS

GSAP y la clase `transition` competirían por `transform` y la entrada se vería a tirones. El `data-motion="stagger"` se pone en la rejilla y GSAP anima unos `div` envoltorios de cada tarjeta, no el `article`. El hover sigue en el `article`, sin conflicto.

### 6. Contadores

Helper puro `parseCountTarget(text): number | null` en `lib/landing/motion.ts`: devuelve el entero si el texto es solo dígitos (`/^\d+$/`) y `null` en otro caso. Si hay número, se anima un objeto `{ value: 0 }` hasta el objetivo con `snap: { value: 1 }` y en `onUpdate` se escribe `textContent`. Al terminar se restaura el texto original exacto. El valor queda en el HTML del servidor, así que lectores de pantalla y buscadores ven el número final.

### 7. Instalación

`npm install gsap@3.15.1 @gsap/react@2.1.2 -w apps/web` desde `seoaudit/`. `ScrollTrigger` se registra una sola vez en el módulo (`gsap.registerPlugin(useGSAP, ScrollTrigger)`). Al importarse solo desde `LandingMotion`, el código queda en el chunk de las rutas de la landing.

## Risks / Trade-offs

- [Si GSAP tarda más de 2,5 s en hidratar, el hero aparece sin animación y luego la timeline lo anima desde 0] → Solo ocurre en conexiones muy lentas; el contenido nunca queda oculto más de 2,5 s.
- [Desplazamientos `y` cerca del borde podrían provocar scroll horizontal] → Solo se anima en el eje vertical, sin `x` ni `scale > 1`; se comprueba a 360 px con Playwright.
- [Las pestañas de ejemplos son radios con `tab-content`; animar sus paneles podría ocultar uno al cambiar de pestaña] → Se anima el `tablist` completo una sola vez, nunca los paneles.
- [Peso de GSAP, ~40 KB comprimidos] → Solo en `/` y `/en`, cargado tras el HTML y sin bloquear el render.
- [Cambios de altura (FAQ abiertas, banner de idioma) desplazan los puntos de disparo] → Con `once: true`, un disparo algo adelantado o retrasado no deja nada oculto: el elemento aparece al llegar o antes.

## Migration Plan

Sin datos ni APIs afectados. Para revertir basta con quitar `LandingMotion`, el `<noscript>`, los atributos `data-motion`, la regla CSS y las dos dependencias.
