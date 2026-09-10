# SEO Audit - Documentación del Proyecto

## Visión General

SEO Audit es una aplicación SaaS multi-tenant construida con Next.js, MongoDB y TypeScript. Permite a los usuarios autenticados craulear sitios web, analizar su SEO y recibir sugerencias de mejora.

**Stack tecnológico:**
- **Frontend/Backend:** Next.js 16.2.5 (Route Handlers + Server Components)
- **Base de datos:** MongoDB (usuarios, organización, sitios, sugerencias)
- **Autenticación:** NextAuth v4.24.0 (Credentials + Google OAuth)
- **ORM:** Mongoose 8
- **Validación:** Zod
- **Seguridad:** bcryptjs para hashing de contraseñas

---

## Arquitectura de Datos

### Colecciones MongoDB

#### **users** (gestionado por NextAuth)
```
{
  _id: ObjectId,
  name: string,
  email: string (unique),
  password: string (hashed),
  emailVerified: Date | null,
  image: string | null
}
```

#### **organizations** (Mongoose)
```
{
  _id: ObjectId,
  name: string,
  slug: string (unique),
  createdByUserId: string,
  createdAt: Date,
  updatedAt: Date
}
```

#### **memberships** (Mongoose)
```
{
  _id: ObjectId,
  userId: string,
  organizationId: ObjectId (ref: Organization),
  role: 'owner' | 'admin' | 'member',
  createdAt: Date,
  updatedAt: Date
}
// Índice único: {userId, organizationId}
```

#### **sites** (Mongoose)
```
{
  _id: ObjectId,
  url: string,
  organizationId: ObjectId (ref: Organization, para multi-tenancy),
  title: string | null,
  description: string | null,
  crawlStatus: 'pending' | 'in_progress' | 'completed' | 'failed',
  crawlErrorMessage: string | null,
  pageCount: number (default: 0),
  createdAt: Date,
  updatedAt: Date
}
// Índice: {organizationId, createdAt}
```

#### **pages** (Mongoose)
```
{
  _id: ObjectId,
  siteId: ObjectId (ref: Site),
  url: string,
  organizationId: ObjectId (ref: Organization),
  title: string | null,
  description: string | null,
  statusCode: number | null,
  canonical: string | null,
  headings: [string],
  metaTags: [{name, content}],
  createdAt: Date,
  updatedAt: Date
}
// Índice: {siteId}, {organizationId}
```

#### **suggestions** (Mongoose)
```
{
  _id: ObjectId,
  pageId: ObjectId (ref: Page),
  siteId: ObjectId (ref: Site),
  organizationId: string,
  type: 'seo' | 'performance' | 'accessibility' | 'best_practice',
  title: string,
  description: string,
  severity: 'critical' | 'high' | 'medium' | 'low',
  recommendation: string | null,
  isResolved: boolean (default: false),
  resolvedAt: Date | null,
  notes: string | null,
  createdAt: Date,
  updatedAt: Date
}
// Índice: {pageId}, {siteId}
```

---

## Rutas de API

### Autenticación

#### `POST /api/auth/[...nextauth]/route.ts`
- **Métodos:** GET, POST
- **Descripción:** Endpoint de NextAuth v4
- **Providers:** Credentials (email/password), Google OAuth
- **Callback:** `/api/auth/callback/google` para OAuth

#### `POST /api/register`
- **Auth:** No requiere (público)
- **Body:** `{ name: string, email: string, password: string }`
- **Response:** `{ id: string, email: string, name: string }`
- **Validación:** Zod (email válido, password ≥6 caracteres)
- **Lado efecto:** Crea User en MongoDB, dispara evento `signIn` que crea Organization + Membership

### Crawling

#### `POST /api/crawl`
- **Auth:** Requiere sesión (401 si no hay)
- **Body:** `{ url: string }`
- **Response:** `{ jobId: string, siteId: string }`
- **Proceso:**
  1. Valida que haya sesión con `organizationId`
  2. Crea job en memoria con UUID para tracking progreso
  3. Ejecuta crawl en background (sin bloquear)
  4. Retorna jobId para polling y siteId para navegación futura
  5. Al completar: persiste Site + Pages en MongoDB con `organizationId`

#### `GET /api/crawl/[jobId]`
- **Auth:** No requiere (público, pero idempotente)
- **Response:** `{ status, processed, total, result, error }`
- **Descripción:** Polling endpoint para obtener progreso del crawl

### Sitios

#### `GET /api/sites`
- **Auth:** Requiere sesión
- **Query:** `?limit=10&skip=0`
- **Response:** `[{ _id, url, title, pageCount, crawlStatus, createdAt }, ...]`
- **Descripción:** Lista todos los sites del organizationId de la sesión

#### `GET /api/sites/[siteId]`
- **Auth:** Server Component usa `getServerSession(handler)`
- **Validación:** Verifica que `site.organizationId === session.user.organizationId`
- **Response:** Datos del site + páginas asociadas

### Sugerencias

#### `POST /api/suggestions` (Fase 1B+)
- **Auth:** Requiere sesión
- **Body:** `{ pageId, siteId, type, title, description, severity }`
- **Descripción:** Crea una sugerencia SEO (ej: desde página de sugerencias)

#### `GET /api/suggestions/[pageId]` (Fase 1B+)
- **Auth:** Requiere sesión
- **Descripción:** Lista sugerencias de una página

---

## Modelos Mongoose

### Site
**Archivo:** `lib/models/Site.ts`

```typescript
interface Site {
  _id: ObjectId;
  url: string;
  organizationId: string; // Para multi-tenancy
  title?: string;
  description?: string;
  crawlStatus: 'pending' | 'in_progress' | 'completed' | 'failed';
  crawlErrorMessage?: string;
  pageCount: number;
  createdAt: Date;
  updatedAt: Date;
}
```

**Métodos disponibles en `siteRepository`:**
- `createSite(data)` → Site
- `getSiteById(id)` → Site | null
- `listSitesByAccount(organizationId, {limit, skip})` → Site[]
- `countSitesByAccount(organizationId)` → number
- `updateSite(id, data)` → Site
- `deleteSite(id)` → void

### Page
**Archivo:** `lib/models/Page.ts`

```typescript
interface Page {
  _id: ObjectId;
  siteId: ObjectId; // Referencia a Site
  url: string;
  organizationId: string;
  title?: string;
  description?: string;
  statusCode?: number;
  contentLength?: number;
  contentType?: string;
  canonical?: string;
  headings: string[]; // h1 + h2 combinados
  links: Array<{ url: string; text?: string; isExternal?: boolean }>;
  metaTags: Array<{ name: string; content: string }>;
  images: Array<{ url: string; alt?: string }>;
  createdAt: Date;
  updatedAt: Date;
}
```

**Métodos disponibles en `pageRepository`:**
- `createPage(data)` → Page
- `createPages(data[])` → Page[] (batch)
- `getPageById(id)` → Page | null
- `listPagesBySite(siteId, {limit, skip})` → Page[]
- `countPagesBySite(siteId)` → number
- `updatePage(id, data)` → Page
- `deletePage(id)` → void
- `deletePagesBySite(siteId)` → void

### Suggestion
**Archivo:** `lib/models/Suggestion.ts`

```typescript
interface Suggestion {
  _id: ObjectId;
  pageId: ObjectId; // Referencia a Page
  siteId: ObjectId; // Referencia a Site
  organizationId: string;
  type: 'seo' | 'performance' | 'accessibility' | 'best_practice';
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  recommendation?: string;
  isResolved: boolean;
  resolvedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**Métodos disponibles en `suggestionRepository`:**
- `createSuggestion(data)` → Suggestion
- `createSuggestions(data[])` → Suggestion[] (batch)
- `getSuggestionById(id)` → Suggestion | null
- `listSuggestionsByPage(pageId, {limit, skip})` → Suggestion[]
- `listSuggestionsBySite(siteId, {limit, skip})` → Suggestion[]
- `countUnresolvedBySite(siteId)` → number
- `updateSuggestion(id, data)` → Suggestion
- `deleteSuggestion(id)` → void
- `deleteSuggestionsByPage(pageId)` → void
- `deleteSuggestionsBySite(siteId)` → void

---

## Componentes

### Autenticación

#### `LoginForm` (Client Component)
**Archivo:** `components/LoginForm.tsx`

- **Props:** None
- **Estado:** email, password, error, isLoading
- **Funciones:**
  - `handleSubmit()` → signIn('credentials', {...}) → redirect('/dashboard')
  - `handleGoogleSignIn()` → signIn('google', {callbackUrl: '/dashboard'})
- **Validación:** Email requerido, password requerido
- **UI:** Formulario + botón de Google OAuth

#### `RegisterForm` (Client Component)
**Archivo:** `components/RegisterForm.tsx`

- **Props:** None
- **Estado:** name, email, password, error, isLoading
- **Funciones:**
  - `handleSubmit()` → POST /api/register → signIn('credentials') → redirect('/dashboard')
- **Validación:** Zod schema (name, email, password ≥6)
- **UI:** Formulario de registro

#### `SessionProvider` (Wrapper)
**Archivo:** `components/SessionProvider.tsx`

- **Props:** `{ children }`
- **Descripción:** Envuelve la app con NextAuth SessionProvider
- **Ubicación:** `app/layout.tsx`

### Header y Navegación

#### `Header` (Client Component)
**Archivo:** `components/Header.tsx`

- **Props:** None
- **Hook:** `useSession()` para acceder a sesión
- **Renderizado condicional:**
  - **Sin sesión:** Logo + botones Login/Sign up
  - **Con sesión:** Logo + nombre usuario + organización + Dashboard link + Sign out
- **Ubicación:** Global en `app/layout.tsx`

#### `SignOutButton` (Client Component)
**Archivo:** `components/SignOutButton.tsx`

- **Props:** None
- **Funciones:**
  - `handleSignOut()` → signOut({callbackUrl: '/'})
- **UI:** Botón rojo "Sign out"

### Páginas

#### Dashboard
**Archivo:** `app/dashboard/page.tsx` (Server Component)

- **Auth:** `getServerSession(handler)` → redirect('/login') si no hay sesión
- **Contenido:** Bienvenida + información de cuenta (email, ID, organización)
- **Próximas mejoras:** Lista de sites por organizationId

#### Login
**Archivo:** `app/login/page.tsx` (Server Component)

- **Contenido:** `<LoginForm />` + link a `/register`

#### Register
**Archivo:** `app/register/page.tsx` (Server Component)

- **Contenido:** `<RegisterForm />` + link a `/login`

---

## Flujos Principales

### Flujo de Registro y Primer Login

```
1. Usuario llena formulario en /register (sin crear org)
2. POST /api/register {name, email, password}
3. Servidor: valida, hashea password, inserta User en MongoDB
4. Cliente: signIn('credentials') automáticamente
5. NextAuth autentica → redirige a /organizations (no hay org aún)
6. Usuario llena nombre de org (opcional) y clickea "Create Organization"
7. POST /api/organizations {name}
8. Servidor: crea Organization + Membership (role: owner)
9. Cookie se actualiza: selectedOrganization = orgId
10. Redirige a /dashboard?org={orgId}
11. Dashboard ve cookie sincronizada vía middleware
```

### Flujo de Login

```
1. Usuario llena formulario en /login
2. Click "Sign in" o "Continue with Google"
3. signIn('credentials' | 'google')
4. NextAuth autentica → redirige a /organizations
5. /organizations GET: obtiene todas las orgs del usuario
6. Renderiza lista de orgs + selector
7. Usuario selecciona org → OrganizationSelector.handleSelectOrganization()
8. setSelectedOrganization(orgId) → actualiza cookie
9. router.push('/dashboard?org={orgId}')
10. router.refresh() → revalida Server Components
11. Middleware ve ?org={orgId} → sincroniza cookie (redundante pero seguro)
12. Dashboard renderiza con org seleccionada
```

### Flujo "Switch Org" (en Dashboard)

```
1. Usuario en /dashboard?org=org1
2. Click botón "Switch Org" → SwitchOrgButton.handleSwitchOrg()
3. clearSelectedOrganization() → borra cookie
4. router.push('/organizations')
5. router.refresh() → revalida Header (no muestra org)
6. Usuario ve lista de orgs
7. Selecciona org2 → igual que flujo Login desde step 7
```

### Flujo de Crawl

```
1. Usuario autenticado navega a /
2. Ingresa URL y clickea "Crawl"
3. POST /api/crawl {url}
4. Servidor: valida sesión → genera jobId + siteId
5. Ejecuta crawl en background (no bloquea)
6. Retorna {jobId, siteId} al cliente
7. Cliente: polling GET /api/crawl/[jobId] cada segundo
8. Al completar (status: 'completed'):
   - Servidor persiste Site + Pages en MongoDB con organizationId
   - Cliente redirige a /sites/[siteId]
9. Usuario ve detalles del crawl con lista de páginas
```

### Flujo Multi-tenancy

```
- Cada User pertenece a una Organization (automático al registrarse)
- Cada Site tiene organizationId = Organization._id
- Cada Page tiene organizationId = Organization._id
- Las queries siempre filtran por organizationId de la sesión
- Middleware protege rutas /dashboard, /sites/*, /api/*
- Server Components usan getServerSession() para verificar propiedad
```

---

## Variables de Entorno (.env.local)

```
# MongoDB
MONGODB_URI=mongodb://localhost:27017/seo-mongodb
MONGODB_DB_NAME=seo-mongodb

# Auth.js
AUTH_SECRET=<32-byte hex, generar con: openssl rand -hex 32>
AUTH_URL=http://localhost:3000

# Google OAuth
AUTH_GOOGLE_ID=<from Google Cloud Console>
AUTH_GOOGLE_SECRET=<from Google Cloud Console>

# LLM
GOOGLE_API_KEY=<Gemini API key>

# Crawler
CRAWLER_CONCURRENCY=5
CRAWLER_TIMEOUT_MS=10000
```

---

## Índices de MongoDB

Para máximo rendimiento, crear estos índices:

```javascript
// users (creado automáticamente por NextAuth)
db.users.createIndex({ email: 1 }, { unique: true });

// organizations
db.organizations.createIndex({ slug: 1 }, { unique: true });

// memberships
db.memberships.createIndex({ userId: 1, organizationId: 1 }, { unique: true });

// sites
db.sites.createIndex({ organizationId: 1, createdAt: -1 });

// pages
db.pages.createIndex({ siteId: 1 });

// suggestions
db.suggestions.createIndex({ pageId: 1 });
db.suggestions.createIndex({ siteId: 1 });
```

---

## Seguridad

1. **Autenticación:**
   - Credenciales: bcryptjs (10 salt rounds)
   - OAuth: Google OAuth 2.0
   - Sesión: JWT con HMAC-SHA256

2. **Multi-tenancy:**
   - Todos los queries filtran por `organizationId`
   - Server Components validan `site.organizationId === session.user.organizationId`
   - Middleware protege rutas sensibles

3. **Variables sensibles:**
   - AUTH_SECRET: rotado regularmente
   - GOOGLE_API_KEY: debe rotarse (pasó por logs en desarrollo)
   - Contraseñas: nunca se loguean, siempre hasheadas

---

## Settings Architecture (Fase 1A - Actualizado)

### Estructura de Settings

El sistema de settings está dividido en dos módulos claros:

#### 1. User Settings (`/settings`)
**Propósito:** Preferencias globales del usuario que aplican a toda la aplicación

```
GET /api/user/settings
POST /api/user/settings
```

**Datos almacenados:**
```typescript
interface UserSettings {
  _id: ObjectId;
  userId: string;
  theme: 'light' | 'dark' | 'system';
  language: string;
  emailNotifications: boolean;
  weeklyReport: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

**Acceso:**
- Directo desde `/settings`
- No requiere contexto de organización
- Aplica a todas las orgs del usuario

#### 2. Organization Settings (`/organization-settings/[orgId]`)
**Propósito:** Configuración específica de cada organización

```
GET /api/organizations/[orgId]/info
PUT /api/organizations/[orgId] (editar nombre)
DELETE /api/organizations/[orgId] (eliminar org)
```

**Datos devueltos:**
```typescript
interface OrganizationInfoResponse {
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  membership: {
    _id: string;
    organizationId: string;
    role: 'owner' | 'admin' | 'member';
  };
  memberships: Array<{
    _id: string;
    organizationId: string;
    role: string;
  }>;
}
```

**Acceso:**
- Desde Dashboard: botón "Settings" → `/organization-settings/[orgId]`
- Valida membresía en endpoint `/api/organizations/[orgId]/info`
- Solo owners pueden editar/eliminar
- Admin/Member ven solo lectura

### Flujo de Navigation a Settings

```
Usuario autenticado
├── Click profile → Settings
│   └── /settings (User Preferences)
│
└── Dashboard (org seleccionada)
    └── Click "Settings" button
        └── /organization-settings/[orgId]
            └── Org-specific configuration
```

### Modelos de Settings

#### UserSettings (Mongoose)
**Archivo:** `lib/models/UserSettings.ts`

Almacena preferencias globales del usuario. Un documento por usuario con índice único en `userId`.

#### SiteSettings (Mongoose) - Fase 1B
**Archivo:** `lib/models/SiteSettings.ts`

Almacenará configuración de crawl por sitio (frecuencia, patrones de exclusión, etc.). Aún no integrado.

---

## Proximos Pasos (Fase 1B+)

1. ✅ Dashboard real - listar sites por organizationId
2. ✅ Página de detalles - ver pages + sugerencias
3. ✅ Endpoint GET /api/sites
4. ✅ Actualizar home - navegar a /sites/[siteId]
5. Exportación opcional a DynamoDB (Fase 2)
6. Generación de sugerencias con AI (Fase 2)
