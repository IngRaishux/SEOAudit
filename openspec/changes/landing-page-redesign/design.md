# Design

## Context

Ver proposal.md (Why). Estado actual relevante:

- `app/page.tsx` es un Client Component completo (`'use client'`) solo para leer la sesión con `useSession`. Usa el `Button` de `@seo-optimizer/ui` y colores fijos.
- El proyecto usa **daisyUI 4.12.24 + Tailwind 3**. La skill de daisyUI del repo (`apps/web/.agents/skills/daisyui`) documenta **v5**: componentes como `text-rotate`, `hover-3d` o `aura` no existen en v4, y la sintaxis de algunos (tabs, collapse) difiere. La implementación se guía por las clases de v4.
- El idioma se resuelve en `app/layout.tsx` con `resolveLanguage(cookie, accept-language)` (`lib/i18n/language.ts`). El resultado define `<html lang>` y el `initialLanguage` de `LanguageProvider`, del que leen todos los componentes cliente, incluido `Header`.
- `middleware.ts` ya deja pasar `/` como pública; `/en` no está en `PROTECTED_ROUTES`, así que también pasa.
- `SERPPreview` es un componente cliente puro (props `title`, `description`, `url`; sin peticiones) que toma su idioma de `LanguageProvider`.
- Las páginas de servidor obtienen la sesión con `getServerSession(handler)` de `@/lib/auth/auth`.

## Goals / Non-Goals

**Goals:**
- Una sola implementación de la landing, parametrizada por idioma, usada por `/` y `/en`.
- Que el idioma de la ruta gane sobre la cookie en todo el documento (`lang`, cabecera y contenido) sin cambiar cómo se resuelve el idioma en el resto de la app.
- Mínimo JavaScript en el cliente: la landing debe funcionar casi entera sin hidratación.

**Non-Goals:**
- Etiquetas de SEO (metadata, `hreflang`, sitemap, JSON-LD); el diseño solo evita cerrarles la puerta.
- Cambiar `SERPPreview`, `Header` más allá del selector, o el sistema de temas.

## Decisions

### 1. Idioma de la ruta: el middleware lo marca y el layout le da prioridad

El middleware, para `/` y `/en`, añade a la **petición** un header interno `x-landing-lang` (`es` o `en`) con `NextResponse.next({ request: { headers } })` y escribe la cookie `language` en la respuesta. En las demás rutas **elimina** ese header si llega del cliente, para que nadie pueda forzarlo desde fuera.

`resolveLanguage` gana un primer parámetro opcional `routeLanguage` con prioridad máxima: `route > cookie > Accept-Language > 'es'`. `layout.tsx` lo lee de `headers()`.

```
request /en --> middleware --+-- req header x-landing-lang=en
                             +-- res cookie language=en
            --> layout: resolveLanguage('en', cookie, accept) = 'en'
                  <html lang="en">, LanguageProvider initialLanguage='en'
            --> app/en/page.tsx: <Landing lang="en" />
```

Alternativas descartadas:
- *Segmento dinámico `app/[lang]/...`*: chocaría con rutas existentes (`/login`, `/dashboard`) o obligaría a mover toda la app.
- *Grupos de rutas con dos root layouts*: duplica providers y `Header`, y navegar entre root layouts recarga la página entera de todos modos.
- *Leer el pathname en el layout*: Next no expone el pathname a los layouts; habría que pasarlo igualmente por un header.

### 2. Una landing compartida, renderizada en el servidor

`components/landing/Landing.tsx` es un Server Component que recibe `lang` y obtiene sus textos con `getServerTranslations(lang)` / `serverT`. `app/page.tsx` renderiza `<Landing lang="es" />` y `app/en/page.tsx` renderiza `<Landing lang="en" />`. Cada sección vive en su propio archivo en `components/landing/` (`Hero`, `Stats`, `HowItWorks`, `Tools`, `UseCases`, `Faq`, `FinalCta`, `Footer`, `LanguageAlert`).

### 3. Sesión resuelta en el servidor, no con `useSession`

`Landing` llama a `getServerSession(handler)` y pasa `isAuthenticated` a las secciones con CTA. El layout ya es dinámico (lee cookies y headers), así que no se pierde caché, y se evita el parpadeo de "Empezar gratis" → "Ver panel" que produciría `useSession` mientras carga. Alternativa descartada: isla cliente con `useSession` (parpadeo y JS extra).

### 4. Componentes daisyUI 4 por sección

| Sección | Componentes v4 |
|---|---|
| Hero | `hero`, `hero-content`, `btn btn-primary` / `btn btn-ghost`, `mockup-browser` con `SERPPreview` |
| Cifras | `stats stats-vertical lg:stats-horizontal`, `stat` |
| Cómo funciona | `steps steps-vertical lg:steps-horizontal`, `step step-primary` |
| Herramientas | `card bg-base-100 shadow`, `badge` (p. ej. "IA", "GEO") |
| Ejemplos | `tabs tabs-lifted` con radios (`input type="radio" role="tab" class="tab"` + `div role="tabpanel" class="tab-content"`), `mockup-browser`, `mockup-code`, `mockup-window`, `diff` |
| FAQ | `<details class="collapse collapse-arrow">` con `<summary class="collapse-title">` |
| Llamada final | `card bg-primary text-primary-content` o `hero` compacto |
| Pie | `footer` |
| Aviso de idioma | `alert` |

Las pestañas por radio y el `collapse` con `<details>` funcionan sin JavaScript y dejan todo el texto en el HTML, como piden las specs.

Los iconos se toman de `@remixicon/react` (ya en uso). Son componentes SVG sin estado, válidos en Server Components.

### 5. Cifras basadas en hechos del producto, no en métricas inventadas

La sección de cifras muestra datos verificables del producto (p. ej. 7 herramientas, 2 idiomas, 4 pasos, salida en formatos estándar JSON-LD / `llms.txt`). No hay métricas de uso reales que mostrar y no se inventan números de clientes o páginas analizadas.

### 6. Maquetas con componentes reales y datos fijos

Los datos de ejemplo (title/description/URL ficticios, JSON-LD, `llms.txt`, lista de organizaciones) viven en `components/landing/examples.ts`, por idioma cuando el texto es visible. `SERPPreview` se importa tal cual dentro de un Server Component (es un Client Component sin peticiones). Su idioma coincide con el de la ruta porque `LanguageProvider` arranca con el idioma de la ruta (decisión 1). El `diff` antes/después usa dos bloques de texto con estilos del tema.

Se usa un dominio ficticio reservado (`example.com`) para no apuntar a sitios reales.

### 7. Selector ES/EN con `<a>` y sincronización del provider

`Header` (cliente) usa `usePathname()`. Si la ruta es `/` o `/en`, muestra un `join` con dos enlaces **`<a href>` nativos** (no `next/link`), y marca el actual con `btn-active` y `aria-current="page"`. También hace que el logo, para visitantes sin sesión, apunte a la landing del idioma actual.

Motivo de `<a>`: en una navegación del cliente, el root layout **no se vuelve a renderizar**, así que `<html lang>` y el `initialLanguage` del provider se quedarían con el idioma anterior. Una navegación completa los recalcula.

Como red de seguridad para navegaciones cliente que sí lleguen a la landing (p. ej. `next/link` a `/` desde otra página), `Landing` incluye una isla mínima `LanguageSync` que, si el idioma del contexto difiere del de la ruta, dispara el evento existente `LANGUAGE_EVENT` y actualiza `document.documentElement.lang`.

### 8. Aviso de idioma calculado en el servidor

`Landing` lee `Accept-Language` con `headers()` y usa `languageFromAcceptLanguage` (ya existe). Si el resultado es el otro idioma soportado, renderiza un `alert` **en ese idioma** con enlace a la otra ruta. No hace falta JavaScript.

### 9. Middleware: `/en` pública de forma explícita

Se añade `/en` a `PUBLIC_ROUTES`. La comparación actual usa `startsWith`, que con `/en` también aceptaría rutas como `/enterprise`. Por eso la condición de landing se evalúa con igualdad exacta (`pathname === '/' || pathname === '/en'`) antes de la lógica existente.

## Risks / Trade-offs

- [Next 16 marca `middleware.ts` como obsoleto en favor de `proxy.ts`] → Se mantiene `middleware.ts` (sigue funcionando) y no se mezcla esa migración en este cambio.
- [La skill de daisyUI del repo describe v5 y puede inducir a usar clases inexistentes en v4] → Las tareas exigen revisar visualmente cada sección; la tabla de la decisión 4 fija las clases v4.
- [Visitar `/` sobrescribe la cookie: un usuario angloparlante que entra a `/` desde el logo de otra página pasa a español] → Con sesión, el logo apunta a `/organizations`, no a la landing; sin sesión, el logo apunta a la landing del idioma actual (decisión 7).
- [`SERPPreview` envuelve su contenido en `Card` y ocupa bastante altura dentro de `mockup-browser`] → Se limita la maqueta con un contenedor de ancho/alto fijo; si no basta, se valora una variante compacta en un cambio posterior.
- [El tema personalizado de `tailwind.config.ts` usa variables de v5 que v4 ignora] → La landing usa `cupcake` tal cual; corregirlo queda fuera de alcance.

## Migration Plan

Despliegue normal, sin datos ni API afectadas. Para revertir, basta con volver a la versión anterior de `app/page.tsx`, `middleware.ts`, `layout.tsx`, `language.ts` y `Header.tsx` y borrar `app/en/` y `components/landing/`.
