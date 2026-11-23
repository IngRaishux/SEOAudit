# Proposal

## Why

Los sitios multilingües (como las cadenas hoteleras con versiones en español e inglés) indican a los buscadores sus versiones por idioma con anotaciones `hreflang`. Hoy SEOAudit no las lee: el crawl ignora los `<link rel="alternate" hreflang>` del `<head>` y los `<xhtml:link>` del sitemap, y la vista de páginas de un sitio no muestra qué idiomas tiene cada página. Los errores de `hreflang` (falta de enlaces de retorno, códigos inválidos, sin `x-default`) son de los más comunes en SEO internacional y la herramienta no ayuda a detectarlos. Además, el formulario de sugerencias pide los idiomas alternos y solo los rellena la IA, aunque la página ya los declare.

## What Changes

- **Captura en el crawl** de los idiomas alternos de cada página desde dos fuentes: `<link rel="alternate" hreflang="…" href="…">` del `<head>` y `<xhtml:link rel="alternate">` del sitemap. Cada alterno guarda su código de idioma, su URL absoluta y de qué fuente vino (HTML, sitemap o ambas). También se guarda el atributo `lang` del `<html>`.
- **Revisión de `hreflang`** a nivel de sitio, calculada sobre las páginas rastreadas, que marca por página:
  - código de idioma o región inválido;
  - falta la autorreferencia (la página no se incluye a sí misma);
  - falta `x-default`;
  - enlace sin retorno (la página alterna rastreada no enlaza de vuelta);
  - el mismo código apunta a URLs distintas.
- **Vista de páginas del sitio**: nueva columna "Idiomas" con un distintivo por código, indicador de problemas y detalle por página (URL de cada alterno, fuente y problemas). Un resumen encima de la tabla indica cuántas páginas declaran idiomas alternos y cuántas tienen problemas. Las páginas rastreadas antes de este cambio indican que hay que volver a rastrear.
- **Formulario de sugerencias**: los idiomas alternos (`en-US`, `es-MX`, `x-default`) se precargan con las URLs detectadas en la página y prevalecen sobre lo que proponga la IA, porque son datos reales del sitio.

**Fuera de alcance**: cabeceras HTTP `Link` con `hreflang`, generar o corregir automáticamente las anotaciones, añadir más idiomas al formato de exportación de sugerencias y volver a rastrear sitios existentes de forma automática.

## Capabilities

### New Capabilities
- `hreflang`: captura de los idiomas alternos declarados por cada página (HTML y sitemap), revisión de su configuración a nivel de sitio y su presentación en la vista de páginas y en el formulario de sugerencias.

### Modified Capabilities
<!-- No hay specs en openspec/specs/: los cambios anteriores aún no se han archivado. -->

## Impact

- `seoaudit/apps/crawler/src/crawler/parse.ts`: extracción de alternos del `<head>` y de `<html lang>` en `PageSeo`.
- `seoaudit/apps/crawler/src/sitemap/parse.ts` y `src/index.ts`: el sitemap devuelve también los alternos de cada URL y se combinan con los del HTML.
- `seoaudit/apps/web/lib/models/Page.ts`, `app/api/crawl/route.ts` y `lib/repositories/pageRepository.ts`: nuevos campos `alternates` y `htmlLang`, persistidos y devueltos en el listado de páginas.
- Nuevo módulo de revisión en `seoaudit/apps/web/lib/hreflang/`, con tests.
- `seoaudit/apps/web/components/SiteDetailsTabs.tsx` (pestaña Páginas), `app/sugerence/page.tsx` y `lib/i18n/ui.ts`.
- Sin cambios de dependencias. Las páginas ya guardadas siguen funcionando: los campos nuevos son opcionales.
