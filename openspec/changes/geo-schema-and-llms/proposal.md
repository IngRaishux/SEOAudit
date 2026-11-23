# Proposal

## Why

Los motores de búsqueda con IA (ChatGPT Search, Perplexity, AI Overviews) dependen de datos estructurados confiables y de un mapa claro del sitio para entender y citar a un negocio. Hoy SEOAudit solo sugiere title/description: no revisa si un sitio tiene JSON-LD ni `llms.txt`, y no ayuda a crearlos o completarlos. Esta herramienta es autoservicio para cualquier negocio, con hoteles y cadenas hoteleras como caso principal, por lo que las salidas deben ser formatos estándar y no formatos propietarios.

## What Changes

- **Perfil de negocio por sitio**: un grafo de entidades (Organization, familia LodgingBusiness —Hotel, Resort, BedAndBreakfast, etc.— y tipos genéricos como LocalBusiness) con:
  - Soporte para cadenas: un sitio con N hoteles, cada uno con un scope por prefijo de URL (`/acapulco/`), y una organización padre.
  - Entidades externas solo referenciadas (p. ej. un grupo corporativo en otro dominio).
  - Normalización de idioma en la URL (`/en/acapulco/` mapea al mismo hotel que `/acapulco/`).
  - Campos factuales con un solo valor y campos textuales por idioma.
  - Detección sugerida de hoteles agrupando URLs; el usuario confirma.
  - Pre-llenado desde el JSON-LD existente, extracción determinista (links `tel:`/`mailto:`, redes sociales, Google Maps, `og:image`) y extracción literal con IA (dirección, amenidades). Nunca se inventan datos factuales; la IA solo genera textos como `description`, marcados como generados.
- **Revisión de JSON-LD por página** en niveles: existe → válido → tipo esperado (según el perfil) → completo (reglas REQ/REC por tipo; campos EXTRA solo como sugerencia) → consistente con el perfil. Detección a nivel de sitio de `@id` dependientes del idioma.
- **Completar o generar JSON-LD**: merge determinista que nunca borra propiedades existentes, agrega las faltantes desde el perfil y presenta los conflictos (incluido el cambio de `@type` o de `@id`) para que el usuario decida. `@id` único sin idioma por entidad; `url` por idioma. Se entrega el bloque `<script type="application/ld+json">` completo con un diff e indicación de dónde va (todo el sitio, por hotel o por página).
- **Revisión y generación de `llms.txt`**: comprobar si `/llms.txt` existe y tiene formato válido; si falta, generar uno en la raíz del dominio a partir del perfil y de las páginas crawleadas (secciones por hotel en cadenas, con selección de páginas relevantes en vez de listar todas).
- **Captura adicional en el crawl**: guardar el JSON-LD crudo del documento renderizado, el texto del cuerpo/footer necesario para la extracción, los links (hoy se persisten vacíos), las imágenes y el contenido de `/llms.txt` a nivel de sitio.
- **El perfil sobrevive a los re-crawls**: cada crawl crea hoy un `Site` nuevo, así que el perfil se asocia a la organización + origen del sitio y no a un `Site` concreto.

**Fuera de alcance**: checks de robots.txt y AI crawlers, PageSpeed, recomendaciones agregadas y exportación al formato DynamoDB/Revenatium.

## Capabilities

### New Capabilities
- `business-profile`: perfil de negocio por sitio como grafo de entidades tipadas con scopes por URL, idiomas, entidades externas, detección de propiedades y pre-llenado con trazabilidad de la fuente de cada campo.
- `structured-data`: revisión por niveles del JSON-LD de cada página contra reglas por tipo y contra el perfil, y completado/generación determinista del bloque con diff y conflictos.
- `llms-txt`: revisión de la existencia y el formato de `/llms.txt` y generación del archivo a partir del perfil y del crawl.
- `site-crawl`: captura de las señales de contenido que GEO necesita (JSON-LD crudo, texto de cuerpo/footer, `/llms.txt`).

### Modified Capabilities
<!-- No hay specs existentes en openspec/specs/. -->

## Impact

- **Crawler** (`apps/crawler/src/crawler/parse.ts`, `crawl4ai-client.ts`, `render.ts`, `sitemap/discover.ts`): extraer el JSON-LD de `fullHtml` (el `cleaned_html` no trae `<head>`), extraer links e imágenes, conservar texto relevante y obtener `/llms.txt`.
- **Persistencia del crawl** (`apps/web/app/api/crawl/route.ts`): `persistCrawlResult` hoy guarda `links: []`; debe persistir las nuevas señales.
- **Modelos** (`apps/web/lib/models/Page.ts`, `Site.ts`): nuevos campos para las señales capturadas y un nuevo modelo o subdocumento de perfil de negocio en Mongo.
- **Generación** (`apps/web/lib/`): nuevos módulos de validación, merge y generación; reutiliza `@google/genai` solo para la extracción literal y los textos. No reutiliza el formato Dynamo de `generateSEOSuggestions.ts`.
- **UI** (`apps/web/app/sites/[siteId]/`): flujo de perfil (tipo de negocio, entidades, confirmación), reporte por página y vistas de copiar/descargar para JSON-LD y `llms.txt`.
- **Almacenamiento**: más volumen por página en Mongo por el texto guardado; hay que acotarlo en el diseño.
