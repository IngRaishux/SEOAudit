# Tasks

## 1. Tope único de páginas por sitio

- [x] 1.1 Agregar `sitemapTotal` a `CrawlResult` en `apps/crawler/src/index.ts`: entradas después del filtro de host y antes de `maxUrls`, sin cambiar `total` ni `truncated`. Verificar con un caso en `index.test.ts`: un sitemap de 6 URLs con `maxUrls: 4` da `sitemapTotal: 6`, `total: 4` y `truncated: false`.
- [x] 1.2 Crear `apps/web/lib/limits.ts` con `SITE_PAGE_LIMIT = 100` y agregar el campo opcional `sitemapTotal: Number` al modelo `Site` y al tipo de `siteRepository` (incluido su `select`). Verificar con `tsc --noEmit` sin errores.
- [x] 1.3 En `app/api/crawl/route.ts`, pasar `maxUrls: SITE_PAGE_LIMIT` a `crawlSite` y guardar `sitemapTotal: result.sitemapTotal` en `persistCrawlResult`, sin tocar `crawlTruncated` ni `sitemapUrlCount`. Verificar rastreando un sitio con más de 100 URLs en el sitemap: se guardan 100 páginas, el sitio registra el total real y no aparece como "Parcial" en el dashboard.
- [x] 1.4 Cambiar el orden de `listPagesBySite` a `{ _id: 1 }` y usar `SITE_PAGE_LIMIT` en `app/sites/[siteId]/page.tsx` y en `api/sites/[siteId]/generate-all/route.ts` (en lugar de `100` y `0`). Verificar en un sitio anterior con más de 100 páginas que la tabla, el conteo del diálogo "Generar todas" y el job generado cubren las mismas 100 URLs.
- [x] 1.5 Agregar el aviso de límite en `app/sites/[siteId]/page.tsx`, con `siteTotal = site.sitemapTotal ?? countPagesBySite(siteId)`, mostrado solo si `siteTotal > SITE_PAGE_LIMIT`. Agregar las llaves de i18n `sites.pageLimitNotice` en es y en. Verificar que aparece en un sitio de 400 URLs, que no aparece en uno de 60 y que convive con `partialNotice`.

## 2. Paginador reutilizable

- [x] 2.1 Crear `lib/pagination.ts` con una función pura que, dados `page`, `pageSize` y `total`, devuelva el rango `start`/`end`, el número de páginas, la página ajustada a rango y los números a mostrar con elipsis. Verificar con `lib/pagination.test.ts`: casos 0, 8, 37 y 100 filas, cambio de tamaño, página fuera de rango y elipsis con 10 o más páginas.
- [x] 2.2 Crear `components/Pagination.tsx` (controlado, daisyUI `join`/`btn`): primera, anterior, números, siguiente, última, selector 10/25/50 y texto "X–Y de N". Los controles quedan deshabilitados con una sola página. Agregar las llaves de i18n `pagination.*` en es y en. Verificar que `next build` compila y revisar a mano los estados en la tabla de la tarea 3.3.

## 3. Tabla de páginas

- [x] 3.1 Crear `lib/sitePages/rows.ts` con `toPageRow(page, review, t)`, que aplica el respaldo meta description → og:description → null, arma `languagesText` y el conteo y la lista de encabezados. Verificar con `lib/sitePages/rows.test.ts`: los tres casos de descripción, página sin `alternates` (volver a rastrear), página con problemas de hreflang y página sin encabezados.
- [x] 3.2 En `SiteDetailsTabs.tsx`, reordenar columnas a URL | Título | Descripción | Idiomas | Encabezados | Estado | Acción y agregar la celda Descripción, recortada con `title` para el texto completo y "—" si no hay. Agregar la llave de i18n `siteDetails.description` en es y en. Verificar en un sitio real el orden y los tres casos de descripción.
- [x] 3.3 Paginar la tabla con `Pagination` (10 por defecto) usando `slice` sobre `pages`, y mantener `reviewHreflang`, `pagesByUrl` y `HreflangSummary` sobre el arreglo completo. Verificar en un sitio de más de 25 páginas: navegación, cambio de tamaño que vuelve a la página 1, y que una página con su alterno en otro bloque no marca "falta retorno".

## 4. Exportar la tabla a PDF y XLSX

- [x] 4.1 Agregar `jspdf`, `jspdf-autotable` y `exceljs` a `apps/web/package.json`. Verificar que `npm install` y `next build` terminan sin errores.
- [x] 4.2 Crear `lib/sitePages/export.ts` con `buildExportFileName(siteUrl, date, lang)` y una función que convierte las filas en encabezados y celdas para el export (sin Acción y con el orden de la tabla). Verificar con `lib/sitePages/export.test.ts`: nombre `paginas-ejemplo.com-2026-11-26.pdf`, orden de columnas y ausencia de Acción.
- [x] 4.3 Implementar `exportPagesXlsx` con `import('exceljs')`: hoja con encabezado fijo y autofiltro, Estado numérico, descripción completa y columna "Lista de encabezados". Verificar abriendo el archivo de un sitio de 37 páginas en Excel o Numbers: hay 37 filas y las columnas son las esperadas.
- [x] 4.4 Implementar `exportPagesPdf` con `import('jspdf')` y `jspdf-autotable`: A4 horizontal, cabecera con sitio, fecha y conteo, encabezados repetidos por hoja, color de Estado según el distintivo e idiomas como texto. Verificar con el PDF del mismo sitio: todas las páginas, encabezado en cada hoja y estados 200/404/301 con su color.
- [x] 4.5 Agregar a la pestaña "Páginas" el botón "Exportar ▾" con las opciones PDF y XLSX, oculto si no hay páginas, deshabilitado con spinner mientras genera y con `toastError` si falla. Agregar las llaves de i18n `siteDetails.export.*` en es y en. Verificar que exportar desde la página 2 del paginador incluye todas las filas y que el bundle inicial de la ruta no incluye jspdf ni exceljs (revisar los chunks de `next build`).

## 5. Paginación en "Generar todas"

- [x] 5.1 En `app/sites/[siteId]/generate-all/page.tsx`, paginar `rows` con `Pagination` (arriba y abajo de la lista), haciendo que `updateField` use el índice global (o el `suggestionId`) y hacer scroll al encabezado de resultados al cambiar de página. Verificar a mano: editar un resultado en la página 2 modifica esa tarjeta y no la de la página 1, y la edición y su marca "sin guardar" siguen al volver.
- [x] 5.2 Confirmar que `dirtyCount`, "Guardar todo" y "Exportar todo" (JSON) operan sobre todas las filas. Verificar editando resultados en las páginas 1 y 3: el botón indica 2 cambios y ambos se guardan, y exportar desde la página 2 descarga todos los resultados.

## 6. Verificación integral

- [x] 6.1 Ejecutar `npm test` (web y crawler), `tsc --noEmit` y `next build` sin errores. Recorrer en local el flujo completo: rastrear un sitio de más de 100 URLs, revisar el aviso de límite, paginar, exportar a PDF y XLSX, "Generar todas" y paginar y guardar los resultados.
