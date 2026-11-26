# Proposal

## Why

La aplicación ya se publica en `seobab.com`, pero la web sigue presentándose como "SEO Audit" o "SEOAudit", escrito de dos formas distintas. El nuevo nombre, **SEObab**, une "SEO" con *bab*, la palabra maya para "cangrejo", que hace referencia al rastreo (*crawling*). Ahora que cambió el dominio, la identidad visible debe coincidir con él. De paso, se corrigen los metadatos del sitio público: las landings `/` y `/en` heredan un título y una descripción genéricos en inglés y no declaran `hreflang` entre ellas. En una herramienta de SEO, ese descuido se nota.

## What Changes

- **Nombre visible**: todas las apariciones de "SEO Audit" y "SEOAudit" en `apps/web` pasan a **SEObab**: cabecera (con y sin sesión), pie de la landing, títulos de pestaña, textos de la landing y de las herramientas gratuitas en español e inglés, FAQ, y asunto y cuerpo del correo de invitación.
- **Nombre en un solo lugar**: el nombre de la marca se define una vez y lo usan los metadatos, el remitente de correo por defecto y el nombre de respaldo del invitador. El símbolo y el nombre de la cabecera y el pie se dibujan con un único componente de logo. Por ahora conserva la lupa como icono provisional, para que el futuro logo del cangrejo se cambie en un solo sitio.
- **Metadatos del sitio**:
  - URL base absoluta, configurable y por defecto `https://seobab.com`.
  - Plantilla de título `<página> · SEObab`.
  - `og:site_name` con valor SEObab.
  - Título y descripción propios de cada landing en su idioma, con `og:locale`.
  - URL canónica de cada landing.
  - Alternativas `hreflang` `es`, `en` y `x-default` entre `/` y `/en`.
- Las páginas de inicio de sesión, registro e invitación dejan de concatenar el nombre a mano y usan la plantilla de título.

**Fuera de alcance**:
- Diseño del logo, favicon e imagen para redes (`og:image`); los hará el autor más adelante.
- Nombre de la base de datos (`seoaudit` por defecto en `lib/db/mongo.ts`), paquetes `@seo-optimizer/*` y nombres de carpetas.
- User-Agent del crawler (`SEOOptimizer/1.0`, en `apps/crawler`).
- Documentación interna (`apps/web/docs/`, `CLAUDE.md`) y otras aplicaciones del monorepo.

## Capabilities

### New Capabilities
- `brand-identity`: cómo se nombra y se muestra la marca SEObab en la aplicación web: nombre canónico, logo compartido en cabecera y pie, y nombre en textos y correos.
- `site-metadata`: metadatos públicos del sitio: URL base, plantilla de título, nombre del sitio en Open Graph, y metadatos por idioma con canónica y `hreflang` de las landings.

### Modified Capabilities
<!--
No hay capacidades en openspec/specs/. Los cambios sin archivar `landing-page-redesign`, `auth-pages-redesign` y `free-tools` mencionan "SEOAudit" en el propósito de sus specs. Al archivarlos, hay que sustituir el nombre por SEObab. Ningún requisito cambia de comportamiento.
-->

## Impact

- **Código** (`seoaudit/apps/web`):
  - `app/layout.tsx`, `app/page.tsx`, `app/en/page.tsx`
  - `app/login/page.tsx`, `app/register/page.tsx`, `app/invite/[token]/page.tsx`
  - `components/Header.tsx`, `components/landing/Footer.tsx`
  - `lib/i18n/ui.ts`, `lib/mail/mailer.ts`, `lib/invitations/service.ts`, `lib/mail/templates/invitation.test.ts`
  - Nuevos: módulo de marca y componente de logo.
- **Configuración**: nueva variable opcional `NEXT_PUBLIC_SITE_URL`; si no existe, se usa `https://seobab.com`. Se documenta junto a las demás variables. Como es `NEXT_PUBLIC_*`, cambiarla requiere un nuevo build.
- **Correo**: si `MAIL_FROM` no está definida, el remitente por defecto pasa a ser `SEObab <…>`. En producción `MAIL_FROM` ya define el remitente real; conviene revisar que su nombre visible diga SEObab.
- **Sin cambios** en datos, APIs ni rutas.
