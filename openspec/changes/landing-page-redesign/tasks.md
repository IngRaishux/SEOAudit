# Tasks

Rutas relativas a `seoaudit/apps/web/`.

## 1. Resolución de idioma por ruta

- [x] 1.1 Añadir en `lib/i18n/language.ts` la función pura `landingLanguageForPath(pathname)` (`'/'` → `'es'`, `'/en'` → `'en'`, otra → `null`, sin aceptar `/enterprise` ni `/en/x`) y la constante del header `LANDING_LANGUAGE_HEADER = 'x-landing-lang'`; cubrirla en `lib/i18n/language.test.ts` y verificar con `npm test`
- [x] 1.2 Extender `resolveLanguage` con un parámetro `routeLanguage` de prioridad máxima (ruta > cookie > Accept-Language > `es`), manteniendo el comportamiento actual cuando es `null`/`undefined`; añadir casos en `language.test.ts` (cookie `es` + ruta `en` → `en`; sin ruta, los casos existentes siguen pasando) y verificar con `npm test`
- [x] 1.3 Añadir la función pura `alternateLandingLanguage(pageLang, acceptLanguage)`, que devuelve el otro idioma solo cuando el navegador lo prefiere y `null` en otro caso (coincidente, no soportado, sin header); cubrirla con los cuatro escenarios del spec en `language.test.ts` y verificar con `npm test`

## 2. Middleware y layout

- [x] 2.1 En `middleware.ts`, para `/` y `/en` (igualdad exacta vía `landingLanguageForPath`), pasar `x-landing-lang` en los headers de la petición con `NextResponse.next({ request: { headers } })` y escribir la cookie `language` con `languageCookie`, conservando la lógica existente del parámetro `org`; en el resto de rutas, eliminar `x-landing-lang` de la petición entrante. Añadir `/en` a `PUBLIC_ROUTES`. Verificar con `curl -i` que `/en` devuelve 200 con `Set-Cookie: language=en`, y que `/dashboard` sin sesión sigue redirigiendo a `/login`
- [x] 2.2 En `app/layout.tsx`, leer `x-landing-lang` de `headers()` y pasarlo a `resolveLanguage`; verificar con `curl -H 'Cookie: language=es' /en` que el HTML contiene `<html lang="en"`, y que `/login` con la cookie `en` sigue en inglés

## 3. Textos i18n

- [x] 3.1 Añadir el espacio `home` en `lib/i18n/ui.ts` (ES y EN) con los textos de hero, cifras, cómo funciona (4 pasos), herramientas (7), ejemplos (3 casos), FAQ (≥5), llamada final, pie, aviso de idioma y selector
- [x] 3.2 Añadir `lib/i18n/home.test.ts` que compruebe que `translations.es.home` y `translations.en.home` tienen las mismas claves (recursivo) y ningún valor vacío; verificar con `npm test`

## 4. Componentes de la landing

- [x] 4.1 Crear `components/landing/examples.ts` con los datos ficticios por idioma (title/description/URL en `example.com`, JSON-LD, fragmento de `llms.txt`, organizaciones y sitios de ejemplo, title antes/después)
- [x] 4.2 Crear `components/landing/Hero.tsx` (`hero`, CTA según `isAuthenticated`, `mockup-browser` con `SERPPreview`) y verificar que es el único `h1` de la página
- [x] 4.3 Crear `Stats.tsx` (`stats`, solo cifras verificables del producto) y `HowItWorks.tsx` (`steps` con 4 pasos, vertical en móvil y horizontal en `lg`)
- [x] 4.4 Crear `Tools.tsx` con las 7 tarjetas (`card`, icono de `@remixicon/react`, `badge` donde aplique) en una cuadrícula de 1/2/3 columnas
- [x] 4.5 Crear `UseCases.tsx` con `tabs tabs-lifted` por radio (SEO clásico seleccionado por defecto): SEO clásico (`SERPPreview` + `diff` antes/después), IA/GEO (`mockup-code` con JSON-LD y `llms.txt`), agencias (`mockup-window` con organizaciones); verificar que al cambiar de pestaña con JavaScript desactivado se ve el contenido
- [x] 4.6 Crear `Faq.tsx` (`<details class="collapse collapse-arrow">`, cerrados por defecto), `FinalCta.tsx` (CTA según sesión) y `Footer.tsx` (`footer`)
- [x] 4.7 Crear `LanguageAlert.tsx` (`alert` en el idioma alternativo con enlace `<a>` a la otra ruta, usando `alternateLandingLanguage`) y la isla cliente `LanguageSync.tsx`, que dispara `LANGUAGE_EVENT` y actualiza `document.documentElement.lang` si el contexto no coincide con `lang`
- [x] 4.8 Crear `components/landing/Landing.tsx` (Server Component, recibe `lang`, obtiene sesión con `getServerSession(handler)` y textos con `getServerTranslations`) que compone las secciones en el orden del spec, sin colores fijos fuera del tema

## 5. Rutas y cabecera

- [x] 5.1 Reescribir `app/page.tsx` como Server Component que renderiza `<Landing lang="es" />` (sin `'use client'` ni `useSession`) y crear `app/en/page.tsx` con `<Landing lang="en" />`; verificar con `curl` que `/` y `/en` devuelven 200 con el contenido en su idioma
- [x] 5.2 En `components/Header.tsx`, con `usePathname()`, mostrar en `/` y `/en` un `join` ES/EN con `<a href>` nativos (`btn-active` y `aria-current="page"` en el actual) y hacer que el logo de visitantes sin sesión apunte a la landing del idioma actual; verificar que el selector no aparece en `/login` ni en `/dashboard`

## 6. Verificación integral

- [x] 6.1 Con `npm run dev`, recorrer los escenarios de `specs/landing-i18n-routing/spec.md` (cookie `es` + `/en`; `Accept-Language: en` en `/` sin redirección y con aviso; `fr-FR` sin aviso; `/en` → `/register` en inglés; selector ES/EN) y anotar el resultado
- [x] 6.2 Recorrer los escenarios de `specs/landing-page/spec.md`: orden de secciones, un solo `h1`, todo el texto en el HTML (`curl` sin JS), CTA con y sin sesión, ninguna petición de red de las maquetas (DevTools), 360 px sin scroll horizontal, y cambio de `data-theme` a `dark` sin colores fuera del tema
- [x] 6.3 Ejecutar `npm test`, `npm run lint` y `npm run build` en `apps/web` y verificar que terminan sin errores

## Workflow follow-up

- Archivar el cambio cuando se haya revisado y fusionado el PR.
