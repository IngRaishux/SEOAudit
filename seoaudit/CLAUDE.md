# SEOAudit - Project Architecture & Development Guide

SEOAudit es una aplicación SaaS multi-tenant construida con **Next.js 16**, **MongoDB** en Atlas, y **Crawl4AI** self-hosted para análisis SEO sin costos.

## 🏗 Stack Tecnológico

| Componente | Tecnología | Versión |
|-----------|-----------|---------|
| **Frontend/Backend** | Next.js + React + TypeScript | 16.2.5 |
| **Base de Datos** | MongoDB (Atlas en prod) | - |
| **ORM** | Mongoose | 8 |
| **Autenticación** | NextAuth v4 | 4.24.0 |
| **Web Scraping** | Crawl4AI Self-Hosted | 0.9.3 |
| **Validación** | Zod | - |
| **Seguridad** | bcryptjs | - |
| **Estilos** | Tailwind CSS | - |

---

## 📁 Estructura del Proyecto

```
seoaudit (monorepo - Turbo)
│
├── apps/
│   ├── web/                         # Next.js 16 SaaS app (Vercel)
│   │   ├── app/                     # App Router (Next.js)
│   │   │   ├── api/
│   │   │   │   ├── auth/[...nextauth]/route.ts        # NextAuth handlers
│   │   │   │   ├── register/route.ts                  # POST: User registration
│   │   │   │   ├── crawl/
│   │   │   │   │   ├── route.ts                       # POST: Iniciar crawl
│   │   │   │   │   └── [jobId]/route.ts               # GET: Job status
│   │   │   │   ├── sites/
│   │   │   │   │   ├── route.ts                       # GET: List sites
│   │   │   │   │   └── [siteId]/
│   │   │   │   │       ├── route.ts                   # GET: Site details, DELETE
│   │   │   │   ├── organizations/
│   │   │   │   │   ├── route.ts                       # GET: List orgs, POST: Create
│   │   │   │   │   └── [orgId]/
│   │   │   │   │       ├── route.ts                   # PUT: Edit, DELETE: Delete org
│   │   │   │   │       └── info/route.ts              # GET: Org info + members
│   │   │   │   ├── user/settings/route.ts             # GET, POST: User preferences
│   │   │   │   ├── suggestions/route.ts               # POST: Create suggestion
│   │   │   │   ├── pages/[pageId]/route.ts            # GET: Page details
│   │   │   │   └── site-settings/[siteId]/route.ts    # Site config (Phase 1B)
│   │   │   ├── dashboard/page.tsx                     # Protected: Dashboard
│   │   │   ├── login/page.tsx                         # Public: Login
│   │   │   ├── register/page.tsx                      # Public: Register
│   │   │   ├── organizations/page.tsx                 # Protected: Org selector
│   │   │   ├── organization-settings/[orgId]/page.tsx # Protected: Org settings
│   │   │   ├── sites/[siteId]/page.tsx               # Protected: Site details
│   │   │   ├── settings/page.tsx                      # Protected: User settings
│   │   │   ├── layout.tsx                            # Root layout + SessionProvider
│   │   │   └── page.tsx                              # Home page
│   │   │
│   │   ├── components/              # SEOAudit-specific (15 files)
│   │   │   ├── CreateOrganizationForm.tsx  # Org creation
│   │   │   ├── DeleteOrganizationDialog.tsx # Org deletion
│   │   │   ├── DeleteSiteDialog.tsx        # Site deletion
│   │   │   ├── DialogSugestion.tsx         # Suggestion dialog
│   │   │   ├── DashboardContent.tsx        # Dashboard UI
│   │   │   ├── Header.tsx                  # App header
│   │   │   ├── HydrateCrawl.tsx            # Crawl hydration
│   │   │   ├── LoginForm.tsx               # Login form (auth-specific)
│   │   │   ├── OrganizationSelector.tsx    # Org selector
│   │   │   ├── OrganizationSettings.tsx    # Org settings
│   │   │   ├── RegisterForm.tsx            # Register form (auth-specific)
│   │   │   ├── SERPPreview.tsx             # SERP preview (SEO-specific)
│   │   │   ├── SignOutButton.tsx           # Auth sign out
│   │   │   ├── SiteDetailsTabs.tsx         # Site details tabs
│   │   │   └── SwitchOrgButton.tsx         # Org switcher
│   │   │
│   │   ├── ui/                             # @seo-optimizer/ui imports
│   │   │   # (Button, Input, Dialog, BackButton, SessionProvider)
│   │   │
│   │   ├── lib/
│   │   │   ├── models/              # Mongoose schemas
│   │   │   │   ├── Organization.ts
│   │   │   │   ├── Site.ts
│   │   │   │   ├── Page.ts
│   │   │   │   ├── Membership.ts
│   │   │   │   ├── Suggestion.ts
│   │   │   │   ├── UserSettings.ts
│   │   │   │   └── SiteSettings.ts
│   │   │   ├── repositories/        # Data access layer (repositories pattern)
│   │   │   │   ├── siteRepository.ts
│   │   │   │   ├── pageRepository.ts
│   │   │   │   ├── suggestionRepository.ts
│   │   │   │   └── ...
│   │   │   ├── db/
│   │   │   │   ├── mongoose.ts     # Mongoose connection
│   │   │   │   └── mongo.ts        # Native MongoDB driver
│   │   │   ├── auth/               # NextAuth configuration
│   │   │   ├── i18n/               # Internacionalización
│   │   │   │   ├── ui.ts           # Diccionario (200+ strings)
│   │   │   │   ├── useI18n.ts      # Hook para cliente
│   │   │   │   └── server.ts       # Funciones para servidor
│   │   │   └── utils/
│   │   │       ├── password.ts
│   │   │       ├── chartUtils.ts
│   │   │       ├── generateSEOSuggestions.ts
│   │   │       └── jobStore.ts
│   │   │
│   │   ├── middleware.ts            # NextAuth route protection
│   │   ├── public/                  # Static assets
│   │   ├── docs/                    # Documentación (5 files)
│   │   │   ├── PROJECT.md           # Full architecture doc
│   │   │   ├── CRAWLER_INTEGRATION.md
│   │   │   ├── SETTINGS_ARCHITECTURE.md
│   │   │   ├── SESSION_SCHEMA_MIGRATION.md
│   │   │   └── CHANGELOG_FASE1A_FINAL.md
│   │   ├── tsconfig.json
│   │   ├── next.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── postcss.config.js
│   │   ├── middleware.ts
│   │   ├── .env.example
│   │   └── .env.local
│   │
│   └── crawler/                      # @seo-optimizer/crawler (Node.js)
│       ├── src/
│       │   ├── index.ts             # crawlSite() - main export
│       │   ├── crawler/
│       │   │   ├── crawl4ai-client.ts  # HTTP client para Crawl4AI (Bearer auth)
│       │   │   ├── extract.ts          # extractPageSeo() - orchestrator
│       │   │   ├── parse.ts            # parseSeoFromHtml() - field extraction
│       │   │   └── render.ts           # JS rendering (Playwright)
│       │   ├── sitemap/
│       │   │   ├── parse.ts           # XML sitemap parsing
│       │   │   └── discover.ts        # Auto-discover sitemaps
│       │   ├── ai/, analyzer/, exporter/, db/ # Placeholder dirs (Phase 2)
│       │   └── types/
│       ├── tsconfig.json
│       └── package.json (type: "module")
│
├── packages/                        # Shared packages
│   ├── ui/                          # @seo-optimizer/ui (Common UI components)
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── Button.tsx       # Generic button (5 variants)
│   │   │   │   ├── Input.tsx        # Generic input (text, password, search)
│   │   │   │   ├── Dialog.tsx       # Generic modal dialog (Radix UI)
│   │   │   │   ├── BackButton.tsx   # Navigation back button
│   │   │   │   └── SessionProvider.tsx  # NextAuth provider wrapper
│   │   │   ├── utils.ts             # Shared styles (cx, focusRing, etc)
│   │   │   └── index.ts             # Package exports
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── README.md
│   │
│   ├── types/
│   │   └── src/
│   │       ├── index.ts
│   │       ├── seo.ts              # SEO types
│   │       └── dynamodb.ts         # DynamoDB types
│   │
│   └── config/
│       └── tsconfig.base.json
│
├── CRAWL4AI_SETUP.md               # Setup & deployment guide
├── PROJECT_OVERVIEW.md             # High-level overview
├── CLAUDE.md                       # Este archivo
├── AGENTS.md                       # Claude instructions (ignore)
├── docker-compose.yml              # MongoDB local dev
├── turbo.json                      # Turbo monorepo config
└── package.json (root)             # Workspace setup
```

### Turbo Monorepo Scripts

```bash
npm run dev      # Run all dev servers (Turbo watches both web & crawler)
npm run build    # Build all packages
npm run lint     # Lint all packages
```

---

## 🔑 Variables de Entorno

### Local Development (`apps/web/.env.local`)

```env
# MongoDB (local o Atlas)
MONGODB_URI=mongodb://localhost:27017/seo-mongodb
MONGODB_DB_NAME=seo-mongodb

# NextAuth
AUTH_SECRET=<32-byte hex: openssl rand -hex 32>
AUTH_URL=http://localhost:3000

# Google OAuth (obtenido de Google Cloud Console)
AUTH_GOOGLE_ID=<tu-id>
AUTH_GOOGLE_SECRET=<tu-secret>

# LLM (Google Gemini API)
GOOGLE_API_KEY=<tu-key>

# Crawl4AI (local)
CRAWL4AI_URL=http://localhost:11235
CRAWL4AI_API_TOKEN=Airi2026

# Crawler config
CRAWLER_CONCURRENCY=5
CRAWLER_TIMEOUT_MS=30000
```

### Production (`Vercel Environment Variables`)

```env
# MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/seo-mongodb?retryWrites=true

# Auth
AUTH_SECRET=<diferente al dev>
AUTH_URL=https://tu-app.vercel.app
AUTH_GOOGLE_ID=<mismo que dev>
AUTH_GOOGLE_SECRET=<mismo que dev>

# LLM
GOOGLE_API_KEY=<mismo que dev (rotarlo después)>

# Crawl4AI en DigitalOcean (sin dominio: IP; con dominio: HTTPS)
CRAWL4AI_URL=https://crawl4ai.tudominio.com
# O sin dominio (temporary): http://123.45.67.89:11235
CRAWL4AI_API_TOKEN=<token-aleatorio>

# Crawler
CRAWLER_CONCURRENCY=10
CRAWLER_TIMEOUT_MS=30000
```

---

## 🎨 Component Organization

### Architecture Overview

```
packages/ui/                    ← Generic, reusable UI
├── src/components/
│   ├── Button.tsx             (5 variants: primary, secondary, light, ghost, destructive)
│   ├── Input.tsx              (text, password, search, error states)
│   ├── Dialog.tsx             (modal with DialogContent, DialogTrigger, etc.)
│   ├── BackButton.tsx         (navigation back)
│   └── SessionProvider.tsx    (NextAuth wrapper)
└── Exported via @seo-optimizer/ui package

apps/web/components/           ← SEOAudit-specific domain logic
├── Auth: LoginForm, RegisterForm, SignOutButton
├── Orgs: CreateOrganizationForm, OrganizationSelector, OrganizationSettings, DeleteOrganizationDialog, SwitchOrgButton
├── Sites: DashboardContent, SiteDetailsTabs, DeleteSiteDialog, SERPPreview
└── Infra: Header, HydrateCrawl, DialogSugestion
```

### Shared UI Components (`packages/ui`) ✅

**Location:** `packages/ui/src/components/` → Published as `@seo-optimizer/ui` package

**Components:**
1. **Button** - Generic button with variants and loading states
   - Variants: `primary`, `secondary`, `light`, `ghost`, `destructive`
   - Props: `isLoading`, `loadingText`, `asChild`, standard button props

2. **Input** - Universal text input component
   - Types: `text`, `password`, `search`
   - Features: password visibility toggle, search icon, error states
   - Props: `hasError`, `enableStepper` (for number inputs)

3. **Dialog** - Modal dialog primitives (Radix UI based)
   - Components: Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose
   - Fully typed and composable

4. **BackButton** - Simple navigation back button
   - Uses `useRouter().back()`
   - Styled with Tailwind

5. **SessionProvider** - NextAuth authentication wrapper
   - Wraps NextAuthSessionProvider
   - Required in root layout for auth to work

**Imports (✅ all files updated):**
```typescript
// Single import with named exports
import { 
  Button, 
  Input, 
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  BackButton,
  SessionProvider
} from "@seo-optimizer/ui"

// Also export utility functions
import { cx, focusRing, focusInput, hasErrorInput } from "@seo-optimizer/ui"
```

**Build & Distribution:**
- TypeScript source in `packages/ui/src/`
- Compiles to `packages/ui/dist/` via `npm run build`
- Published to npm workspace (available locally via `@seo-optimizer/ui`)
- Automatically transpiled by Next.js (`next.config.ts` includes it)

### SEOAudit-Specific Components (`apps/web/components`)

**Location:** `apps/web/components/` - Domain-specific, not exported outside app

**12 Components Organized by Feature:**

**Authentication (3):**
- `LoginForm.tsx` - Login with credentials/Google OAuth
- `RegisterForm.tsx` - Registration form with validation
- `SignOutButton.tsx` - Sign out action

**Organization Management (5):**
- `CreateOrganizationForm.tsx` - New org creation
- `OrganizationSelector.tsx` - Org picker (/organizations page)
- `OrganizationSettings.tsx` - Org config & members
- `DeleteOrganizationDialog.tsx` - Org deletion confirmation
- `SwitchOrgButton.tsx` - Switch between orgs

**Site & Page Management (4):**
- `DashboardContent.tsx` - Main dashboard UI + site listing
- `SiteDetailsTabs.tsx` - Tabbed site details (pages, suggestions)
- `DeleteSiteDialog.tsx` - Site deletion confirmation
- `SERPPreview.tsx` - SERP preview display (SEO-specific)
- `DialogSugestion.tsx` - AI suggestions dialog

**Infrastructure (2):**
- `Header.tsx` - Global app header (nav, auth status)
- `HydrateCrawl.tsx` - Crawl data hydration logic

**Imports:**
```typescript
// From app-specific components
import { LoginForm } from "@/components/LoginForm"
import { DashboardContent } from "@/components/DashboardContent"
import { DeleteSiteDialog } from "@/components/DeleteSiteDialog"

// From shared UI package
import { Button, Input, Dialog } from "@seo-optimizer/ui"
```

### Guidelines: Where to Put Components

**Move to `packages/ui` → `@seo-optimizer/ui` when:**
- ✅ Purely presentational (no business logic)
- ✅ Could be reused in other projects
- ✅ Generic and self-contained (Button, Input, Dialog, etc.)
- ✅ No dependencies on app-specific models/services

**Keep in `apps/web/components` when:**
- ✅ Contains SEOAudit business logic
- ✅ Tightly coupled to models (Site, Page, Organization, etc.)
- ✅ Uses app-specific services/hooks
- ✅ Domain-specific (SERPPreview, DashboardContent, etc.)
- ✅ Used only in this application

**Example: Should LoginForm be generic?**
- ❌ No → it's tightly coupled to NextAuth config and SEOAudit registration flow
- Keep in `apps/web/components`

---

## ⚙️ Monorepo Configuration

### Build System

**Turbo** orchestrates builds across all packages:
```bash
npm run dev      # Start all dev servers (web + crawler)
npm run build    # Build all packages in dependency order
npm run lint     # Lint all packages
```

**Build Order (Turbo handles automatically):**
1. `packages/config` (base TypeScript config)
2. `packages/types` (shared type definitions)
3. `packages/ui` (shared UI components)
4. `packages/crawler` (crawler logic)
5. `apps/web` (Next.js app)

### Package Resolution

**`@seo-optimizer/*` packages** are resolved via npm workspaces:
- `@seo-optimizer/ui` → points to `packages/ui`
- `@seo-optimizer/crawler` → points to `packages/crawler`
- `@seo-optimizer/types` → points to `packages/types`

**Configuration:**
- `package.json` workspace: `["apps/*", "packages/*"]`
- `turbo.json`: defines task dependencies
- `next.config.ts`: includes `transpilePackages: ["@seo-optimizer/ui", "@seo-optimizer/crawler"]`

### TypeScript Paths

**`apps/web/tsconfig.json`:**
```json
{
  "paths": {
    "@/*": ["./*"]  // Local imports
  }
}
```

**External packages** are resolved via npm, not path aliases:
```typescript
import { Button } from "@seo-optimizer/ui"  // Resolved via npm workspaces
import { Helper } from "@/lib/utils"         // Resolved via @/* path
```

### When Imports Fail

**If `@seo-optimizer/ui` can't be found:**

1. **Run build first:**
   ```bash
   npm run build
   ```

2. **Clear caches:**
   ```bash
   rm -rf .next node_modules/.pnpm
   npm install
   ```

3. **Verify workspace setup:**
   - Check `package.json` has `workspaces: ["apps/*", "packages/*"]`
   - Check `packageManager: "npm@X.X.X"` field exists

4. **Rebuild:**
   ```bash
   npm run build
   npm run dev
   ```

---

## 📊 Modelo de Datos

### Colecciones MongoDB

#### **users** (NextAuth)
```javascript
{
  _id: ObjectId,
  email: string (unique),
  name: string,
  password: string (hashed),
  emailVerified: Date | null,
  image: string | null
}
```

#### **organizations** (Mongoose)
```javascript
{
  _id: ObjectId,
  name: string,
  slug: string (unique),
  createdByUserId: string,
  createdAt: Date,
  updatedAt: Date
}
// Index: { slug: 1 }
```

#### **memberships** (Mongoose)
```javascript
{
  _id: ObjectId,
  userId: string,
  organizationId: ObjectId,
  role: 'owner' | 'admin' | 'member',
  createdAt: Date,
  updatedAt: Date
}
// Unique index: { userId, organizationId }
```

#### **sites** (Mongoose)
```javascript
{
  _id: ObjectId,
  url: string,
  organizationId: ObjectId,  // Multi-tenancy
  title: string | null,
  description: string | null,
  crawlStatus: 'pending' | 'in_progress' | 'completed' | 'failed',
  crawlErrorMessage: string | null,
  pageCount: number,
  createdAt: Date,
  updatedAt: Date
}
// Index: { organizationId, createdAt }
```

#### **pages** (Mongoose)
```javascript
{
  _id: ObjectId,
  siteId: ObjectId,
  url: string,
  organizationId: ObjectId,
  title: string | null,
  description: string | null,
  canonical: string | null,
  statusCode: number | null,
  h1: [string],
  h2: [string],
  p: [string],
  wordCount: number,
  loadTimeMs: number,
  createdAt: Date,
  updatedAt: Date
}
// Indexes: { siteId }, { organizationId }
```

#### **suggestions** (Mongoose) - Fase 1B
```javascript
{
  _id: ObjectId,
  pageId: ObjectId,
  siteId: ObjectId,
  organizationId: ObjectId,
  type: 'seo' | 'performance' | 'accessibility' | 'best_practice',
  title: string,
  description: string,
  severity: 'critical' | 'high' | 'medium' | 'low',
  recommendation: string,
  isResolved: boolean,
  resolvedAt: Date | null,
  createdAt: Date,
  updatedAt: Date
}
// Indexes: { pageId }, { siteId }
```

---

## 🔄 Flujos Principales

### 1. Registro e Primer Login

```
1. Usuario → /register (sin org)
2. POST /api/register {name, email, password}
3. Servidor: valida, hashea password, inserta User en MongoDB
4. Cliente: signIn('credentials') automáticamente
5. Servidor: crea Organization + Membership (owner)
6. Redirige a /dashboard
```

### 2. Crawling de Sitio

```
1. Usuario autenticado → /dashboard
2. Ingresa URL y clickea "Crawl"
3. POST /api/crawl {url, organizationId}
4. Servidor: genera jobId, inicia crawl en background (no bloquea)
5. Retorna {jobId, siteId}
6. Cliente: polling GET /api/crawl/[jobId] cada segundo
7. Crawl flow interno:
   ├─ extractPageSeo(url) → crawl4ai
   │  └─ crawlWithCrawl4AI(url, baseUrl, token)
   │     ├─ POST http://localhost:11235/crawl {"urls": [url]}
   │     ├─ Headers: Authorization: Bearer {token}
   │     └─ Returns: html, cleaned_html, metadata, status_code
   ├─ parseSeoFromHtml(html, metadata)
   │  └─ Extract: title, description, canonical (from full html), h1, h2, links, wordCount
   └─ Persiste Site + Pages en MongoDB con organizationId
8. Al completar: Cliente redirige a /sites/[siteId]
```

### 3. Multi-tenancy

```
Todos los queries filtran por organizationId:
├─ API: Valida sesión → obtiene organizationId
├─ Queries: { organizationId } en todos los find()
├─ Server Components: Verifica site.organizationId === session.organizationId
└─ Middleware: Protege rutas /dashboard, /api/*, /sites/*
```

---

## 🌐 API Routes

### Autenticación

| Endpoint | Método | Auth | Descripción |
|----------|--------|------|-------------|
| `/api/auth/[...nextauth]` | GET, POST | - | NextAuth endpoint |
| `/api/register` | POST | - | Crear usuario |

### Crawling

| Endpoint | Método | Auth | Descripción |
|----------|--------|------|-------------|
| `/api/crawl` | POST | ✅ | Iniciar crawl (retorna jobId) |
| `/api/crawl/[jobId]` | GET | ✅ | Polling: obtener progreso |

### Sitios

| Endpoint | Método | Auth | Descripción |
|----------|--------|------|-------------|
| `/api/sites` | GET | ✅ | Lista sitios del usuario |
| `/api/sites/[siteId]` | GET | ✅ | Detalles + páginas |
| `/api/sites/[siteId]` | DELETE | ✅ | Eliminar sitio (cascada) |

### Configuración

| Endpoint | Método | Auth | Descripción |
|----------|--------|------|-------------|
| `/api/user/settings` | GET, POST | ✅ | User preferences (theme, language) |
| `/api/organizations/[orgId]/info` | GET | ✅ | Info de org + memberships |
| `/api/organizations/[orgId]` | PUT | ✅ | Editar nombre org (owner only) |
| `/api/organizations/[orgId]` | DELETE | ✅ | Eliminar org + cascada (owner only) |

---

## 🚀 Deployment

### Local Development

```bash
# 1. Instalar dependencias
npm install

# 2. Levantar MongoDB
docker-compose up -d

# 3. Configurar .env.local (ver arriba)

# 4. Ejecutar dev server
npm run dev

# 5. Levantar Crawl4AI (en otro terminal)
docker run -d \
  --name crawl4ai \
  -p 11235:11235 \
  -e CRAWL4AI_API_TOKEN=Airi2026 \
  unclecode/crawl4ai:latest
```

### Production (Vercel + MongoDB Atlas + DigitalOcean)

Ver archivo completo en `CRAWL4AI_SETUP.md` → Sección "Producción" para:
- Opción 1: Docker en mismo VPS
- Opción 2: VPS separado para Crawl4AI
- Opción 3: Nginx + SSL + reverse proxy
- Opción 4: Kubernetes

**Quick start:**
```bash
# 1. Crear Droplet en DigitalOcean (Ubuntu 24.04, $6/mo)
# 2. Instalar Docker: apt install -y docker.io docker-compose
# 3. Clonar crawl4ai: git clone https://github.com/unclecode/crawl4ai.git
# 4. Levantar: IMAGE=unclecode/crawl4ai:latest docker-compose up -d
# 5. Configurar Vercel env vars (CRAWL4AI_URL, CRAWL4AI_API_TOKEN)
# 6. Deploye automático al push
```

---

## 🔗 Integración Crawl4AI

### Arquitectura

```
Vercel (Next.js)
    ↓ extractPageSeo(url)
@seo-optimizer/crawler
    ├── crawlWithCrawl4AI(url, baseUrl, token)
    │   └── POST http://CRAWL4AI_URL/crawl
    │       ├── Body: {"urls": ["url"]}
    │       ├── Headers: Authorization: Bearer {token}
    │       └── Returns: {success, results: [{url, html, cleaned_html, metadata, status_code}]}
    │
    └── parseSeoFromHtml(html, metadata)
        ├── Extract title/description from metadata
        ├── Extract canonical from full html (fallback)
        ├── Extract h1, h2, paragraphs from cleaned_html
        ├── Extract links, metadata tags
        └── Calculate wordCount, loadTimeMs

Persiste → MongoDB (Site + Pages)
```

### Key Files

- **`apps/crawler/src/crawler/crawl4ai-client.ts`**
  - Interfaz HTTP para Crawl4AI
  - Maneja autenticación con Bearer token
  - Timeout configurado: `timeoutMs` parameter

- **`apps/crawler/src/crawler/extract.ts`**
  - Orquesta: crawlWithCrawl4AI → parseSeoFromHtml → retorna PageSeo
  - Lee: CRAWL4AI_URL, CRAWL4AI_API_TOKEN de env

- **`apps/crawler/src/crawler/parse.ts`**
  - parseSeoFromHtml(url, html, statusCode, loadTimeMs, metadata, fullHtml)
  - Fallback para canonical: primero cleaned_html, luego full html

### Endpoints Crawl4AI

| Endpoint | Auth | Body | Response |
|----------|------|------|----------|
| `POST /crawl` | Bearer token | `{"urls": ["url"]}` | `{success, results: [{url, html, cleaned_html, metadata}]}` |
| `POST /md` | Bearer token | `{"url": "...", "filter": "fit"}` | `{url, markdown, success}` |
| `GET /health` | - | - | `{status, version}` |

---

## 📦 Package Dependencies

### apps/web (Next.js SaaS)

**Key dependencies:**
```json
{
  "next": "16.2.5",
  "react": "19.2.4",
  "mongoose": "8",
  "next-auth": "4.24.0",
  "@google/generative-ai": "latest",
  "zod": "latest",
  "bcryptjs": "latest",
  "tailwindcss": "latest"
}
```

### apps/crawler (@seo-optimizer/crawler)

**Type:** ES Modules (`type: "module"`)

**Key dependencies:**
```json
{
  "playwright": "latest",
  "cheerio": "latest",
  "fast-xml-parser": "latest",
  "axios": "latest",
  "p-limit": "latest"
}
```

### Shared packages

- **@seo-optimizer/types** - Centralized TypeScript type definitions
- **@seo-optimizer/config** - Shared Turbo configuration

---

## 🛠 Development Workflow

### Branching Strategy

```
master (main)
├── feature/integracion_selfhosting_crawl4ia
│   └── (feature branches siempre desde master)
└── bugfix/...
```

### Committing

```bash
# Crear branch
git checkout -b feature/nombre-descriptivo

# Hacer cambios, luego commit
git add apps/web/path/to/file
git commit -m "descriptive message about the change"

# Por example:
git commit -m "fix: canonical extraction fallback to full html when not in cleaned_html"

# Push
git push -u origin feature/nombre

# PR a master desde GitHub
```

**Important:** Commits MUST use descriptive messages. No "WIP" o "update" commits.

### Code Style

- **TypeScript:** Use strict type annotations, avoid `any`
- **Comments:** Only for non-obvious WHY (not WHAT)
- **File structure:** Keep imports organized (external → internal)
- **Naming:** camelCase for variables/functions, PascalCase for classes/components

### Testing

```bash
# Type check
npm run build

# Lint
npm run lint
```

---

## 🔐 Security & Multi-tenancy

### Route Protection

**Public routes:**
```
/, /login, /register, /api/auth/*, /api/register
```

**Protected routes (require JWT):**
```
/dashboard, /sites/*, /api/sites/*, /api/crawl/*, /api/organizations/*, 
/api/user/*, /api/suggestions/*, /organization-settings/*
```

**Middleware:** `apps/web/middleware.ts` enforces all protections

### Multi-tenancy Enforcement

1. **User Registration:** Automáticamente crea Organization + Membership (role: owner)
2. **All queries:** `{ organizationId: session.user.organizationId }`
3. **Server Components:** Validan `site.organizationId === session.organizationId`
4. **API:** Retornan 403 si organizationId no coincide

### Password Security

- Hashing: bcryptjs (10 salt rounds)
- Never logged
- Always compared with bcryptjs.compare()

---

## 🌍 Internacionalización (i18n)

### Soportados

- 🇪🇸 **Español** (default)
- 🇬🇧 **English**

### Estructura

```typescript
// lib/i18n/ui.ts
export const dictionaries = {
  es: { auth: { login: "Iniciar sesión" }, ... },
  en: { auth: { login: "Sign In" }, ... }
}

// Hook usage (Client Components)
const { t } = useI18n(lang);
t('auth.login')  // "Iniciar sesión" o "Sign In"

// Selector in /settings
```

### Componentes Traducidos

- LoginForm, RegisterForm, Header, DashboardContent
- DeleteSiteDialog, DeleteOrganizationDialog
- OrganizationSettings, SwitchOrgButton

---

## 📚 Documentation

### In-repo

- **`apps/web/docs/PROJECT.md`** - Arquitectura completa (schemas, APIs, flujos)
- **`apps/web/docs/CRAWLER_INTEGRATION.md`** - Integración Crawl4AI detalladaa
- **`apps/web/docs/SETTINGS_ARCHITECTURE.md`** - User & Organization settings
- **`apps/web/docs/SESSION_SCHEMA_MIGRATION.md`** - Historia de cambios

### Setup & Deployment

- **`CRAWL4AI_SETUP.md`** - Setup local + 4 opciones de producción
- **`PROJECT_OVERVIEW.md`** - Visión general del proyecto

---

## 🚨 Common Issues & Fixes

### Crawl4AI 401 Unauthorized

**Causa:** Token mismatch entre .env.local y contenedor

```bash
# 1. Verifica token en .env.local
grep CRAWL4AI_API_TOKEN apps/web/.env.local

# 2. Verifica token en contenedor
docker inspect crawl4ai | grep -A 5 "Env"

# 3. Si no coinciden, recrear contenedor
docker stop crawl4ai && docker rm crawl4ai
docker run -d \
  --name crawl4ai \
  -p 11235:11235 \
  -e CRAWL4AI_API_TOKEN=Airi2026 \
  unclecode/crawl4ai:latest

# 4. Reiniciar app
rm -rf .next
npm run dev
```

### Crawl4AI AbortError (Timeout)

**Causa:** CRAWLER_TIMEOUT_MS muy bajo

```bash
# Aumentar en .env.local
CRAWLER_TIMEOUT_MS=30000  # 30 segundos

# Reiniciar app
npm run dev
```

### MongoDB Connection Refused

**Dev:** 
```bash
docker-compose up -d
# Verifica: docker ps | grep mongo
```

**Prod:** Usar MongoDB Atlas connection string

---

## 📋 Roadmap

### ✅ Completado (Fase 1A)

- Multi-tenant architecture
- User registration & authentication (Credentials + Google)
- Organization & Membership management
- Crawl4AI integration (self-hosted)
- Site crawling & page data persistence
- Dashboard with site listing
- Site deletion (cascada)
- i18n (ES/EN)
- Route protection (middleware)

### 🚧 En Desarrollo (Fase 1B+)

- Sugerencias SEO automáticas (LLM)
- Página de detalles mejorada
- Export a DynamoDB (opcional)
- Más idiomas (FR, PT, etc.)

---

## 🔗 Recursos

- [Next.js Docs](https://nextjs.org/docs)
- [Mongoose Docs](https://mongoosejs.com/)
- [NextAuth v4](https://next-auth.js.org/v4)
- [Crawl4AI GitHub](https://github.com/unclecode/crawl4ai)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [Vercel Deployment](https://vercel.com/docs)

---

## 🎯 Quick Reference

### Find Something

| Need | Location |
|------|----------|
| **Shared UI components** | `packages/ui/src/components/*.tsx` |
| **App-specific components** | `apps/web/components/*.tsx` |
| **Mongoose schemas** | `apps/web/lib/models/*.ts` |
| **API endpoints** | `apps/web/app/api/**/route.ts` |
| **Page components** | `apps/web/app/**/page.tsx` |
| **Crawler logic** | `apps/crawler/src/crawler/*.ts` |
| **i18n strings** | `apps/web/lib/i18n/ui.ts` |
| **Database connection** | `apps/web/lib/db/mongoose.ts` |
| **Auth config** | `apps/web/lib/auth/` |
| **Full architecture docs** | `apps/web/docs/PROJECT.md` |
| **Crawl4AI integration** | `apps/web/docs/CRAWLER_INTEGRATION.md` |
| **Component organization guide** | `CLAUDE.md` → "Component Organization" section |
| **Monorepo setup** | `CLAUDE.md` → "Monorepo Configuration" section |

### Database Models

| Model | File | Collection |
|-------|------|-----------|
| **User** | NextAuth managed | `users` |
| **Organization** | `lib/models/Organization.ts` | `organizations` |
| **Membership** | `lib/models/Membership.ts` | `memberships` |
| **Site** | `lib/models/Site.ts` | `sites` |
| **Page** | `lib/models/Page.ts` | `pages` |
| **Suggestion** | `lib/models/Suggestion.ts` | `suggestions` |
| **UserSettings** | `lib/models/UserSettings.ts` | `usersettings` |
| **SiteSettings** | `lib/models/SiteSettings.ts` | `sitesettings` |

### Common Commands

```bash
# Development
npm run dev                 # Start all dev servers (Turbo watches web + crawler)
npm run build              # Build all packages in correct order
npm run lint               # Lint all packages

# Local testing
docker-compose up -d       # Start MongoDB
curl http://localhost:11235/health  # Test Crawl4AI
curl http://localhost:3000  # Test Next.js app

# Debugging
docker logs crawl4ai       # View Crawl4AI container logs
npm run dev 2>&1 | grep "Crawl4AI"  # Filter app logs
npm run dev 2>&1 | grep "@seo-optimizer"  # Filter package logs

# Monorepo-specific
npm run build              # Full build (respects dependencies)
npm run build -- --filter="@seo-optimizer/ui"  # Build only packages/ui
npm run build -- --filter="@seo-optimizer/web"  # Build only apps/web

# Clearing caches (if imports break)
rm -rf .next               # Next.js cache
npm install                # Reinstall workspace dependencies
npm run build              # Rebuild everything
```

### Environment Variables Checklist

**Local Dev (.env.local):**
- [ ] `MONGODB_URI` (local or Atlas)
- [ ] `AUTH_SECRET` (32-byte hex)
- [ ] `AUTH_URL` (http://localhost:3000)
- [ ] `AUTH_GOOGLE_ID` & `AUTH_GOOGLE_SECRET`
- [ ] `GOOGLE_API_KEY` (Gemini API)
- [ ] `CRAWL4AI_URL` (http://localhost:11235)
- [ ] `CRAWL4AI_API_TOKEN` (matches container)
- [ ] `CRAWLER_TIMEOUT_MS` (30000)

**Production (Vercel):**
- [ ] `MONGODB_URI` (Atlas connection string)
- [ ] `AUTH_SECRET` (different from dev)
- [ ] `AUTH_URL` (https://your-app.vercel.app)
- [ ] `CRAWL4AI_URL` (https://crawl4ai.yourdomain.com)
- [ ] `CRAWL4AI_API_TOKEN` (strong random token)
- [ ] All Google/LLM keys

---

**Última actualización:** 2026-09-28

**Próximas secciones:**
- Agregación de tips para debugging específicos de Vercel
- Guía de contribución para nuevos features
- Performance optimization guide

