# SEOAudit - Documentación del Proyecto

## 📋 Descripción General

SEOAudit es una aplicación SaaS multi-tenant para auditar y optimizar la estrategia SEO de sitios web. Permite a los usuarios:

- Crear y gestionar múltiples organizaciones/espacios de trabajo
- Crawlear sitios web para obtener análisis SEO detallados
- Generar sugerencias de optimización automáticas con IA
- Visualizar datos por organización de forma aislada

**Versión Actual:** Fase 1A (MVP SaaS multi-tenant)

---

## 🏗️ Arquitectura Técnica

### Stack Tecnológico

| Layer | Tecnología | Detalles |
|-------|-----------|----------|
| **Frontend** | Next.js 16.2.5 + React + TypeScript | SSR + Client Components |
| **Autenticación** | NextAuth v4.24.0 | JWT + Credentials + Google OAuth |
| **Base de Datos** | MongoDB (Mongoose ODM) | Persistencia de Sites, Pages, Suggestions |
| **API** | Next.js Route Handlers | POST/GET/PUT/DELETE endpoints |
| **Crawler** | @seo-optimizer/crawler | Web scraping con Playwright + Cheerio |
| **IA** | Google Gemini API | Generación de sugerencias SEO |
| **Styling** | Tailwind CSS v3 | Componentes de UI responsivos |
| **Validación** | Zod | Schema validation para inputs |
| **Hash de Contraseñas** | bcryptjs | Almacenamiento seguro de passwords |

### Arquitectura de Base de Datos

```
┌─────────────────────────────────────┐
│    NextAuth Collections (MongoDB)   │
├─────────────────────────────────────┤
│ • users                             │
│ • accounts (OAuth linking)          │
│ • verificationTokens                │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│   Mongoose Models (MongoDB)         │
├─────────────────────────────────────┤
│ • Organization                      │
│ • Membership (User-Org relation)    │
│ • Site (crawled websites)           │
│ • Page (pages within sites)         │
│ • Suggestion (SEO recommendations)  │
└─────────────────────────────────────┘
```

### Multi-Tenancy

**Modelo:** Organization-based tenancy

```
┌──────────────────────┐
│       User           │
│  (john@example.com)  │
└──────────────────────┘
           │
      ┌────┴────┬──────────┐
      │          │          │
┌─────▼───┐ ┌────▼───┐ ┌────▼───┐
│Org 1    │ │Org 2   │ │Org 3   │
│My Corp  │ │Agency A│ │Tests   │
└─────────┘ └────────┘ └────────┘
   owner      admin      member
```

- Cada usuario puede crear múltiples organizaciones
- Cada usuario puede ser miembro de múltiples organizaciones con diferentes roles
- Cada recurso (Site, Page, Suggestion) pertenece a una organización vía `accountId`
- Los datos de distintas organizaciones están completamente aislados

---

## 📂 Estructura del Proyecto

```
apps/web/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/     # NextAuth handler
│   │   ├── register/               # Email/password registration
│   │   ├── crawl/                  # Crawl endpoints
│   │   ├── sites/                  # List user's sites
│   │   ├── suggestions/            # Persist SEO suggestions
│   │   ├── pages/[pageId]/         # Get page details
│   │   └── organizations/          # CRUD organizations
│   ├── dashboard/                  # Multi-org dashboard
│   ├── settings/                   # Organization settings
│   ├── organizations/              # Org management
│   ├── login/                      # Login page
│   ├── register/                   # Registration page
│   ├── sites/[siteId]/            # Site details
│   ├── sugerence/                 # SEO suggestions generator
│   ├── page.tsx                   # Home (crawl input)
│   ├── layout.tsx                 # Root layout
│   └── actions.ts                 # Server actions (cookies)
│
├── lib/
│   ├── auth/
│   │   └── auth.ts               # NextAuth configuration
│   ├── db/
│   │   ├── mongo.ts              # MongoDB client singleton
│   │   └── mongoose.ts           # Mongoose connection
│   ├── models/
│   │   ├── Organization.ts
│   │   ├── Membership.ts
│   │   ├── Site.ts
│   │   ├── Page.ts
│   │   └── Suggestion.ts
│   ├── repositories/
│   │   ├── siteRepository.ts
│   │   ├── pageRepository.ts
│   │   └── suggestionRepository.ts
│   ├── CrawlContext.ts           # Client-side state for crawl
│   ├── jobStore.ts               # In-memory job queue
│   ├── generateSEOSuggestions.ts # AI integration
│   └── password.ts               # bcryptjs utilities
│
├── components/
│   ├── Header.tsx                # Main navigation
│   ├── HeaderWithOrganizations.tsx # Header with org selector
│   ├── OrganizationSelector.tsx   # Org dropdown
│   ├── LoginForm.tsx
│   ├── RegisterForm.tsx
│   ├── CreateOrganizationForm.tsx
│   ├── OrganizationSettings.tsx
│   ├── DialogSugestion.tsx
│   └── ...
│
├── types/
│   └── next-auth.d.ts            # Session type augmentation
│
└── .env.local                     # Environment variables
```

---

## 🔐 Autenticación

### Proveedores Soportados

1. **Email/Password (Credentials)**
   - Registro con email, nombre y contraseña
   - Contraseña hasheada con bcryptjs
   - Validación con Zod

2. **Google OAuth 2.0**
   - Login via Google
   - Vinculación automática de cuentas existentes

### Flujo de Autenticación

```
1. Usuario registra/login
   ↓
2. NextAuth crea User en MongoDB
   ↓
3. Evento signIn: si es nuevo user con Credentials
   → Crear Organization + Membership
   ↓
4. JWT callback: resolver Organization data para token
   ↓
5. Session callback: poblar accountId y org data
   ↓
6. Route Handlers: si falta accountId, resolver desde DB por email
```

### Session Enriquecida

```typescript
session.user = {
  id: string,
  email: string,
  name: string,
  accountId: string,           // Organization ID
  organizationName: string,
  role: "owner" | "admin" | "member"
}
```

---

## 🕷️ Arquitectura del Crawler

### Stack del Crawler

**Librería Principal:** `@seo-optimizer/crawler`

**Componentes Internos:**
- **Playwright**: Motor de navegación headless para renderizado de JavaScript
- **Cheerio**: Parser HTML ligero para extraer datos de la DOM
- **URL Parser**: Normalización de URLs y resolución de enlaces relativos

### Funcionalidad del Crawler

```typescript
const result = await crawlSite(url, {
  concurrency: 5,                    // 5 requests paralelos máximo
  onProgress: (processed, total) => {
    // Callback para actualizar progreso en tiempo real
    // processed: URLs ya crawleadas
    // total: URLs encontradas en el sitemap/sitio
  }
});
```

### Datos Extraídos por Página

El crawler extrae automáticamente:

| Dato | Descripción | Uso |
|------|-------------|-----|
| `url` | URL de la página | Identificación |
| `title` | Meta title (máx 70 chars) | SEO on-page |
| `description` | Meta description | SEO on-page |
| `statusCode` | HTTP status (200, 404, etc) | Health check |
| `h1` | Headings H1 (máximo 1) | Estructura |
| `h2` | Headings H2 | Estructura |
| `ogTitle` | Open Graph title | Social media |
| `ogDescription` | Open Graph description | Social media |
| `ogImage` | Open Graph image URL | Social media |
| `robots` | Meta robots directive | Indexación |
| `canonical` | URL canónica | Duplicate prevention |

### Flujo Técnico del Crawling

```
1. Usuario POST /api/crawl con URL
   ↓
2. Crear Job (en memoria) con status "running"
   - jobId (UUID temporal)
   - siteId (UUID inicial, actualizado después)
   - url, accountId (organización)
   - concurrency: 5
   ↓
3. Retornar { jobId, siteId } al frontend
   (frontend comienza polling GET /api/crawl/[jobId])
   ↓
4. En background: runCrawl(jobId)
   - Llamar crawlSite() con onProgress callback
   - onProgress actualiza job.processed y job.total en jobStore
   ↓
5. Al completar crawl:
   - job.status = "completed"
   - job.result contiene todas las páginas
   ↓
6. Persistencia en MongoDB: persistCrawlResult(job)
   - Crear Site con accountId (organización)
   - Crear Pages asociadas al Site
   - Actualizar job.siteId con ObjectId de MongoDB
   ↓
7. Siguiente polling retorna siteId correcto (ObjectId)
   ↓
8. Frontend navega a /sites/[siteId] con datos persistidos
```

### Configuración & Performance

**Concurrencia:** 5 requests paralelos
- Balance entre velocidad y carga del servidor
- No sobrecarga sitios target
- Respetuoso con robots.txt

**Timeout:** Heredado de Playwright
- Espera máxima por página
- Fallback graceful si timeout

**Reintento:** No hay reintento automático
- URLs que fallan se marcan como fallidas
- Usuario puede reintentar todo el crawl

### Limitaciones Conocidas

- Solo crawlea hasta 1000 páginas por defecto (configurable en librería)
- No maneja sites con autenticación requerida
- JavaScript muy dinámico puede no capturarse completamente
- Sitios con rate limiting pueden ser parcialmente crawleados

---

## 🏢 Gestión de Organizaciones

### Crear Organización

**Opción 1: Durante registro (opcional)**
```
Email/Password → [Org Name (opcional)] → Register
└─ Si proporciona org name: crea User + Organization + Membership
└─ Si no proporciona: redirige a /organizations
```

**Opción 2: Después de registrarse**
```
/organizations → "Create New Organization" → Ingresa nombre → Crea Org
```

### Cambiar Organización

```
Navbar Selector → Click org name (dropdown) → Selecciona org → 
Router.push(/dashboard?org={orgId}) → Cookie se actualiza
```

### Editar Organización

```
Settings → Edit Organization Name (owner solo) → Guardar → 
Navbar se actualiza en tiempo real vía router.refresh()
```

### Eliminar Organización

**Solo disponible para owners en Settings (Danger Zone)**

```
Settings → Sección "Danger Zone" → Click "Delete Organization"
  ↓
Paso 1: Mostrar advertencia sobre eliminación
  ↓
Paso 2: Pedir que escriba nombre de la organización para confirmar
  ↓
Al confirmar: DELETE /api/organizations/{orgId}
  ├─ Elimina Suggestions
  ├─ Elimina Pages
  ├─ Elimina Sites
  ├─ Elimina Memberships
  ├─ Elimina Organization
  ↓
Redirige a /organizations (con router.replace para limpiar historial)
```

**Protecciones:**
- ✅ Solo owner puede eliminar
- ✅ Confirmación en dos pasos (advertencia + escribir nombre)
- ✅ Historial limpio: botón atrás no vuelve a org eliminada
- ✅ Acceso directo a `/settings?org={deletedOrgId}` redirige a `/settings`
- ✅ Datos eliminados en cascada (sin referencias huérfanas)

---

## 🕷️ Endpoints de Crawling

### POST /api/crawl - Iniciar Crawl

Inicia un nuevo crawling de un sitio. Requiere autenticación.

**Request:**
```json
{
  "url": "https://example.com"
}
```

**Response:**
```json
{
  "jobId": "uuid-temporal",
  "siteId": "uuid-inicial"
}
```

**Multi-tenancy:** El crawl se asocia automáticamente a `session.user.accountId` (organización)

### GET /api/crawl/[jobId] - Polling de Progreso

Obtiene el estado y progreso del crawling.

**Response:**
```json
{
  "jobId": "uuid",
  "siteId": "objectid-mongodb",  // ObjectId cuando completa
  "status": "running|completed|failed",
  "processed": 45,
  "total": 120
}
```

**Sin autenticación:** El `jobId` es opaco y temporal, imposible de enumerar

**Nota:** Referir a "🕷️ Arquitectura del Crawler" para detalles técnicos de cómo funciona el crawling

---

## 💡 Generación de Sugerencias SEO

### Flujo

1. **Usuario en `/sites/[siteId]`** → Click "SEO →" en una página
2. **Navega a `/sugerence?url=...&pageId=...&siteId=...`**
3. **Click "Generar Automáticamente"**
4. **Sistema:**
   - Llamada a Gemini API con datos de página
   - Genera sugerencias (title, description, keywords, etc)
5. **POST `/api/suggestions`** con los datos
6. **MongoDB:** Suggestion se guarda con `accountId`, `pageId`, `siteId`
7. **UI:** Confirmación "✓ Sugerencia guardada correctamente"

### Estructura de Suggestion

```typescript
{
  pageId: ObjectId,
  siteId: ObjectId,
  accountId: ObjectId,           // Aislamiento por org
  type: "seo" | "performance" | "accessibility" | "best_practice",
  severity: "critical" | "high" | "medium" | "low",
  title: string,
  description: string,
  recommendation?: string,
  notes?: string,
  isResolved: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 📊 Dashboard & Settings

### Por Organización

Cada organización tiene su dashboard y settings independientes:

```
/dashboard?org={orgId}
  ↓
Muestra:
  - Total sites de esa org
  - Rol del usuario en esa org
  - Listado de sites crawleados

/settings?org={orgId}
  ↓
Muestra:
  - Nombre de la organización (editable si owner)
  - Información de cuenta del usuario
  - Zona de Peligro (si owner)
```

### Query Parameter `org`

- **`?org={orgId}`**: Muestra datos de esa org (si usuario es miembro)
- **Sin parámetro**: Usa primera org del usuario
- **org inválido**: Redirige a `/dashboard` o `/settings` (sin parámetro)
- **org eliminada**: Redirige de forma segura (memberships ya no existen)

---

## 🔒 Seguridad & Multi-Tenancy

### Validaciones en Cada Layer

**API Route Handlers:**
```typescript
// 1. Verificar autenticación
if (!session?.user?.email) return 401

// 2. Resolver accountId si falta
if (!session.user.accountId) {
  // Buscar en MongoDB por email
}

// 3. Validar propiedad del recurso
if (site.accountId !== session.user.accountId) return 404
```

**Server Components:**
```typescript
// 1. Verificar sesión
if (!session?.user?.email) redirect('/login')

// 2. Validar membresía
const membership = await Membership.findOne({
  userId: session.user.id,
  organizationId: orgId
})
if (!membership) redirect('/login')
```

### Resource Isolation

- ✅ Sites filtramos por `accountId`
- ✅ Pages filtramos por `accountId`
- ✅ Suggestions filtramos por `accountId`
- ✅ Organizations limitadas a membresías del usuario
- ✅ Settings solo editable por owner

---

## 🚀 Despliegue

### Variables de Entorno Necesarias

```env
# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/seoaudit
MONGODB_DB_NAME=seoaudit

# Auth
AUTH_SECRET=<openssl rand -base64 32>
AUTH_URL=http://localhost:3000

# Google OAuth
AUTH_GOOGLE_ID=<from Google Cloud Console>
AUTH_GOOGLE_SECRET=<from Google Cloud Console>

# AI
GOOGLE_API_KEY=<Gemini API Key>
```

### Instalación Local

```bash
# En apps/web
npm install
npm run dev

# Visita http://localhost:3000
```

---

## 🧪 Testing Checklist

### Multi-Tenancy

- [ ] Usuario crea 2+ organizaciones
- [ ] Cambio entre orgs en navbar
- [ ] Dashboard muestra sitios correctos por org
- [ ] Usuario no puede ver sites de otra org (404)
- [ ] Settings: solo owner puede editar org name

### Autenticación

- [ ] Registro con email/password
- [ ] Login con credenciales
- [ ] Google OAuth (si implementado)
- [ ] Logout funciona
- [ ] Sesión persiste al recargar

### Crawling

- [ ] Post `/api/crawl` inicia crawl
- [ ] Polling muestra progreso
- [ ] Sites se persisten en MongoDB
- [ ] Navega a `/sites/[siteId]` después de crawl
- [ ] Organización correcta asociada a site

### Sugerencias

- [ ] Click "SEO →" abre `/sugerence`
- [ ] Genera sugerencias con Gemini
- [ ] POST `/api/suggestions` guarda en MongoDB
- [ ] Mensaje de confirmación aparece
- [ ] Sugerencias no se pierden al recargar

---

## 📈 Métricas & Monitoreo

### Logs Actuales

- `console.error()` en Route Handlers y Server Components
- Logs de resolución de accountId
- Logs de creación de sugerencias

### Posibles Mejoras (Fase 2)

- [ ] Structured logging (Winston, Pino)
- [ ] Error tracking (Sentry)
- [ ] Analytics (Google Analytics, Posthog)
- [ ] Performance monitoring

---

## 🔄 CI/CD

### Comandos Locales

```bash
npm run build      # Build + type check
npm run dev        # Development server
npm run lint       # Linting (si configurado)
```

### Validaciones Pre-Deploy

- ✅ `npm run build` sin errores
- ✅ Todas las variables de entorno configuradas
- ✅ MongoDB accesible
- ✅ Google APIs configuradas

---

## 📝 Notas de Desarrollo

### Decisiones de Arquitectura

1. **Mongoose + MongoDB**: Elegido para MVP rápido (vs DynamoDB)
2. **NextAuth v4**: Compatible con Next.js 16 (v5 requiere 14/15)
3. **JWT Strategy**: Necesario para combinar OAuth + Credentials
4. **Route Handler accountId Resolution**: Workaround para limitación de NextAuth v4

### Limitaciones Conocidas

1. **Google OAuth**: Cuando usuario se registra con OAuth no crea org automáticamente
2. **Sin invitación de miembros**: Scope Fase 2
3. **Sin rate limiting**: Scope Fase 2
4. **Sin tests automatizados**: Todo testing manual

### Posibles Optimizaciones

- Caching de organizaciones en sesión
- Batch operations para crawling
- WebSocket para progreso en tiempo real
- Indexación de MongoDB mejorada

---

## 📚 Referencias

- [NextAuth Docs](https://next-auth.js.org/)
- [MongoDB Mongoose](https://mongoosejs.com/)
- [Next.js 16](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)

---

**Última actualización:** 2026-08-24
**Versión:** 1.0.0 (Fase 1A)
