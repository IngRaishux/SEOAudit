# Crawler Integration - Crawl4AI Self-Hosted

Este documento describe la integración de **crawl4ai self-hosted** en la aplicación SEOAudit para web scraping sin costos de Firecrawl.

## Arquitectura

```
Next.js App (apps/web)
    ↓
Crawler Package (apps/crawler)
    ↓
Crawl4AI Client (@seo-optimizer/crawler/src/crawler/crawl4ai-client.ts)
    ↓
Crawl4AI Service (Docker Container)
    ↓ HTTP POST /crawl
    ↓
Returns: HTML, Metadata, Links
```

## Configuración Requerida

### Variables de Entorno

En `apps/web/.env.local`:

```env
# URL del servicio Crawl4AI
CRAWL4AI_URL=http://localhost:11235

# Token de API para autenticación
CRAWL4AI_API_TOKEN=tu-token-secreto

# Configuración del crawler
CRAWLER_CONCURRENCY=5
CRAWLER_TIMEOUT_MS=10000
```

### Contenedor Docker

El servicio crawl4ai debe estar corriendo con:

```bash
docker run -d \
  --name crawl4ai \
  -p 11235:11235 \
  -e CRAWL4AI_API_TOKEN=tu-token-secreto \
  unclecode/crawl4ai:latest
```

**Importante:** El token debe ser **exactamente igual** en:
- Variable de entorno `CRAWL4AI_API_TOKEN`
- Header `Authorization: Bearer <token>` que envía el cliente

## Endpoints Disponibles

### `/crawl` - Crawl múltiples URLs

**Request:**
```bash
POST /crawl
Authorization: Bearer <token>
Content-Type: application/json

{
  "urls": ["https://example.com", "https://example.com/page"]
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "url": "https://example.com",
      "html": "...",
      "cleaned_html": "...",
      "status_code": 200,
      "metadata": {
        "title": "Example",
        "description": "...",
        "keywords": null,
        "author": null
      },
      "links": {
        "internal": [],
        "external": [...]
      }
    }
  ]
}
```

### `/md` - Obtener Markdown

**Request:**
```bash
POST /md
Authorization: Bearer <token>
Content-Type: application/json

{
  "url": "https://example.com",
  "filter": "fit",
  "cache": "0"
}
```

**Response:**
```json
{
  "url": "https://example.com",
  "markdown": "# Title\nContent...",
  "success": true
}
```

### `/health` - Health Check

```bash
GET /health
# No requiere autenticación
# Response: {"status":"ok","version":"0.9.3"}
```

## Flujo de Crawling

### 1. Usuario inicia crawl desde UI

```
POST /api/crawl
Body: { url: "https://example.com", organizationId: "..." }
```

### 2. API crea un Job

- Genera `jobId` y `siteId`
- Devuelve inmediatamente al cliente
- Inicia el crawl en background

### 3. Crawler ejecuta

```typescript
// apps/web/app/api/crawl/route.ts
const result = await crawlSite(job.url, {
  concurrency: 5,
  crawl4aiUrl: process.env.CRAWL4AI_URL,
  onProgress: (processed, total) => {
    // Actualizar estado del job
  },
});
```

### 4. Extrae metadata SEO

```typescript
// apps/crawler/src/crawler/extract.ts
const result = await crawlWithCrawl4AI(url, baseUrl, timeout, apiToken);
const html = result.cleaned_html || result.html;
const pageSeo = parseSeoFromHtml(url, html, result.status_code, loadTime, result.metadata);
```

### 5. Persiste en MongoDB

- Crea `Site` con título y descripción
- Crea `Pages` con SEO data
- Actualiza `Site.pageCount` y `Site.crawlStatus`

## Troubleshooting

### Error: "Authentication required" (401)

**Causa:** Token no coincide o no se pasa correctamente.

**Soluciones:**
1. Verifica que `CRAWL4AI_API_TOKEN` en `.env.local` sea **exacto** al del contenedor
2. Reinicia la app: `rm -rf .next && npm run dev`
3. Verifica los logs: `[Crawl4AI] Crawling ... Bearer <token>`

### Error: "Connection refused"

**Causa:** Crawl4ai no está corriendo o puerto incorrecto.

**Soluciones:**
```bash
docker ps | grep crawl4ai  # Verifica que esté corriendo
docker logs crawl4ai       # Ve los logs
docker restart crawl4ai    # Reinicia si es necesario
```

### Error: "Crawl4AI returned empty results"

**Causa:** El sitio devolvió un error o no es accesible.

**Soluciones:**
1. Intenta el sitio manualmente: `curl https://example.com`
2. Verifica `status_code` en la respuesta
3. Aumenta `CRAWLER_TIMEOUT_MS` si es un sitio lento

## Performance

### Concurrencia

- `CRAWLER_CONCURRENCY=5` - Crawlea hasta 5 URLs simultáneamente
- Aumenta para sitios grandes, disminuye si ves memory leaks

### Timeouts

- `CRAWLER_TIMEOUT_MS=10000` - 10 segundos por URL
- Aumenta para sitios complejos con mucho JS

### Limpieza

El contenedor limpia automáticamente:
- Cache de sesiones
- Archivos temporales
- Conexiones inactivas

## Monitoreo

### Logs de la App

```bash
npm run dev 2>&1 | grep "Crawl4AI"
```

Debería mostrar:
```
[Crawl4AI] Crawling https://...
[Crawl4AI] Successfully crawled https://...
```

### Logs del Contenedor

```bash
docker logs -f crawl4ai
```

Buscar errores o warnings.

### Métricas

Se registran en cada crawl:
- `loadTimeMs` - Tiempo de carga de la página
- `wordCount` - Palabras en el contenido
- `status_code` - HTTP status

## Versión

- **Crawl4AI:** v0.9.3
- **Última actualización:** 2026-09-25

## Referencias

- [Crawl4AI GitHub](https://github.com/unclecode/crawl4ai)
- [Documentación oficial](https://docs.crawl4ai.com/)
