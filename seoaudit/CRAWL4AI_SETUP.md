# Integración Crawl4AI Self-Hosted

Guía de configuración e integración de **crawl4ai self-hosted** para web scraping sin costos.

## Inicio Rápido

### 1. Clonar Repositorio Oficial

```bash
cd /Users/hescobar/Proyectos
git clone https://github.com/unclecode/crawl4ai.git
cd crawl4ai
```

### 2. Levantarlo con Docker Compose

```bash
# Levanta crawl4ai en http://localhost:11235
docker compose up --build -d

# O con imagen pre-built (más rápido)
IMAGE=unclecode/crawl4ai:latest docker compose up -d
```

### 3. Configurar Variables de Entorno

En `apps/web/.env.local`:

```env
# URL del servicio Crawl4AI
CRAWL4AI_URL=http://localhost:11235

# Token de API (DEBE SER IGUAL al del contenedor)
CRAWL4AI_API_TOKEN=tu-token-secreto

# Configuración del crawler
CRAWLER_CONCURRENCY=5
CRAWLER_TIMEOUT_MS=10000
```

### 4. Iniciar la Aplicación

```bash
cd /Users/hescobar/Proyectos/SEOAudit/seoaudit
npm run dev
```

## Levantar Manualmente sin Docker Compose

Si prefieres levantar el contenedor directamente:

```bash
# Asegúrate de tener la imagen
docker pull unclecode/crawl4ai:latest

# Crea el contenedor
docker run -d \
  --name crawl4ai \
  -p 11235:11235 \
  -e CRAWL4AI_API_TOKEN=tu-token-secreto \
  unclecode/crawl4ai:latest

# Verifica que esté corriendo
docker ps
docker logs crawl4ai
```

## Verificar Conexión

### Test Manual

```bash
# Health check (sin autenticación)
curl http://localhost:11235/health

# Crawl una URL (con autenticación)
curl -X POST http://localhost:11235/crawl \
  -H "Authorization: Bearer tu-token-secreto" \
  -H "Content-Type: application/json" \
  -d '{"urls": ["https://example.com"]}' \
  --max-time 30
```

### Desde la App

```bash
npm run dev
# Haz un crawl desde la UI
# Deberías ver: [Crawl4AI] Successfully crawled ...
```

## Arquitectura de Integración

```
POST /api/crawl
    ↓
apps/web/app/api/crawl/route.ts (API route)
    ↓
crawlSite() - apps/crawler/src/index.ts
    ↓
extractPageSeo() - apps/crawler/src/crawler/extract.ts
    ↓
crawlWithCrawl4AI() - apps/crawler/src/crawler/crawl4ai-client.ts
    ↓
HTTP POST http://localhost:11235/crawl
    ↓
Docker Container (crawl4ai)
    ↓
Returns: HTML, cleaned_html, metadata, links, status_code
    ↓
parseSeoFromHtml() - Extrae title, description, headings, etc.
    ↓
Persiste en MongoDB
```

## Endpoints Disponibles

### `/crawl` - Crawl múltiples URLs (RECOMENDADO)

```bash
POST /crawl
Authorization: Bearer <token>
Content-Type: application/json

{
  "urls": ["https://example.com"]
}

Response:
{
  "success": true,
  "results": [{
    "url": "https://example.com",
    "html": "...",
    "cleaned_html": "...",
    "status_code": 200,
    "metadata": {
      "title": "...",
      "description": "...",
      "keywords": null,
      "author": null
    },
    "links": {
      "internal": [],
      "external": [...]
    }
  }]
}
```

### `/md` - Obtener Markdown

```bash
POST /md
Authorization: Bearer <token>
Content-Type: application/json

{
  "url": "https://example.com",
  "filter": "fit",
  "cache": "0"
}

Response:
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

Response:
{
  "status": "ok",
  "version": "0.9.3",
  "timestamp": 1695...
}
```

## Troubleshooting

### Error: "Authentication required" (401)

**Causa:** Token no coincide entre la app y el contenedor.

**Solución:**
1. Verifica que `CRAWL4AI_API_TOKEN` en `.env.local` sea **exacto**
2. Asegúrate de que el contenedor se levantó con ese mismo token
3. Limpia cache: `rm -rf .next && npm run dev`
4. Mira logs: `[Crawl4AI] Crawling ... Bearer <token>`

```bash
# Recrear contenedor con token correcto
docker stop crawl4ai && docker rm crawl4ai
docker run -d \
  --name crawl4ai \
  -p 11235:11235 \
  -e CRAWL4AI_API_TOKEN=tu-token-correcto \
  unclecode/crawl4ai:latest
```

### Error: "Connection refused"

**Causa:** Crawl4ai no está corriendo o en puerto diferente.

```bash
docker ps | grep crawl4ai              # Verifica que esté corriendo
docker logs crawl4ai                   # Ve los logs
docker inspect crawl4ai | grep -i port # Verifica el puerto
```

### Error: "Crawl4AI returned empty results"

**Causa:** El sitio no es accesible o cambió su estructura.

```bash
# Test el sitio manualmente
curl https://example.com -I

# Aumenta timeout en .env.local
CRAWLER_TIMEOUT_MS=30000

# Verifica status_code en logs
```

## Optimización

### Performance

- `CRAWLER_CONCURRENCY=5` - Aumenta para sitios grandes
- `CRAWLER_TIMEOUT_MS=10000` - Aumenta para JS heavy
- Monitorea memory: `docker stats crawl4ai`

### Monitoreo

```bash
# Logs en tiempo real
docker logs -f crawl4ai

# O desde la app
npm run dev 2>&1 | grep "Crawl4AI"
```

## Producción

### Deployment

1. **Docker Compose en servidor:**
```bash
cd /path/to/crawl4ai
export CRAWL4AI_API_TOKEN=prod-token-secreto
docker compose up -d
```

2. **Con Nginx reverse proxy:**
```nginx
location /crawl {
  proxy_pass http://localhost:11235;
  proxy_set_header Authorization "Bearer $http_authorization";
}
```

3. **Configurar restart automático:**
```bash
docker run -d \
  --restart=unless-stopped \
  --name crawl4ai \
  -p 11235:11235 \
  -e CRAWL4AI_API_TOKEN=prod-token \
  unclecode/crawl4ai:latest
```

## Archivos Importantes

- `apps/crawler/src/crawler/crawl4ai-client.ts` - Cliente HTTP
- `apps/crawler/src/crawler/extract.ts` - Extracción de SEO
- `apps/web/app/api/crawl/route.ts` - API endpoint
- `apps/web/docs/CRAWLER_INTEGRATION.md` - Documentación detallada

## Recursos

- [GitHub Crawl4AI](https://github.com/unclecode/crawl4ai)
- [Documentación Oficial](https://docs.crawl4ai.com/)
- [Versión Actual: v0.9.3](https://github.com/unclecode/crawl4ai/releases/tag/v0.9.3)

## Última Actualización

**2026-09-25** - Integración completamente funcional con endpoint `/crawl`
