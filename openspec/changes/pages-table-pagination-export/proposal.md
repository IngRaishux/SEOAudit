# Proposal

## Why

La pestaña "Páginas" de un sitio pinta todas las filas sin paginar. Con más de 10 páginas hay que hacer scroll largo, y la pantalla de "Generar todas" (`generate-all`) tiene el mismo problema, pero peor: cada página es una tarjeta editable. La tabla tampoco muestra la descripción de cada página, que es el dato SEO que más se revisa junto al título, y no hay forma de sacar los datos para compartirlos con un cliente.

Además, el tope de 100 páginas por sitio, que se conserva a propósito para los planes de pago y para no rastrear sitios gigantes, solo existe en la vista. El crawl autenticado rastrea y guarda todas las URLs del sitemap, y "Generar todas" manda a la IA todas las páginas guardadas, aunque la tabla solo muestre 100. Lo que el usuario ve no coincide con lo que se rastrea ni con lo que se cobra en tokens.

## What Changes

- **Tabla de páginas**:
  - Paginador con 10, 25 o 50 filas por página (10 por defecto) y el rango "X–Y de N".
  - Nueva columna **Descripción** después del título. Usa la meta description y, si falta, `og:description`.
  - Nuevo orden de columnas: URL | Título | Descripción | Idiomas | Encabezados | Estado | Acción.
- **Exportar la tabla** desde un botón arriba de ella:
  - **PDF** con el mismo formato visual de la tabla: columnas, estado con su color e idiomas como texto.
  - **XLSX** con una fila por página.
  - Los dos exportan todas las páginas que muestra la vista, no solo la página actual, y omiten la columna Acción.
- **Tope único de páginas por sitio** (100 por ahora):
  - El crawl autenticado deja de rastrear las URLs del sitemap que pasen el tope.
  - "Generar todas" procesa solo las páginas dentro del tope.
  - La vista consulta con el mismo valor.
  - Cuando el sitemap tiene más URLs que el tope, la vista avisa cuántas se analizaron de cuántas.
- **Generar todas**:
  - Las tarjetas de resultados se paginan con el mismo paginador.
  - Las ediciones sin guardar se conservan al cambiar de página.
  - "Guardar todo" sigue incluyendo los cambios de todas las páginas.

**Fuera de alcance**:

- Exportar a PDF o XLSX en "Generar todas", que conserva su export JSON.
- Paginación del lado del servidor.
- Límites distintos por plan.
- Usar o eliminar `SiteSettings.maxPages`.
- Borrar las páginas que sitios rastreados antes de este cambio ya tengan por encima del tope.

## Capabilities

### New Capabilities

- `site-pages-view`: tabla de páginas de un sitio. Cubre columnas y su orden, la descripción con su respaldo, la paginación y el aviso cuando el sitemap supera el tope.
- `site-pages-export`: exportar la tabla de páginas de un sitio a PDF y XLSX.
- `site-page-limit`: tope de páginas por sitio, aplicado igual en el crawl, la vista y la generación masiva de sugerencias.
- `bulk-suggestions-review`: revisión de los resultados de "Generar todas", incluida su paginación y la conservación de ediciones sin guardar.

### Modified Capabilities

(ninguna: el proyecto aún no tiene specs principales)

## Impact

- **Web**:
  - `components/SiteDetailsTabs.tsx`: tabla, columnas, paginador y botón de export.
  - `app/sites/[siteId]/page.tsx`: tope y aviso.
  - `app/sites/[siteId]/generate-all/page.tsx`: paginador.
  - `app/api/sites/[siteId]/generate-all/route.ts`: tope.
  - `app/api/crawl/route.ts`: `maxUrls` y total del sitemap.
  - Nuevo componente de paginador reutilizable.
  - Nuevo módulo de export.
  - Nuevas llaves de i18n (es/en).
- **Crawler** (`apps/crawler/src/index.ts`): el resultado informa también el total de URLs del sitemap antes de aplicar `maxUrls`. Es aditivo y compatible.
- **Modelo `Site`**: nuevo campo opcional con el total de URLs del sitemap. Los sitios existentes no lo tienen y se tratan con respaldo.
- **Dependencias nuevas** (web, cargadas solo al exportar): `jspdf`, `jspdf-autotable` y `exceljs`.
