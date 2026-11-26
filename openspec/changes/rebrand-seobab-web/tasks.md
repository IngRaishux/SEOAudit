# Tasks

## 1. Módulo de marca y configuración

- [x] 1.1 Crear `apps/web/lib/brand.ts` con `BRAND_NAME = 'SEObab'` y `siteUrl()` (lee `NEXT_PUBLIC_SITE_URL`; si no existe o está vacía, usa `https://seobab.com`), con `lib/brand.test.ts` que cubra el valor por defecto, una URL configurada y una cadena vacía; verificar con `npm test`
- [x] 1.2 Documentar `NEXT_PUBLIC_SITE_URL` en la sección de variables de entorno de `seoaudit/CLAUDE.md`, en local y en producción, indicando que es opcional, que por defecto vale `https://seobab.com` y que se resuelve en build; verificar leyendo la sección

## 2. Logo compartido

- [x] 2.1 Crear `components/BrandLogo.tsx` (icono provisional `RiSearchLine` con un comentario sobre el futuro SVG del cangrejo, texto `BRAND_NAME`, opción para ocultar el texto por debajo de `sm`) y usarlo en los dos enlaces de `components/Header.tsx`, con `aria-label={BRAND_NAME}`, y en `components/landing/Footer.tsx`; verificar en el navegador la cabecera con y sin sesión, el pie y que por debajo de `sm` solo se ve el icono

## 3. Nombre en textos y correos

- [x] 3.1 Sustituir "SEOAudit" por "SEObab" en las cadenas `es` y `en` de `lib/i18n/ui.ts` (herramientas gratuitas, ejemplos, GEO, FAQ y correo de invitación) y añadir un test que recorra recursivamente ambos diccionarios y falle si alguna cadena contiene `seo audit` o `seoaudit` sin distinguir mayúsculas; verificar con `npm test`
- [x] 3.2 Usar `BRAND_NAME` en el remitente por defecto de `lib/mail/mailer.ts` y en el `inviterName` de respaldo de `lib/invitations/service.ts`, y actualizar `lib/mail/templates/invitation.test.ts` para esperar "… en SEObab" y "… on SEObab"; verificar con `npm test`

## 4. Metadatos del sitio

- [x] 4.1 Convertir el `metadata` de `app/layout.tsx` en `generateMetadata` con `metadataBase: siteUrl()`, `title: { default: BRAND_NAME, template: \`%s · ${BRAND_NAME}\` }`, descripción en el idioma de la petición (`footer.tagline`) y `openGraph.siteName`; quitar el `· SEO Audit` concatenado en `app/login/page.tsx`, `app/register/page.tsx` y `app/invite/[token]/page.tsx`, manteniendo en la invitación `robots: { index: false }` y `referrer: 'no-referrer'`; verificar con `curl` contra `next dev` que el `<title>` de `/login` termina en " · SEObab" una sola vez y que hay `og:site_name` = SEObab
- [x] 4.2 Añadir `landing.meta.{title, description}` en `es` y `en` de `ui.ts` y un helper `landingMetadata(lang)` que devuelva `title.absolute`, `description`, `openGraph.{title, description, locale (es_MX/en_US), url}` y `alternates` (canónica propia; `es` → `/`, `en` → `/en`, `x-default` → `/`); exportar `generateMetadata` en `app/page.tsx` y `app/en/page.tsx`. Añadir un test unitario del helper que compruebe canónica, las tres alternativas y el idioma de los textos; verificar con `npm test` y con `curl` que `/` y `/en` incluyen `<link rel="canonical">` y los tres `<link rel="alternate" hreflang>` con URLs absolutas `https://seobab.com/…`

## 5. Verificación integral

- [x] 5.1 Ejecutar `grep -rniE "seo ?audit" apps/web/app apps/web/components apps/web/lib` y confirmar que solo quedan identificadores técnicos excluidos a propósito (`MONGODB_DB_NAME` con valor por defecto `'seoaudit'`); ejecutar `npm test`, `npm run lint` y `npm run build` en `apps/web` sin errores
- [x] 5.2 Con `next build` y `next start`, abrir `/`, `/en`, `/login` y `/register` en el navegador y confirmar el nombre SEObab en la cabecera, el pie, las pestañas y los textos, sin "SEO Audit" visible

## Workflow follow-up

- Tras desplegar: revisar en Vercel que el nombre visible de `MAIL_FROM` diga SEObab y verificar con `curl https://seobab.com/` y `https://seobab.com/en` el título, `og:site_name`, la canónica y `hreflang`.
- Al archivar `landing-page-redesign`, `auth-pages-redesign` y `free-tools`, sustituir "SEOAudit" por "SEObab" en el propósito de sus specs.
- Fase posterior: logo y favicon del cangrejo en `BrandLogo` y `og:image`; User-Agent `SeobabBot` en `apps/crawler`.
