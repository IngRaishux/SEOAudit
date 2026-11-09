# Tasks

Rutas relativas a `seoaudit/`.

## 1. Crawler: captura de alternos

- [x] 1.1 En `apps/crawler/src/crawler/parse.ts`, añadir el tipo `HreflangAlternate`, los campos `alternates` y `htmlLang` a `PageSeo` (también en `emptyPageSeo`) y `extractAlternates()` sobre el documento completo (rel con la palabra `alternate`, `href` resuelto a absoluto, deduplicado, `source: 'html'`); exportar el tipo desde `src/index.ts` y cubrir en `parse.test.ts` dos idiomas, URL relativa, `rel="alternate nofollow"`, duplicados, sin alternos y `<html lang>`; verificar con `npm test` en `apps/crawler`
- [x] 1.2 En `apps/crawler/src/sitemap/parse.ts`, añadir `parseSitemapEntries()` que devuelva `{ loc, alternates }[]` leyendo `xhtml:link` (uno o varios, solo `rel="alternate"`, `source: 'sitemap'`), manteniendo `parseSitemap()` sobre ella; añadir `sitemap/parse.test.ts` con un `urlset` con y sin `xhtml:link` (mockeando `fetch`); verificar con `npm test`
- [x] 1.3 En `apps/crawler/src/index.ts`, usar `parseSitemapEntries()` y combinar los alternos del sitemap con los del HTML mediante `mergeAlternates()` (misma pareja código+URL → `source: 'both'`), con tests de la combinación; verificar con `npm test` y `npx tsc --noEmit` en `apps/crawler`

## 2. Persistencia

- [x] 2.1 Añadir `alternates` (subdocumentos `{ _id: false, hreflang, href, source }`) y `htmlLang` opcionales a `apps/web/lib/models/Page.ts`, guardarlos en `apps/web/app/api/crawl/route.ts` e incluirlos en el `select` de `listPagesBySite`; verificar con `npx tsc --noEmit` en `apps/web`

## 3. Revisión de hreflang

- [x] 3.1 Crear `apps/web/lib/hreflang/review.ts` con `isValidHreflang()` (reglas del diseño, devuelve sugerencia en alias) y `reviewHreflang()` (problemas `invalid-code`, `missing-self`, `missing-x-default`, `conflicting-code`, `missing-return` y el informativo `unverifiable`, con la normalización de URLs del diseño); crear `review.test.ts` con todos los escenarios del requisito "Revisión de la configuración de hreflang" y los códigos del diseño; verificar con `npm test` en `apps/web`
- [x] 3.2 Crear `apps/web/lib/hreflang/form.ts` con `alternatesToForm()` (coincidencia exacta y por idioma) y `form.test.ts` con los escenarios de precarga; verificar con `npm test`

## 4. Interfaz

- [x] 4.1 Añadir los textos `siteDetails.hreflang.*` en ES y EN (columna, resumen, fuentes, problemas, aviso de volver a rastrear) con un test de paridad de claves; verificar con `npm test`
- [x] 4.2 En `apps/web/components/SiteDetailsTabs.tsx`, añadir el resumen, la columna "Idiomas" con distintivos, el indicador de problemas, el aviso para páginas sin el campo y el detalle con `<details>`; verificar en el navegador con un sitio rastreado de nuevo que declare `hreflang`, en ES y EN, y que no haya scroll horizontal de página a 360 px
- [x] 4.3 En `apps/web/app/sugerence/page.tsx`, precargar `alternateLanguages` con `alternatesToForm()` al cargar la página y conservar los valores detectados tras generar con IA (individual y desde el diálogo); verificar en el navegador con una página que declare alternos

## 5. Verificación integral

- [x] 5.1 Rastrear un sitio real que declare `hreflang` en HTML o sitemap y recorrer los escenarios de `specs/hreflang/spec.md`: alternos y fuentes guardados en Mongo, problemas detectados coherentes con el sitio, vista de páginas y precarga de sugerencias; comprobar también que un sitio rastreado antes muestra el aviso de volver a rastrear
- [x] 5.2 Ejecutar `npm test` en `apps/crawler` y en `apps/web`, y `npm run lint` y `npm run build` en `apps/web`, y verificar que terminan sin errores

## 6. Ajustes tras la revisión de diseño

- [x] 6.1 Reescribir los problemas de hreflang en lenguaje claro (título de qué pasa y una línea de por qué importa y cómo corregirlo, en ES y EN) y mostrar rutas cortas para URLs del mismo sitio en problemas y alternos; verificar en el navegador con el sitio de Las Brisas
- [x] 6.2 Evitar que el distintivo del resumen se desborde en móvil (puede ocupar varias líneas); verificar a 320, 360 y 425 px que queda dentro del aviso y sin scroll horizontal
- [x] 6.3 Añadir a cada problema un ejemplo de corrección con las líneas `<link rel="alternate">` construidas con los datos reales (en qué página va, botón de copiar, aviso si el idioma es de ejemplo y nota para sitemaps) en `lib/hreflang/fix.ts` con tests; verificar en el navegador que el fragmento se copia y que no hay scroll horizontal a 375 px
- [x] 6.4 Distinguir `x-default-elsewhere` (solo x-default apunta a otra página sin retorno) de `missing-return`, con corrección en la propia página respetando el idioma por defecto que eligió el sitio; verificar con un rastreo real de hotelquijoteinn.com
- [x] 6.5 Hacer clicables las insignias de idioma: URL en el tooltip nativo al pasar el cursor y, al pulsar (también con teclado), la URL enlazada y su fuente debajo de las insignias, en línea para que el scroll de la tabla no la recorte; verificar en el navegador a 1280 y 375 px
- [x] 6.6 Hacer visible el hover de las insignias de idioma en toda su superficie (color primario en lugar de base-200, que coincidía con la fila resaltada), con tamaño normal de 20 px y anillo de foco; verificar el color al pasar el cursor por el centro y por una esquina

## Workflow follow-up

- Archivar el cambio cuando se haya revisado y fusionado el PR.
