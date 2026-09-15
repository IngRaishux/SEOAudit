# SEO Audit - Documentación del Proyecto

## Visión General

SEO Audit es una aplicación SaaS multi-tenant construida con Next.js, MongoDB y TypeScript. Permite a los usuarios autenticados craulear sitios web, analizar su SEO y recibir sugerencias de mejora.

**Stack tecnológico:**
- **Frontend/Backend:** Next.js 16.2.5 (Route Handlers + Server Components)
- **Estilos:** Tailwind CSS 3 + daisyUI 4.12.10 (componentes pre-diseñados)
- **Tema:** Personalizado "cupcake" con OKLch color scheme
- **Base de datos:** MongoDB (usuarios, organización, sitios, sugerencias)
- **Autenticación:** NextAuth v4.24.0 (Credentials + Google OAuth)
- **ORM:** Mongoose 8
- **Validación:** Zod
- **Internacionalización:** Custom i18n (ES/EN)
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
  metaTags: [{name: string, content: string}],
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
- **Estrategia:** JWT session strategy
- **Callbacks implementados:**
  - `signIn()` - Crea automáticamente usuario + organización en MongoDB para nuevos usuarios de Google
  - `jwt()` - Resuelve organizaciones del usuario en el JWT
  - `session()` - Agrega datos de usuario y organizaciones a la sesión

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
  metaTags?: Array<{ name: string; content: string }>; // og:title, og:description, og:image, robots
  createdAt: Date;
  updatedAt: Date;
}
```

**Métodos disponibles en `siteRepository`:**
- `createSite(data)` → Site (incluye metaTags)
- `getSiteById(id)` → Site | null (retorna metaTags)
- `listSitesByAccount(organizationId, {limit, skip})` → Site[] (retorna metaTags)
- `countSitesByAccount(organizationId)` → number
- `updateSite(id, data)` → Site (puede actualizar metaTags)
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

## Tema y Estilos (daisyUI + Tailwind)

### Configuración del Tema

**Archivo:** `tailwind.config.ts`

**Tema predeterminado:** `cupcake` (personalizado)

**Colores disponibles:**
```
- Primary: oklch(90% 0.058 230.902) - Azul
- Secondary: oklch(89% 0.061 343.231) - Rosa
- Accent: oklch(90% 0.076 70.697) - Amarillo/Dorado
- Success: oklch(69% 0.17 162.48) - Verde
- Warning: oklch(79% 0.184 86.047) - Naranja
- Error: oklch(64% 0.246 16.439) - Rojo
- Base-100: oklch(97.788% 0.004 56.375) - Fondo claro
```

**Integración daisyUI:**
- Plugin configurado en `tailwind.config.ts`
- Componentes disponibles: `btn`, `input`, `card`, `badge`, `table`, etc.
- Tema aplicado globalmente en `app/layout.tsx` con `data-theme="cupcake"`

### Componentes UI (daisyUI)

#### Button
**Archivo:** `components/Button.tsx`

- **Variantes:** `primary`, `secondary`, `light`, `ghost`, `destructive`
- **Tamaños:** `sm`, `md`, `lg`
- **Props:**
  - `variant`: tipo de botón
  - `size`: tamaño del botón
  - `isLoading`: muestra estado de carga
  - `loadingText`: texto durante carga
- **Usos:** Forms, dialogs, acciones

#### Input
**Archivo:** `components/Input.tsx`

- **Tipo de input:** text, email, password, search, number, etc.
- **Variantes:**
  - `hasError`: estado de error (rojo)
  - `enableStepper`: para inputs numéricos
- **Tamaños:** `sm`, `md`, `lg`
- **Características especiales:**
  - Password: toggle show/hide
  - Search: icono de búsqueda
- **Usos:** Forms, búsqueda, validación

#### Card
**Archivo:** `components/Card.tsx`

**Componentes:**
- `Card` - Contenedor principal
- `CardHeader` - Encabezado con borde inferior
- `CardTitle` - Título (h2)
- `CardDescription` - Descripción
- `CardContent` - Contenido principal
- `CardFooter` - Pie de página con borde superior

**Variantes:**
- `default` - Fondo base-100 con borde
- `outlined` - Solo borde, sin fondo
- `filled` - Fondo base-200

**Sombras:**
- `none`, `sm`, `md`, `lg`

**Usos:** Layouts, tarjetas de estadísticas, paneles

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

#### Site Details (`/sites/[siteId]`)
**Archivo:** `app/sites/[siteId]/page.tsx` (Server Component)

**Funcionalidades:**
- Tarjetas de estadísticas (Total Pages, Status, Page Title) con Cards
- Tabs navegables (SERP Preview, Pages, Meta Tags)
- Sistema de permisos basado en roles

**Componentes:**
- `SiteDetailsTabs` - Gestor de tabs y contenido
- `SERPPreview` - Visualización de SERP desktop/mobile
- `DashboardContent` - Componente refactorisado para dashboard

### Componentes SEO

#### SERPPreview
**Archivo:** `components/SERPPreview.tsx` (Client Component)

- **Funcionalidad:** Visualiza cómo aparecerá la página en resultados de búsqueda
- **Vistas:**
  - Desktop (1200px): Límites 60-70 caracteres título, 155-170 descripción
  - Mobile (400px): Límites 55-60 caracteres título, 120-130 descripción
- **Indicadores:**
  - Verde: Óptimo
  - Amarillo: Podría mejorar
  - Rojo: Muy corto/largo
- **Características:** i18n completo (ES/EN)
- **Props:** `title`, `description`, `url`

#### SiteDetailsTabs
**Archivo:** `components/SiteDetailsTabs.tsx` (Client Component)

- **Tabs:**
  - 🔍 SERP Preview - Visualización de SERP
  - 📄 Pages - Tabla de páginas crawleadas
  - 🏷️ Meta Tags - Etiquetas meta de página home
- **Características:**
  - Navegación interactiva
  - Tabla responsiva con daisyUI
  - i18n completo
- **Props:** `pages`, `siteUrl`, `siteId`, `organizationId`

---

## Flujos Principales

### Flujo de Registro y Primer Login

#### Registro con Credenciales
```
1. Usuario llena formulario en /register
2. POST /api/register {name, email, password}
3. Servidor: valida, hashea password, inserta User en MongoDB
4. Cliente: signIn('credentials') automáticamente
5. NextAuth autentica → redirige a /organizations
6. Usuario ve lista de organizaciones o crea nueva
```

#### Registro con Google OAuth
```
1. Usuario en /register clickea "Continue with Google"
2. signIn('google', { callbackUrl: '/organizations', redirect: true })
3. Redirige a Google OAuth flow
4. Usuario autoriza → Callback de NextAuth
5. Callback `signIn()` en auth.ts:
   a. Verifica si usuario existe en MongoDB
   b. Si NO existe:
      - Crea User en MongoDB
      - Crea Organization por defecto
      - Crea Membership como owner
   c. Si existe: Permite login directo
6. NextAuth redirige a /organizations (con organizaciones cargadas)
7. Usuario ve dashboard si solo tiene 1 org, o selector si tiene varias
```

### Flujo de Login

#### Con Credenciales
```
1. Usuario llena formulario en /login
2. Click "Sign In"
3. signIn('credentials', { redirect: false })
4. NextAuth valida credenciales
5. Si válido: router.push('/organizations')
6. Si inválido: Muestra error en login
```

#### Con Google OAuth
```
1. Usuario en /login clickea "Continue with Google"
2. signIn('google', { callbackUrl: '/organizations', redirect: true })
3. Redirige a Google OAuth flow
4. Usuario autoriza → Callback de NextAuth
5. Callback `signIn()` verifica si usuario existe en MongoDB
   a. Si NO existe: Crea User + Organization + Membership
   b. Si existe: Permite login
6. NextAuth redirige a /organizations (callbackUrl)
7. Middleware sincroniza cookie de organización
8. Usuario ve dashboard si tiene 1 org, o selector si tiene varias
```

#### Flujo General Post-Login
```
/organizations GET → Obtiene todas las orgs del usuario
Renderiza lista + selector
Usuario selecciona org → setSelectedOrganization(orgId)
router.push('/dashboard?org={orgId}') + router.refresh()
Middleware sincroniza cookie
Dashboard renderiza con org seleccionada
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

## Internacionalización (i18n) - Fase 1A (Implementado)

### Infraestructura i18n

Sistema de traducción centralizado que soporta español e inglés en toda la aplicación.

#### Archivos principales:
- **`lib/i18n/ui.ts`** - Diccionario centralizado con 200+ strings traducidos
- **`lib/i18n/useI18n.ts`** - Hook para componentes cliente + detectación de idioma
- **`lib/i18n/server.ts`** - Funciones para server components (Fase 1B)

#### Características:
- Selector de idioma en página `/settings`
- Persistencia en localStorage
- Detección automática del idioma del navegador
- Fallback a español si hay error
- Refresco de página al cambiar idioma

#### Idiomas soportados:
- 🇪🇸 **Español** (por defecto)
- 🇬🇧 **English**

#### Estructura de traducciones:
```typescript
{
  es: { auth: { login: "Iniciar sesión", ... }, ... },
  en: { auth: { login: "Sign In", ... }, ... }
}
```

#### Componentes traducidos:
- `DeleteSiteDialog.tsx` - Diálogo de confirmación de eliminación
- `DeleteOrganizationDialog.tsx` - Diálogo de eliminación de organización
- `Header.tsx` - Encabezado global
- `LoginForm.tsx` - Formulario de login
- `RegisterForm.tsx` - Formulario de registro
- `CreateOrganizationForm.tsx` - Creación de organización
- `OrganizationSettings.tsx` - Configuración de organización
- `SignOutButton.tsx` - Botón de cierre de sesión
- `SwitchOrgButton.tsx` - Botón para cambiar organización
- `OrganizationSelector.tsx` - Selector de organización
- `DashboardContent.tsx` - Contenido del dashboard (cliente)
- `app/settings/page.tsx` - Página de configuración

#### Hook useI18n:
```typescript
const lang = useCurrentLanguage(); // Detecta idioma actual
const { t } = useI18n(lang);
t('auth.login') // "Iniciar sesión" (ES) o "Sign In" (EN)
```

---

## Feature: Eliminar Sitios - Fase 1A (Implementado)

### Backend

#### `DELETE /api/sites/[siteId]`

Endpoint para eliminar un sitio y todos sus datos asociados.

**Autenticación:** Requiere sesión válida
**Autorización:** Solo owner o admin de la organización

**Validaciones:**
1. Usuario autenticado (401 si no)
2. Usuario es miembro de la organización (403 si no)
3. Usuario es owner o admin (403 si no)
4. Sitio existe (404 si no)

**Proceso de eliminación (cascada):**
1. `Suggestion.deleteMany({ siteId })` - Elimina todas las sugerencias
2. `Page.deleteMany({ siteId })` - Elimina todas las páginas
3. `Site.findByIdAndDelete(siteId)` - Elimina el sitio

**Respuestas:**
```json
// Éxito
{ "message": "Site deleted successfully" } // 200

// Errores
{ "error": "Unauthorized" } // 401
{ "error": "Site not found" } // 404
{ "error": "Unauthorized to delete this site" } // 403
{ "error": "Only organization owner or admin can delete sites" } // 403
{ "error": "Failed to delete site" } // 500
```

### Frontend

#### `DeleteSiteDialog` Component

Dialog reutilizable para confirmar eliminación de sitios.

**Props:**
- `siteId: string` - ID del sitio a eliminar
- `siteUrl: string` - URL del sitio (para mostrar en confirmación)
- `orgId: string` - ID de la organización (para redireccionar después)

**Comportamiento:**
1. Click en botón → Abre diálogo de confirmación
2. Usuario ve advertencia: "Se perderán todos los datos"
3. Click en "Delete Site" → Envía DELETE a `/api/sites/[siteId]`
4. Si éxito → Cierra diálogo, redirecciona a `/dashboard?org={orgId}`, refresca
5. Si error → Muestra mensaje de error

**Ubicación:** Columna "Delete" en tabla de sitios del dashboard (solo visible para owners)

#### Dashboard Integration

- Nueva columna "Delete" en tabla de sitios
- Solo visible para usuarios con rol "owner"
- Usar componente `DeleteSiteDialog` para cada sitio

---

## Seguridad Mejorada - Fase 1A (Implementado)

### Middleware de Protección de Rutas

**Archivo:** `middleware.ts`

#### Rutas públicas (sin autenticación):
```
/, /login, /register, /api/auth/*, /api/register
```

#### Rutas protegidas (requieren JWT válido):
```
/dashboard, /sites/*, /crawler, /organizations, /settings, /organization-settings/*,
/api/sites/*, /api/crawl/*, /api/organizations/*, /api/user/*, /api/suggestions/*, /api/pages/*
```

#### Flujo de validación:
1. Request llega al middleware
2. Si ruta protegida → Valida token JWT con `getToken()`
3. Si token válido → Permite acceso
4. Si sin token → Redirige a `/login`
5. Si ruta pública → Permite acceso directo

#### Prevención de:
- Acceso a rutas privadas sin sesión
- Sessionless navigation al contenido protegido
- Uso de back button para acceder a contenido protegido
- Manipulación de URLs para saltar autenticación

---

## Componentes Nuevos - Fase 1A (Implementado)

### `DashboardContent.tsx`

**Tipo:** Client Component
**Propósito:** Encapsular toda la lógica y traducción del dashboard

**Props:**
```typescript
interface DashboardContentProps {
  org: { name: string; _id: string };
  membership: { role: 'owner' | 'admin' | 'member' };
  sites: ISite[];
  total: number;
  userEmail: string;
  selectedOrgId: string;
  membershipsCount: number;
}
```

**Features:**
- Usa `useI18n()` para traducciones
- Tabla de sitios con columna "Delete" (solo owners)
- Integración con `DeleteSiteDialog`
- Muestra estadísticas: Total Sites, Role, Email
- Botones: Switch Org, Settings, Crawl New Site

**Ubicación:** Importado y usado en `app/dashboard/page.tsx`

---

## Estructura de Carpetas - Actualizada

```
apps/web/
├── lib/i18n/                    # Nueva: Internacionalización
│   ├── ui.ts                    # Diccionario (200+ strings)
│   ├── useI18n.ts              # Hook para cliente
│   └── server.ts               # Funciones para servidor
├── lib/interfaces/              # Nueva: Interfaces centralizadas
│   ├── site.ts                  # ISite interface
│   ├── page.ts                  # IPage interface
│   └── index.ts                 # Exportaciones centralizadas
├── components/
│   ├── DashboardContent.tsx     # Nuevo: Dashboard refactorisado
│   ├── DeleteSiteDialog.tsx     # Mejorado: Traducido
│   ├── DeleteOrganizationDialog.tsx # Mejorado: Traducido
│   ├── Header.tsx              # Mejorado: Traducido
│   ├── LoginForm.tsx           # Mejorado: Traducido
│   ├── RegisterForm.tsx        # Mejorado: Traducido
│   ├── CreateOrganizationForm.tsx # Mejorado: Traducido
│   ├── OrganizationSettings.tsx # Mejorado: Traducido
│   ├── SignOutButton.tsx       # Mejorado: Traducido
│   ├── SwitchOrgButton.tsx     # Mejorado: Traducido
│   ├── OrganizationSelector.tsx # Mejorado: Traducido
│   └── ...
├── app/
│   ├── api/sites/[siteId]/route.ts  # Mejorado: Agregado DELETE
│   ├── dashboard/page.tsx           # Refactorisado: Usa DashboardContent
│   ├── settings/page.tsx            # Mejorado: Selector de idioma
│   └── ...
├── middleware.ts                # Mejorado: Protección de rutas
└── docs/
    ├── PROJECT.md              # Este archivo
    ├── SETTINGS_ARCHITECTURE.md
    └── SESSION_SCHEMA_MIGRATION.md
```

---

## Interfaces Centralizadas - Fase 1A (Implementado)

### Propósito
Centralizar definiciones de TypeScript interfaces genéricas en `lib/interfaces/` para promover reutilización de código y evitar duplicación de tipos en múltiples componentes.

### Estructura

#### `lib/interfaces/site.ts`
```typescript
export interface ISite {
  _id: string;
  url: string;
  organizationId: string;
  description?: string;
  title?: string;
  pageCount: number;
  crawlStatus: string;
  metaTags?: Array<{ name: string; content: string }>;
  createdAt: Date;
  updatedAt: Date;
}
```

#### `lib/interfaces/page.ts`
```typescript
export interface IPage {
  _id: string;
  siteId: string;
  url: string;
  organizationId: string;
  title?: string;
  statusCode?: number;
  canonical?: string;
  headings: string[];
  metaTags: Array<{ name: string; content: string }>;
  createdAt: Date;
  description?: string;
}
```

#### `lib/interfaces/index.ts`
```typescript
export type { ISite } from './site';
export type { IPage } from './page';
```

### Usos en la Aplicación
- `app/sites/[siteId]/page.tsx` - Importa ISite e IPage para tipado de datos de servidor
- Futuros componentes pueden reutilizar estas interfaces

### Ventajas
- ✅ Un solo lugar de verdad para tipos
- ✅ Facilita cambios consistentes
- ✅ Mejora legibilidad y mantenimiento
- ✅ Promueve reutilización de código

---

## Proximos Pasos (Fase 1B+)

1. ✅ Dashboard real - listar sites por organizationId
2. ✅ Página de detalles - ver pages + sugerencias
3. ✅ Endpoint GET /api/sites
4. ✅ Actualizar home - navegar a /sites/[siteId]
5. ✅ Eliminar sitios - DELETE /api/sites/[siteId]
6. ✅ Middleware de seguridad - Protección de rutas
7. ✅ Internacionalización completa - i18n ES/EN
8. Traducir páginas de error (404, 500) - Fase 1B
9. Agregar más idiomas (FR, PT) - Fase 1B
10. Generación de sugerencias con AI (Fase 2)
11. Exportación opcional a DynamoDB (Fase 2)
