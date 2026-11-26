# Design

## Context

Estado actual relevante (la motivación está en proposal.md, en "Why"):

- `app/sites/[siteId]/page.tsx` (Server Component) consulta `listPagesBySite(siteId, { limit: 100 })` y pasa el arreglo completo a `SiteDetailsTabs` (Client Component). La tabla se pinta con `pages.map` y sin paginar.
- `SiteDetailsTabs` calcula `reviewHreflang(pages)` y `pagesByUrl` sobre todas las páginas. La revisión de retorno y existencia de alternos necesita ver todas las páginas a la vez.
- `api/sites/[siteId]/generate-all/route.ts` consulta con `limit: 0`, es decir, todas las páginas guardadas.
- `api/crawl/route.ts` llama a `crawlSite` sin `maxUrls`. El crawler ya soporta `maxUrls` (lo usa el crawl gratuito en `lib/free/jobs.ts`), pero su `total` se cuenta **después** de aplicar el tope, así que hoy no se sabe cuántas URLs tenía el sitemap.
- `Site.crawlTruncated` y `Site.sitemapUrlCount` ya existen y significan "se agotó el tiempo: se guardaron `pageCount` de `sitemapUrlCount`". Los usan `sites.partialNotice` y el distintivo "Parcial" del dashboard.
- Cada crawl crea un `Site` nuevo y sus páginas con un solo `insertMany`, así que todas comparten casi el mismo `createdAt`. `listPagesBySite` ordena por `createdAt: -1`, y con empates ese orden no es determinista entre consultas.
- `Page.description` es la meta description. `og:description` se guarda en `Page.metaTags` con `name: 'og:description'`. El `select` de `listPagesBySite` ya incluye `description` y `metaTags`.
- La web no tiene librerías de PDF ni de hojas de cálculo. Usa daisyUI/Tailwind, i18n propio (`lib/i18n/ui.ts`, es/en) y Vitest.

## Goals / Non-Goals

**Goals:**
- Un componente de paginador que reutilicen la tabla de páginas y "Generar todas", independiente de dónde vienen los datos.
- Lógica de filas (descripción, idiomas como texto, encabezados) compartida entre la tabla, el PDF y el XLSX, para que los tres muestren exactamente lo mismo.
- Un único valor de tope para el crawl, la vista y la generación.
- Que la vista y "Generar todas" seleccionen las mismas páginas, en el mismo orden.

**Non-Goals:**
- Paginación del lado del servidor, porque con un tope de 100 no aporta nada y rompería la revisión `hreflang` del sitio completo.
- Generar el PDF en el servidor (por ejemplo con un navegador headless).
- Límites por plan. El tope es una constante. Leerlo del plan queda para otro change.
- Aplicar el tope al crawl gratuito, que ya tiene su propio cupo (`reserved`).

## Decisions

### 1. Paginación en el cliente sobre el arreglo ya cargado
`SiteDetailsTabs` sigue recibiendo todas las páginas, como máximo el tope, y corta el bloque visible con `slice`. `reviewHreflang`, `HreflangSummary` y el export siguen operando sobre el arreglo completo.
- *Alternativa: `skip`/`limit` en el servidor.* Se descarta porque obligaría a mover `reviewHreflang` al servidor y a darle al export su propio endpoint. Esa migración queda abierta gracias a la decisión 2.

### 2. Paginador controlado y sin datos: `components/Pagination.tsx`
Props: `page`, `pageSize`, `total`, `onPageChange`, `onPageSizeChange` y `pageSizeOptions` (por defecto `[10, 25, 50]`). El componente no conoce las filas. Las matemáticas (rango "X–Y de N", número de páginas, ajuste de la página cuando cambia `total` o `pageSize`) van en una función pura `lib/pagination.ts` con pruebas en Vitest. Cuando hay muchas páginas, los números se muestran con elipsis (`1 … 4 [5] 6 … 10`). Estilo con `join`/`btn` de daisyUI.
- Al cambiar `pageSize`, la página vuelve a 1. Si `total` baja y la página actual queda fuera de rango, se ajusta a la última.
- El estado del paginador es local (`useState`). No se guarda en la URL. Es suficiente para este alcance, y si hiciera falta se agrega después sin cambiar la API del componente.

### 3. Modelo de fila compartido: `lib/sitePages/rows.ts`
Una función pura `toPageRow(page, review)` devuelve `{ url, title, description, languages, languagesText, headingsCount, headings, statusCode }`:
- `description`: `page.description` o, si falta, el `content` de `metaTags` con `name === 'og:description'`; si no hay ninguno, `null`.
- `languagesText`: los códigos de los alternos separados por coma, con "⚠ N problemas" si `review.problemCount > 0`, o "Sin anotaciones" (o el texto de "volver a rastrear" si `alternates` no existe). Se reutilizan las llaves de i18n que ya usa `HreflangCell`.

La tabla usa la misma fila para la Descripción. La columna Idiomas en pantalla sigue siendo `HreflangCell`, que es interactivo. El texto plano es solo para el export.
- *Alternativa: calcular cada cosa en su lugar.* Se descarta porque garantiza divergencias entre la pantalla y los archivos.

### 4. Export en el cliente con `import()` dinámico
`lib/sitePages/export.ts` expone `exportPagesPdf(rows, meta, t)` y `exportPagesXlsx(rows, meta, t)`. Las librerías se cargan con `await import(...)` solo al hacer clic, para no inflar el bundle de la página.
- **PDF: `jspdf` + `jspdf-autotable`.**
  - A4 horizontal, con la cabecera (URL del sitio, fecha y número de páginas) en `didDrawPage`.
  - `showHead: 'everyPage'` para repetir encabezados en cada hoja.
  - Anchos de columna fijos (URL y Descripción más anchas) y `overflow: 'linebreak'`.
  - El color del Estado se aplica en `didParseCell`, con los mismos tonos que los distintivos `badge-success`, `badge-error` y `badge-info`.
  - Encabezados de columna con el fondo de `bg-base-200`.
  - *Alternativa: html2canvas o captura del DOM.* Se descarta porque solo captura la página visible, el texto no se puede seleccionar y la calidad es mala.
  - *Alternativa: Puppeteer en el servidor.* Se descarta porque es pesado en Vercel y desproporcionado.
- **XLSX: `exceljs`.** Una hoja "Páginas" con encabezado en negrita y fijo (`views: [{ state: 'frozen', ySplit: 1 }]`), autofiltro, Estado numérico y una columna extra "Lista de encabezados" con los encabezados unidos por ` | `.
  - *Alternativa: SheetJS (`xlsx`).* Se descarta porque la versión publicada en npm (0.18.5) está abandonada y tiene avisos de seguridad conocidos. La versión mantenida solo se distribuye desde su CDN.
- La descarga se hace con `Blob` + `URL.createObjectURL`, igual que el export JSON actual. El nombre es `paginas-<host>-<AAAA-MM-DD>.<ext>`, en el idioma de la UI (`pages-…` en inglés).
- La UI es un botón con un dropdown de daisyUI ("Exportar ▾" → PDF / XLSX). El botón queda deshabilitado con spinner mientras genera, y si falla se muestra un error con `toastError`.

### 5. Tope único: `lib/limits.ts`
`export const SITE_PAGE_LIMIT = 100;` Lo usan:
- `api/crawl/route.ts`: `crawlSite(url, { maxUrls: SITE_PAGE_LIMIT, ... })`.
- `app/sites/[siteId]/page.tsx`: `listPagesBySite(siteId, { limit: SITE_PAGE_LIMIT })`.
- `api/sites/[siteId]/generate-all/route.ts`: el mismo `limit`. `GenerateAllDialog` ya recibe `pages.length`, así que el conteo del diálogo queda alineado sin cambios.

### 6. Orden determinista de páginas
`listPagesBySite` pasa a ordenar por `{ _id: 1 }`. Los `_id` de un `insertMany` crecen en el orden de inserción, que es el orden del sitemap. Así, la vista y "Generar todas" toman las mismas 100 páginas y la tabla sale en el orden del sitemap. Con un solo crawl por sitio, el orden actual "más reciente primero" no aportaba nada.

### 7. Total del sitemap sin romper el significado de "parcial"
- **Crawler:** `CrawlResult` agrega `sitemapTotal`, el número de entradas después de filtrar por host y antes de `maxUrls`. `total` y `truncated` no cambian; `truncated` sigue comparando con `total` ya recortado, así que llegar al tope no marca el crawl como parcial. El cambio es aditivo y el crawl gratuito no se ve afectado.
- **Modelo `Site`:** campo opcional nuevo `sitemapTotal`, que se escribe en `persistCrawlResult`. `sitemapUrlCount` conserva su significado (URLs que se intentaron rastrear), porque de él dependen `partialNotice` y el dashboard.
- **Vista:** el aviso de límite se muestra cuando `siteTotal > SITE_PAGE_LIMIT`, donde `siteTotal = site.sitemapTotal ?? countPagesBySite(siteId)`. El respaldo cubre a los sitios anteriores, que pueden tener más de 100 páginas guardadas. Texto: "Se analizaron {shown} de {total} URLs del sitemap por el límite actual de {limit} páginas". El aviso convive con el de crawl parcial si se dan ambos.
- *Alternativa: reutilizar `sitemapUrlCount` para el total previo al tope.* Se descarta porque cambiaría el "X de Y" de `partialNotice` para crawls que fueron a la vez parciales y limitados.

### 8. "Generar todas": paginación sin tocar el estado de las filas
`rows` sigue siendo un único `useState` con todas las filas. El render usa `rows.slice(start, end)`, y `updateField` debe recibir el **índice global** (`start + i`), no el índice dentro del bloque. `dirtyCount`, `handleSaveAll` y `handleExportAll` siguen operando sobre `rows` completo. Al cambiar de página se hace `scrollIntoView` al encabezado de resultados. El paginador va arriba y abajo de la lista, porque las tarjetas son altas.

## Risks / Trade-offs

- **[Índice local en lugar de global en `updateField`]** Editar una tarjeta de la página 2 modificaría la de la página 1. → Prueba explícita y uso de `suggestionId` como llave. Opcionalmente, `updateField` puede buscar la fila por `suggestionId` en lugar de por índice.
- **[Tamaño de las librerías de export]** `exceljs` y `jspdf` suman cientos de KB. → `import()` dinámico: solo se descargan al exportar.
- **[Caracteres no latinos en el PDF]** Las fuentes estándar de jsPDF (Helvetica, WinAnsi) no cubren CJK ni cirílico, y los títulos en esos idiomas saldrían ilegibles. → Para este alcance (sitios en es/en) basta Helvetica. Se documenta la limitación, y si aparece el caso se incrusta una fuente TTF.
- **[Sitios anteriores con más de 100 páginas]** Siguen teniendo páginas guardadas por encima del tope, que nadie muestra ni procesa. → Es aceptable: el aviso informa el total, y volver a rastrear el sitio produce un sitio nuevo dentro del tope. No se borra nada.
- **[El cambio de orden altera qué 100 páginas ven los sitios anteriores]** Antes se mostraban las 100 de mayor `createdAt` y ahora son las primeras 100 por `_id`. → En sitios anteriores con un solo `insertMany` la diferencia es arbitraria de todos modos. Ahora además coincide con "Generar todas".
- **[Las primeras 100 URLs del sitemap no son necesariamente las más importantes]** → Es aceptable para este alcance. Priorizar URLs (por ejemplo por `priority` o profundidad) queda para el change de límites por plan.

## Migration Plan

No requiere migración de datos: `Site.sitemapTotal` es opcional y los sitios anteriores usan el respaldo `countPagesBySite`. El despliegue es normal en Vercel. El rollback consiste en revertir el commit: los sitios creados con el tope siguen siendo válidos y el campo nuevo se ignora.
