# Design

## Context

Motivación y alcance en `proposal.md`; comportamiento en `specs/`.

Estado actual relevante:

- El crawler (`apps/crawler`, paquete `@seo-optimizer/crawler`) tiene dos rutas: Crawl4AI (`extract.ts`, por defecto) y Playwright (`render.ts`, `renderJs`). Ambas terminan en `parseSeoFromHtml`. Crawl4AI entrega `html` (documento completo) y `cleaned_html` (sin `<head>`); el JSON-LD solo se puede leer de `html`.
- `persistCrawlResult` (`apps/web/app/api/crawl/route.ts`) **crea un `Site` nuevo en cada crawl** y guarda `links: []`. El modelo `Page` ya define `links` e `images`, pero nunca se llenan.
- `robots.txt` ya se descarga en `sitemap/discover.ts`, solo para encontrar el sitemap.
- La IA usa `@google/genai` con `gemini-3.5-flash` y `responseMimeType: 'application/json'` (`generateBulkSEOSuggestions.ts`). Los trabajos largos usan `GenerationJob` + `after()`.
- La UI del sitio usa pestañas en `components/SiteDetailsTabs.tsx` (`serp | pages | meta`) y los textos en `lib/i18n/ui.ts`.
- Los endpoints validan la pertenencia con `Membership` sobre `site.organizationId`.

## Goals / Non-Goals

**Goals:**
- Que el validador, el merge y el armado de llms.txt sean funciones puras y deterministas, fáciles de probar con fixtures (los ejemplos de Las Brisas).
- Que la IA nunca sea la fuente de un dato factual.
- Que cambiar el perfil se refleje de inmediato en los reportes sin volver a crawlear.

**Non-Goals:**
- Validación completa contra el vocabulario de schema.org: solo se evalúan los tipos del catálogo soportado.
- Escribir en el sitio del usuario: solo se entregan bloques y archivos.
- Re-crawl incremental o programado.
- Migrar los crawls existentes: los sitios crawleados antes del cambio piden volver a crawlear.

## Decisions

### 1. Extracción de señales en `parseSeoFromHtml`, desde el HTML completo
JSON-LD, links e imágenes se extraen con Cheerio del documento completo (`fullHtml` en Crawl4AI, `page.content()` en Playwright). El texto del cuerpo y el del footer (`<footer>`, o como respaldo el último bloque de contenido del body) también se extraen ahí. `llms.txt` se pide una vez por sitio en `crawlSite`, junto al descubrimiento del sitemap, y viaja en `CrawlResult`.
- *Alternativa*: usar `result.links` de Crawl4AI. Se descarta porque está tipado como `any[]`, no existe en la ruta de Playwright y no garantiza incluir `tel:` y `mailto:`. Una sola extracción para las dos rutas evita divergencias.
- Límites de texto configurables por constante: cuerpo 20,000 caracteres y footer 4,000, con una bandera `textTruncated`.

### 2. El perfil es una colección propia, con clave `(organizationId, origin)`
El modelo `BusinessProfile` tiene un índice único sobre `{organizationId, origin}`. Contiene `defaultLanguage`, `businessKind` y `entities[]`. Los endpoints reciben un `siteId`, derivan el origen de `site.url` y buscan el perfil. Las páginas que se usan siempre son las del `Site` más reciente completado para ese origen.
- *Alternativa*: un subdocumento en `Site`. Se descarta porque cada crawl crea un `Site` nuevo y el perfil se perdería; cambiar ese comportamiento del crawl está fuera de alcance.
- *Alternativa*: colgarlo de `SiteSettings`. Se descarta porque también está ligado a un `siteId`.

Forma de una entidad:

```
{ key, kind: 'internal' | 'external', type, id, scope?, parentKey?,
  facts:  { name, url, telephone, email, address, geo, logo, image,
            sameAs[], openingHours, checkinTime, ... }  -> {value, source}
  texts:  { description, alternateName[], amenities[] } -> {[lang]: {value, source}} }
```

### 3. Funciones puras del dominio GEO en `apps/web/lib/geo/`
- `url.ts`: normaliza el idioma, asigna la entidad por prefijo más largo y deriva el `@id`.
- `rules.ts`: reglas REQ/REC/EXTRA por tipo como datos, más la jerarquía de subtipos (`Resort` → `LodgingBusiness` → `LocalBusiness` → `Organization`) para "tipo compatible".
- `jsonld.ts`: aplana bloques y `@graph` en nodos y localiza la entidad.
- `audit.ts`: la cascada de niveles y la consistencia (comparación normalizada: dígitos en teléfonos, minúsculas y espacios en email/URL).
- `merge.ts`: `(nodoExistente | null, entidad, lang, pageUrl, resoluciones) -> {bloque, diff, conflictos}`.
- `llmsTxt.ts`: validador del formato y renderizador desde una estructura `{title, summary, contact, sections[]}`.

Los reportes se calculan **al pedirlos** (no se persisten): son baratos (cientos de páginas) y así siempre reflejan el perfil vigente.
- *Alternativa*: calcularlos en el crawl. Se descarta porque dependen del perfil, que cambia después.

### 4. La IA propone y el código verifica
Se usa Gemini (mismo cliente y modelo) con salida JSON en tres puntos:
1. **Extracción literal** (dirección, amenidades, nombre alternativo): la respuesta incluye la cita de origen y el código **descarta todo valor cuya cita no aparezca** en el texto de la página (comparación normalizada). Así se cumple "nunca inventar" del spec.
2. **Clasificación**: tipo de negocio y qué grupos de URL son propiedades. Gemini recibe solo los grupos (prefijo, conteo, títulos de muestra) y responde con prefijos existentes. Se descartan los que no estaban en la entrada.
3. **Redacción**: `description` y el resumen del llms.txt, guardados con fuente `generated`.

Los datos deterministas (tel, mailto, redes por dominio conocido, coordenadas de links de Google Maps, `og:image`) se resuelven sin IA. La prioridad de fuentes la aplica el código, no el prompt.

### 5. Merge determinista y resolución en dos pasos
`GET .../structured-data` devuelve el reporte y, por página, el bloque propuesto con sus conflictos sin resolver (por defecto se mantiene el valor existente). `POST .../structured-data/resolve` recibe `{pageId, resolutions: {path: 'keep' | 'profile'}}` y devuelve el bloque final. Aceptar un cambio de `@id` se registra a nivel de sitio y se aplica a todas las referencias de los bloques generados.

Los bloques se entregan agrupados por destino: **global** (Organization, WebSite), **por entidad** (el nodo de hospedaje, igual en todas las páginas del scope salvo `url` y textos por idioma) y **por página** (solo si la página tiene un nodo propio que completar).

### 6. llms.txt: estructura por código, contenido por selección
El código arma la estructura (H1 desde la entidad raíz, contacto desde `facts` y secciones por propiedad en cadenas). Gemini solo **elige y agrupa** páginas a partir de una lista de ids `{id, path, title, description}` filtrada antes (status 200, canónica, idioma elegido). Los ids que no estaban en la lista se descartan. Las descripciones de los links salen de la meta description de cada página.

### 7. API y UI
Nuevas rutas bajo `app/api/sites/[siteId]/`: `profile` (GET/PUT), `profile/suggest` (POST: tipo, entidades y pre-llenado), `structured-data` (GET), `structured-data/resolve` (POST), `llms-txt` (GET estado, POST generar). Todas siguen la validación de `Membership` existente. La sugerencia de perfil y la generación del llms.txt son llamadas síncronas acotadas (pocas llamadas a Gemini); no necesitan `GenerationJob`.

En la UI se agrega una pestaña **GEO** en `SiteDetailsTabs` con tres secciones: Perfil, Datos estructurados y llms.txt. Los textos van en `lib/i18n/ui.ts`.

## Risks / Trade-offs

- [Gemini extrae un valor que parece literal pero está mal acotado (dirección parcial)] → El usuario confirma el perfil antes de usarlo para generar; los valores `extracted` se muestran resaltados como "por confirmar".
- [JSON-LD inyectado tarde por JS (GTM) no aparece en el HTML de Crawl4AI] → Documentar que `renderJs` lo captura; si una página no tiene JSON-LD pero el usuario dice que sí lo tiene, sugerir volver a crawlear con render.
- [WAF o CDN bloquea `/llms.txt` desde el servidor] → Estado `unknown`, distinto de `missing`, para no generar falsos negativos.
- [El texto guardado aumenta el tamaño de `Page`] → Límites por constante y bandera de truncado; en el peor caso son ~500 páginas × ~24 KB ≈ 12 MB por crawl.
- [Las reglas de completitud reflejan la práctica de un solo autor] → Viven como datos en `rules.ts`, se ajustan sin tocar la lógica y se prueban con los ejemplos de Las Brisas como fixtures.
- [Un sitio con varios `Site` del mismo origen en distintas organizaciones] → La clave incluye `organizationId`; cada organización tiene su propio perfil.
- [Prefijo de idioma ambiguo (un hotel con slug de dos letras como `/la/`)] → Normalizar solo si el segmento coincide con los idiomas detectados en el sitio (los que aparecen como primer segmento en varias páginas o en `hreflang`), no con cualquier patrón de dos letras.

## Migration Plan

- Sin migración de datos: los campos nuevos de `Page` y `Site` son opcionales. Para sitios crawleados antes del cambio, la pestaña GEO pide volver a crawlear.
- Se crea la colección `BusinessProfile` y su índice único al desplegar (con `autoIndex` de Mongoose, como el resto de los modelos).
- Rollback: quitar la pestaña y las rutas. Los campos nuevos en Mongo no afectan al código anterior.

## Open Questions

- Valores finales de los límites de texto (20,000 y 4,000 caracteres): se ajustan con datos reales sin afectar los specs.
- Lista inicial de dominios de redes sociales reconocidos para `sameAs` (Facebook, Instagram, TikTok, LinkedIn, YouTube, X/Twitter, TripAdvisor): se puede ampliar sin cambiar el diseño.
