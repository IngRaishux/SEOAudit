# Design

## Context

Ver proposal.md (Why). Estado actual relevante:

- `apps/crawler`: `crawlSite()` descubre el sitemap, `parseSitemap()` devuelve solo `string[]` de URLs y cada URL pasa por `extractPageSeo` (Crawl4AI) o `extractPageSeoRendered` (Playwright). Ambas llaman a `parseSeoFromHtml(url, html, …, fullHtml)`; el `<head>` solo está en el HTML completo (`$full`), igual que hoy para canonical, og:* y JSON-LD.
- `fast-xml-parser` ya se usa con `ignoreAttributes: false`, así que los `<xhtml:link>` llegan como objetos con `rel`, `hreflang` y `href`.
- `apps/web/app/api/crawl/route.ts` mapea `PageSeo` a documentos `Page` (Mongoose) y `pageRepository.listPagesBySite` selecciona campos concretos para la vista del sitio.
- `SiteDetailsTabs` (cliente) pinta la pestaña Páginas con una tabla daisyUI.
- `app/sugerence/page.tsx` mantiene el formulario en formato DynamoDB con `alternateLanguages.M` de claves fijas `en-US`, `es-MX`, `x-default`, y carga la página con `GET /api/pages/[pageId]` (documento completo).

## Goals / Non-Goals

**Goals:**
- Un único tipo de alterno compartido entre crawler y web.
- La revisión es una función pura sobre las páginas guardadas, con tests, calculada al mostrar el sitio (no se persiste), para que siempre refleje los datos actuales.
- Compatibilidad con páginas ya guardadas sin estos campos.

**Non-Goals:**
- Seguir enlaces fuera del sitemap para verificar retornos: los alternos no rastreados se informan como "no verificable".
- Validar que la URL alterna responda 200.

## Decisions

### 1. Modelo del alterno

```ts
interface HreflangAlternate {
  hreflang: string;            // tal como aparece, sin normalizar
  href: string;                // absoluta
  source: 'html' | 'sitemap' | 'both';
}
// PageSeo y Page: alternates: HreflangAlternate[]; htmlLang: string | null
```

Se exporta desde `apps/crawler` junto a los demás tipos de `parse.ts`. En `Page` (Mongoose) `alternates` es un array de subdocumentos `{ _id: false, hreflang, href, source }` y `htmlLang` un `String`, ambos opcionales. **Una página sin el campo `alternates` (undefined) significa "rastreada antes de la función"; `[]` significa "sin alternos".** La vista usa esa diferencia.

### 2. Extracción en el crawler

- `parse.ts`: `extractAlternates($doc, url)` lee `link[rel="alternate"][hreflang][href]` del documento completo (`rel` puede contener varios valores, se comprueba la palabra `alternate`), resuelve `href` contra la URL de la página, deduplica por `hreflang`+`href` y marca `source: 'html'`. `htmlLang` = `$doc('html').attr('lang')`.
- `sitemap/parse.ts`: nueva `parseSitemapEntries()` que devuelve `{ loc, alternates }[]` leyendo `url['xhtml:link']` (uno o varios) con `rel="alternate"`; `parseSitemap()` sigue devolviendo `string[]` sobre ella para no romper a quien la use.
- `index.ts`: construye un `Map<url, alternates>` del sitemap y, tras extraer cada página, combina con `mergeAlternates(html, sitemap)`: misma pareja código+URL en ambas → `source: 'both'`.

### 3. Revisión (`apps/web/lib/hreflang/review.ts`)

`reviewHreflang(pages)` recibe `{ url, alternates }[]` y devuelve `Map<url, HreflangIssue[]>`:

| Código | Regla |
|---|---|
| `invalid-code` | No es `x-default` ni un código válido (ver abajo); incluye el valor |
| `missing-self` | Ningún alterno apunta a la propia URL |
| `missing-x-default` | Hay alternos y ninguno es `x-default` |
| `conflicting-code` | Un mismo código (sin distinguir mayúsculas) apunta a URLs distintas |
| `missing-return` | Un alterno con código de idioma apunta a una página rastreada cuyos alternos no incluyen esta URL; incluye la URL |
| `x-default-elsewhere` | Solo `x-default` apunta a esa página rastreada y no hay retorno (patrón típico: todas las páginas con `x-default` hacia la portada). La corrección va en esta página, no en la otra |
| `unverifiable` (informativo) | El alterno apunta a una URL no rastreada; no cuenta como problema |

Normalización de URLs para comparar: `URL` → dominio en minúsculas, sin fragmento; se conserva la ruta tal cual (la barra final importa para los buscadores, así que no se elimina).

**Validez del código**, sin listas propias, con las APIs `Intl` del runtime (comprobado en Node):

1. `x-default` es válido.
2. Forma `idioma(-Escritura)?(-REGIÓN)?` con idioma de 2–3 letras, escritura de 4 y región de **2 letras** (Google no admite regiones numéricas como `es-419`). `en_US` o `english` no la cumplen.
3. `Intl.getCanonicalLocales(código)` no debe lanzar, y el resultado debe ser igual al código sin distinguir mayúsculas. Si cambia, es un alias: `en-UK` → `en-GB`, `iw` → `he`. El problema incluye el código sugerido.
4. El idioma debe ser conocido: `new Intl.DisplayNames(['en'], { type: 'language', fallback: 'none' }).of(idioma)` no devuelve `undefined` (descarta `xx`).

`Intl.DisplayNames` por sí solo no basta: acepta `UK` como región porque es un alias. Alternativa descartada: incluir tablas ISO 639-1/3166-1 en el repositorio (más mantenimiento para el mismo resultado).

### 4. Vista de páginas

- `listPagesBySite` añade `alternates htmlLang` al `select`.
- `SiteDetailsTabs` calcula `reviewHreflang` con `useMemo` y:
  - **Resumen** (`stats` compacto o `alert`): páginas con alternos / con problemas, solo si alguna página tiene el campo.
  - **Columna "Idiomas"**: `badge badge-outline badge-sm` por código (orden alfabético, `x-default` al final); `badge-warning` con el número de problemas si los hay; texto atenuado "Vuelve a rastrear para ver idiomas" si `alternates` es `undefined`, y "—" si es `[]`.
  - **Detalle**: `<details>` dentro de la celda con una lista de alternos (código, URL enlazada, fuente traducida) y los problemas traducidos. Sin JavaScript extra y accesible por teclado.
- Textos nuevos en `siteDetails.hreflang.*` (ES/EN).

### 5. Precarga en sugerencias

Función pura `alternatesToForm(alternates)` en `lib/hreflang/form.ts` → `{ 'en-US'?, 'es-MX'?, 'x-default'? }`: coincidencia exacta sin distinguir mayúsculas; si no, el primer alterno cuyo idioma coincide (`en`, `en-GB` → `en-US`). Se aplica:
- al cargar la página, sobre el estado inicial del formulario;
- tras generar con IA (individual y desde el diálogo), sobrescribiendo solo las claves detectadas.

## Risks / Trade-offs

- [La validación depende de los datos ICU del runtime] → Node incluye ICU completo desde la v13; los tests fijan casos conocidos (`en-GB`, `es-MX`, `zh-Hant-TW` y `x-default` válidos; `en-UK` con sugerencia `en-GB`, `es-419`, `en_US`, `english` y `xx` inválidos).
- [Sitemaps grandes con muchos `xhtml:link` aumentan memoria] → Solo se guardan los alternos de las URLs que se rastrean (respeta `maxUrls`).
- [Rastreos parciales generan muchos "no verificable"] → Es informativo y no cuenta como problema.
- [El formulario de sugerencias solo admite tres idiomas] → Los demás alternos siguen visibles en la vista de páginas; ampliar el formato queda fuera de alcance.

## Migration Plan

Sin migración de datos: los campos son opcionales y las páginas antiguas muestran el aviso de volver a rastrear. Para revertir, basta con restaurar los archivos; los campos extra en Mongo se ignoran.
