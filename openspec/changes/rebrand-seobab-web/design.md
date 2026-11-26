# Design

## Context

Motivación en proposal.md (Why); requisitos en `specs/brand-identity` y `specs/site-metadata`. Estado actual relevante de `seoaudit/apps/web`:

- `app/layout.tsx` exporta un `metadata` estático con `title: "SEO Audit"` y una descripción en inglés. No tiene `metadataBase`, `openGraph` ni plantilla de título. El layout ya resuelve el idioma de la petición con `getRequestLanguage()` para `<html lang>`.
- `app/page.tsx` (es) y `app/en/page.tsx` (en) solo renderizan `<Landing lang>`. No exportan metadatos, así que heredan los del layout.
- `login`, `register` e `invite/[token]` tienen `generateMetadata` que concatena `· SEO Audit` a mano.
- La lupa (`RiSearchLine`) más el texto "SEO Audit" están copiados en tres sitios: `Header.tsx` (enlace con sesión y enlace sin sesión) y `landing/Footer.tsx`.
- `lib/i18n/ui.ts` contiene "SEOAudit" escrito dentro de cadenas en español e inglés: herramientas gratuitas, ejemplos, GEO, FAQ y la plantilla del correo de invitación. `invitation.test.ts` comprueba el asunto literal.
- `lib/mail/mailer.ts` (remitente por defecto) y `lib/invitations/service.ts` (nombre de respaldo del invitador) usan el literal `'SEOAudit'`.
- Las variables de entorno se documentan en la sección de entorno de `seoaudit/CLAUDE.md`, porque `.env.example` está ignorado por git.

## Goals / Non-Goals

**Goals:**
- Que el futuro logo del cangrejo sustituya al provisional editando un solo componente.
- Que los literales de marca en código TypeScript salgan de una sola constante.
- Que cada landing devuelva sus metadatos en el HTML del servidor, sin depender del cliente.

**Non-Goals:**
- Pasar el nombre como parámetro de interpolación en todas las traducciones.
- Añadir `hreflang` a páginas que no son la landing (login, registro, app autenticada).
- Generar `sitemap.xml`, `robots.txt` u `og:image`.

## Decisions

### 1. Módulo `lib/brand.ts` con `BRAND_NAME` y `siteUrl()`
Exporta `BRAND_NAME = 'SEObab'` y una función `siteUrl()` que devuelve `new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://seobab.com')`. Lo usan el layout, `mailer.ts`, `invitations/service.ts` y el componente de logo.
- *Alternativa*: un JSON de marca o la configuración de Tailwind. Se descarta porque solo hay un dato real; un archivo TS se puede tipar e importar desde servidor y cliente.
- `NEXT_PUBLIC_` porque `siteUrl()` puede usarse en componentes cliente más adelante (por ejemplo, para compartir enlaces). Hoy solo se usa en servidor. La variable se resuelve en tiempo de build; esto queda documentado.

### 2. Componente `components/BrandLogo.tsx`
Renderiza el icono más el texto `BRAND_NAME`. Acepta `className`, `iconClassName` y una opción para ocultar el texto por debajo de `sm`. Header y Footer lo usan; el `aria-label` del enlace en Header pasa a `BRAND_NAME`. El icono provisional sigue siendo `RiSearchLine`, con un comentario que indica que se sustituirá por el SVG del cangrejo.
- *Alternativa*: dejar los tres bloques y cambiar solo el texto. Se descarta porque cuando llegue el logo habría que tocar tres sitios otra vez, y el Footer ya usa tamaños distintos (`size-6`, `text-xl`).

### 3. Las traducciones mantienen el nombre escrito en la cadena
En `ui.ts` se sustituye "SEOAudit" por "SEObab" dentro de cada cadena. No se usa `{brand}`.
- *Razón*: un cambio de marca es raro, el nombre no se traduce, y añadir un parámetro obligaría a pasarlo en cada `t()` o `formatMessage`, incluido el correo. Para evitar regresiones, una prueba recorre los diccionarios `es` y `en` y falla si alguna cadena contiene `SEO Audit` o `SEOAudit` (insensible a mayúsculas).

### 4. Metadatos: layout global más `generateMetadata` en cada landing
- **Layout** (`generateMetadata` asíncrono, porque la descripción depende del idioma):
  - `metadataBase: siteUrl()`
  - `title: { default: BRAND_NAME, template: '%s · SEObab' }` (la plantilla se construye con `BRAND_NAME`)
  - `description` en el idioma de la petición, reutilizando `footer.tagline`
  - `openGraph: { siteName: BRAND_NAME, type: 'website' }`
- **Landings**: un helper compartido `landingMetadata(lang)` en `components/landing/` o en `lib/` devuelve:
  - `title: { absolute: ... }`, para que la home no quede como "X · SEObab · SEObab" ni dependa de la plantilla
  - `description`
  - `openGraph.{title, description, locale, url}`
  - `alternates: { canonical, languages: { es: '/', en: '/en', 'x-default': '/' } }`

  Las rutas son relativas y Next las vuelve absolutas con `metadataBase`. Los textos salen de una nueva clave `landing.meta: { title, description }` en `ui.ts`; el título incluye la marca, por ejemplo "SEObab · Auditoría SEO y GEO con IA".
- **Login, registro, invitación**: devuelven solo su título; la plantilla agrega " · SEObab".
- *Alternativa*: `hreflang` en `<head>` escrito a mano o en el middleware. Se descarta porque la API de metadatos de Next ya genera `<link rel="alternate" hreflang>` y la canónica.
- `og:locale`: `es_MX` para español y `en_US` para inglés. Es una suposición razonable para el público principal y se cambia con una línea.

### 5. Sin cambios en identificadores técnicos
`MONGODB_DB_NAME` sigue con `'seoaudit'` por defecto, y se mantienen los paquetes `@seo-optimizer/*` y la carpeta `seoaudit/`. La prueba de la decisión 3 se limita a los diccionarios, y la verificación final con `grep` excluye esos identificadores a propósito.

## Risks / Trade-offs

- [Un "SEOAudit" escrito a mano en el futuro] → La prueba de diccionarios cubre `ui.ts`; las tareas incluyen un `grep` final sobre `app/`, `components/` y `lib/`.
- [`NEXT_PUBLIC_SITE_URL` mal configurada en un preview] → Si no existe, se usa producción. En previews, las canónicas apuntarán a `seobab.com`, lo cual es aceptable (incluso deseable) para que los previews no compitan en buscadores.
- [`MAIL_FROM` de producción con nombre antiguo] → No se puede corregir desde el código. Se avisa en el resumen de despliegue para revisarla en Vercel.
- [El título de la home cambia en Google] → Es el efecto buscado; el dominio ya cambió.
- [La descripción del layout ahora depende del idioma y hace la ruta dinámica] → El layout ya lee `headers()` y `cookies()` para `<html lang>`, así que todas las rutas ya son dinámicas; no hay coste nuevo.

## Migration Plan

1. Desplegar normalmente; no hay cambios de datos.
2. Opcional: definir `NEXT_PUBLIC_SITE_URL=https://seobab.com` en Vercel Production. El valor por defecto ya es ese.
3. Revisar que `MAIL_FROM` en Vercel diga `SEObab <…>`.
4. Verificar en producción con `curl` las etiquetas `<title>`, `og:site_name`, `canonical` y `hreflang` de `/` y `/en`.
5. Rollback: revertir el commit; no hay estado persistido que deshacer.
