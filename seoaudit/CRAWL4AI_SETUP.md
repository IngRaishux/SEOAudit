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

### Opción 1: Docker en el mismo servidor (Recomendado para inicio)

1. **Clonar repositorio de crawl4ai en el servidor:**
```bash
cd /var/www
git clone https://github.com/unclecode/crawl4ai.git
cd crawl4ai
```

2. **Crear `.env` con token seguro:**
```bash
# Generar token aleatorio
TOKEN=$(openssl rand -base64 32)
echo "CRAWL4AI_API_TOKEN=$TOKEN" > .env
```

3. **Levantar con Docker Compose:**
```bash
# Con imagen pre-built (más rápido)
IMAGE=unclecode/crawl4ai:latest docker compose up -d

# O compilar desde código
docker compose up --build -d
```

4. **Verificar que esté corriendo:**
```bash
docker ps | grep crawl4ai
docker logs crawl4ai
```

### Opción 2: Servidor separado (Escalable)

Si quieres separar crawl4ai de la app Next.js:

1. **Servidor A (Crawl4AI):**
```bash
# IP: 192.168.1.100 (interna)
docker run -d \
  --restart=unless-stopped \
  --name crawl4ai \
  -p 11235:11235 \
  -e CRAWL4AI_API_TOKEN=tu-token-prod \
  --memory=4g \
  --cpus=2 \
  unclecode/crawl4ai:latest
```

2. **Servidor B (Next.js App):**
```bash
# En apps/web/.env.production
CRAWL4AI_URL=http://192.168.1.100:11235
CRAWL4AI_API_TOKEN=tu-token-prod
NODE_ENV=production
```

3. **Firewall (iptables o cloud security group):**
```bash
# Solo permitir traffic desde servidor Next.js
iptables -A INPUT -p tcp --dport 11235 -s 192.168.1.200 -j ACCEPT
iptables -A INPUT -p tcp --dport 11235 -j DROP
```

### Opción 3: Nginx Reverse Proxy (Producción Robusta)

Si expones crawl4ai a internet:

```nginx
# /etc/nginx/sites-available/crawl4ai
upstream crawl4ai_backend {
  server localhost:11235 max_fails=3 fail_timeout=30s;
}

server {
  listen 80;
  server_name crawl4ai.tudominio.com;
  
  # Redirigir a HTTPS
  return 301 https://$server_name$request_uri;
}

server {
  listen 443 ssl http2;
  server_name crawl4ai.tudominio.com;
  
  ssl_certificate /etc/letsencrypt/live/crawl4ai.tudominio.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/crawl4ai.tudominio.com/privkey.pem;
  
  # Rate limiting
  limit_req_zone $binary_remote_addr zone=crawl_limit:10m rate=10r/s;
  limit_req zone=crawl_limit burst=20 nodelay;
  
  location / {
    proxy_pass http://crawl4ai_backend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Authorization $http_authorization;
    
    # Timeouts más largos para crawling
    proxy_connect_timeout 10s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
  }
}
```

Certificado SSL:
```bash
certbot certonly --standalone -d crawl4ai.tudominio.com
```

### Opción 4: Kubernetes (Escalable y Resiliente)

```yaml
# crawl4ai-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: crawl4ai
  namespace: default
spec:
  replicas: 2
  selector:
    matchLabels:
      app: crawl4ai
  template:
    metadata:
      labels:
        app: crawl4ai
    spec:
      containers:
      - name: crawl4ai
        image: unclecode/crawl4ai:latest
        ports:
        - containerPort: 11235
        env:
        - name: CRAWL4AI_API_TOKEN
          valueFrom:
            secretKeyRef:
              name: crawl4ai-secrets
              key: api-token
        resources:
          requests:
            memory: "2Gi"
            cpu: "1"
          limits:
            memory: "4Gi"
            cpu: "2"
        livenessProbe:
          httpGet:
            path: /health
            port: 11235
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 11235
          initialDelaySeconds: 10
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: crawl4ai-service
spec:
  selector:
    app: crawl4ai
  ports:
  - protocol: TCP
    port: 11235
    targetPort: 11235
  type: ClusterIP
```

Desplegar:
```bash
# Crear secret
kubectl create secret generic crawl4ai-secrets \
  --from-literal=api-token=$(openssl rand -base64 32)

# Desplegar
kubectl apply -f crawl4ai-deployment.yaml

# Verificar
kubectl get pods -l app=crawl4ai
kubectl logs -l app=crawl4ai
```

### Configuración de Variables de Entorno en Producción

**Next.js App (.env.production):**
```env
# Según tu opción elegida:

# Opción 1 (mismo servidor)
CRAWL4AI_URL=http://localhost:11235

# Opción 2 (servidor separado)
CRAWL4AI_URL=http://192.168.1.100:11235

# Opción 3 (Nginx reverse proxy)
CRAWL4AI_URL=https://crawl4ai.tudominio.com

# Opción 4 (Kubernetes)
CRAWL4AI_URL=http://crawl4ai-service.default.svc.cluster.local:11235

# Token (USAR SECRETS, NO HARDCODEAR)
CRAWL4AI_API_TOKEN=<valor-desde-secrets-manager>

# Configuración de crawler
CRAWLER_CONCURRENCY=10  # Aumentar en producción
CRAWLER_TIMEOUT_MS=30000  # 30 segundos

# Node env
NODE_ENV=production
```

### Gestión de Secrets en Producción

**Opción 1: Vercel (si usas Vercel para Next.js):**
1. Ir a Project Settings → Environment Variables
2. Agregar `CRAWL4AI_API_TOKEN` y `CRAWL4AI_URL`
3. Seleccionar ambiente: Production

**Opción 2: AWS Secrets Manager:**
```bash
aws secretsmanager create-secret \
  --name crawl4ai/api-token \
  --secret-string "tu-token-prod"

# Usar en la app
const token = await getSecretValue('crawl4ai/api-token');
```

**Opción 3: HashiCorp Vault:**
```bash
vault kv put secret/crawl4ai \
  api_token="tu-token-prod" \
  api_url="https://crawl4ai.tudominio.com"
```

### Monitoreo en Producción

1. **Health checks:**
```bash
# Cron job cada 5 minutos
*/5 * * * * curl -f https://crawl4ai.tudominio.com/health || alert

# O usar uptimerobot.com (gratuito)
```

2. **Logs y errores:**
```bash
# ELK Stack o Datadog
docker logs crawl4ai | filebeat → elasticsearch

# CloudWatch (AWS)
docker run ... --log-driver awslogs \
  --log-opt awslogs-group=/crawl4ai \
  --log-opt awslogs-region=us-east-1
```

3. **Métricas:**
```bash
# Prometheus en crawl4ai
# Ver si hay endpoint /metrics
curl https://crawl4ai.tudominio.com/metrics
```

4. **Alertas:**
```bash
# Si tasa de error > 5% en 5 min
# Si response time > 30s
# Si contenedor reinicia > 3 veces en 1 hora
```

### Reinicio Automático

**systemd (VPS Linux):**
```ini
# /etc/systemd/system/crawl4ai.service
[Unit]
Description=Crawl4AI Docker Container
After=docker.service
Requires=docker.service

[Service]
Type=simple
ExecStart=/usr/bin/docker run --rm \
  --name crawl4ai \
  -p 11235:11235 \
  -e CRAWL4AI_API_TOKEN=%i \
  unclecode/crawl4ai:latest
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Habilitar:
```bash
systemctl enable crawl4ai
systemctl start crawl4ai
```

### Checklist de Producción

- [ ] Token generado con `openssl rand -base64 32`
- [ ] Variables de entorno en secrets manager (no .env)
- [ ] Firewall configurado (solo acceso interno)
- [ ] SSL/TLS activado (Nginx con Let's Encrypt)
- [ ] Health checks configurados
- [ ] Logs y monitoreo activos
- [ ] Backup de datos (si usas caché local)
- [ ] Rate limiting implementado
- [ ] Reinicio automático configurado
- [ ] Tested bajo carga (load testing)

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
