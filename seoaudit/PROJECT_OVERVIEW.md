# SEO Audit - Visión General del Proyecto

## Índice
1. [Descripción](#descripción)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Arquitectura](#arquitectura)
4. [Fases de Desarrollo](#fases-de-desarrollo)
5. [Documentación](#documentación)

---

## Descripción

**SEO Audit** es una aplicación SaaS multi-tenant que permite a usuarios autenticados:
- 🔍 Rastrear/crawlear sitios web
- 📊 Analizar su SEO
- 💡 Recibir sugerencias de mejora
- 🗑️ Eliminar sitios de la plataforma
- 🌍 Usar la interfaz en español o inglés

**Tipo:** SaaS multi-tenant con multi-lenguaje
**Audiencia:** Agencias SEO, especialistas en SEO, propietarios de sitios
**Modelo:** Usuario → Organización → Sitios → Páginas → Sugerencias

---

## Stack Tecnológico

### Frontend/Backend
- **Next.js 16.2.5** - Framework full-stack React
  - Route Handlers para API
  - Server Components para rendering
  - Client Components para interactividad
  - Middleware para protección de rutas

### Autenticación & Autorización
- **NextAuth v4.24.0** - Autenticación
  - Credentials (email/password)
  - Google OAuth 2.0
  - JWT sessions
  - Role-based access control (owner, admin, member)

### Base de Datos
- **MongoDB** - Base de datos NoSQL
- **Mongoose 8** - ORM para MongoDB
  - Schemas con validación
  - Índices para performance
  - Relationships entre modelos

### Validación & Seguridad
- **Zod** - Validación de schemas TypeScript
- **bcryptjs** - Hashing de contraseñas
- **JWT** - Tokens seguros (via NextAuth)

### Internacionalización
- **Custom i18n** - Sistema centralizado
  - 200+ strings traducidos
  - Soporte: Español, English
  - Persistencia en localStorage
  - Detección automática de idioma

### Lenguaje & Tooling
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos utilitarios
- **ESLint** - Linting

---

## Arquitectura

### Modelo de Datos

```
User
  ├── Memberships (N:1 → Organization)
  │    └── role: owner | admin | member
  │
  └── Organizations (N:N via Membership)
      └── Sites
          ├── Pages
          │    └── (contenido crawleado)
          └── Suggestions
               └── (recomendaciones SEO)
```

### Flujo de Datos

```
Cliente (Next.js UI)
    ↓
Middleware (JWT validation)
    ↓
Route Handler (/api/*)
    ↓
Repository (siteRepository, pageRepository, etc.)
    ↓
Mongoose Model
    ↓
MongoDB
```

### Protección de Rutas

```
Públicas: /, /login, /register, /api/auth/*, /api/register
Protegidas: /dashboard, /sites/*, /crawler, /api/sites/*, etc.
  ↓
Middleware valida JWT
  ↓
getToken() → token válido? → permite acceso
              → no válido? → redirige a /login
```

### Multi-tenancy

```
Cada organización es independiente
  ├── sites filtrados por organizationId
  ├── pages filtrados por organizationId
  ├── suggestions filtrados por organizationId
  └── Control de acceso via Membership.role
```

---

## Fases de Desarrollo

### ✅ Fase 1A - COMPLETADA

**Features Implementadas:**
1. ✅ Dashboard real - Listar sitios por organización
2. ✅ Eliminar sitios - DELETE /api/sites/[siteId]
3. ✅ Middleware de seguridad - Protección de rutas privadas
4. ✅ Internacionalización - Español + Inglés (12 componentes)
5. ✅ Componentes traducidos - Forms, dialogs, navegación

**Estadísticas:**
- 12 componentes traducidos
- 200+ strings en i18n
- 1 nuevo endpoint API
- 1 middleware mejorado
- Build: ✅ Exitoso (0 TypeScript errors)

### 📅 Fase 1B - PLANEADA

**Features Planeadas:**
1. Traducir páginas de error (404, 500)
2. Traducir server components (página de crawl, detalles de sitio)
3. Agregar más idiomas (FR, PT, DE)
4. i18n avanzado (pluralization, date formatting)
5. Testing suite para traducción

### 🚀 Fase 2 - FUTURO

**Features Futuras:**
1. Generación de sugerencias con AI
2. Dashboard analítico avanzado
3. Exportación de datos
4. API pública para integraciones
5. Webhooks para eventos

---

## Documentación

### Documentación Técnica

**`apps/web/docs/`:**
- **`PROJECT.md`** - Documentación técnica completa (actualizado Fase 1A)
  - Arquitectura de datos
  - Rutas de API
  - Modelos Mongoose
  - Componentes
  - Flujos principales
  - Variables de entorno
  - Seguridad

- **`CHANGELOG_FASE1A_FINAL.md`** - Registro de cambios Fase 1A
  - Resumen ejecutivo
  - Features implementadas
  - Cambios en componentes
  - Archivos nuevos/modificados
  - Estadísticas finales
  - Próximos pasos

- **`SETTINGS_ARCHITECTURE.md`** - Arquitectura de settings
  - User Settings (preferencias globales)
  - Organization Settings (configuración org)
  - Navigation flows

- **`SESSION_SCHEMA_MIGRATION.md`** - Migración de schema de sesión
  - Cambios de estructura
  - Impacto en autenticación

### Guías de Desarrollo

**Cómo usar cada feature:**
1. **Eliminar sitios** - Ver "Cómo usar las nuevas features" en CHANGELOG
2. **Cambiar idioma** - Ir a /settings, selector de idioma
3. **Acceder a rutas protegidas** - Automático con middleware

### Estructura del Repositorio

```
seoaudit/
├── apps/
│   └── web/
│       ├── app/                          # Next.js app directory
│       │   ├── api/                      # Route handlers
│       │   │   ├── sites/[siteId]/       # GET, DELETE site
│       │   │   ├── organizations/        # Org management
│       │   │   └── ...
│       │   ├── dashboard/                # Dashboard principal
│       │   ├── login/                    # Login page
│       │   ├── register/                 # Register page
│       │   ├── settings/                 # User settings (con i18n)
│       │   ├── organization-settings/    # Org settings
│       │   └── ...
│       ├── components/                   # React components
│       │   ├── LoginForm.tsx             # Traducido
│       │   ├── RegisterForm.tsx          # Traducido
│       │   ├── Header.tsx                # Traducido
│       │   ├── DeleteSiteDialog.tsx      # Traducido
│       │   ├── DashboardContent.tsx      # Nuevo (Fase 1A)
│       │   └── ...
│       ├── lib/
│       │   ├── i18n/                     # Nuevo (Fase 1A)
│       │   │   ├── ui.ts                 # Diccionario
│       │   │   ├── useI18n.ts            # Hooks
│       │   │   └── server.ts             # Server functions
│       │   ├── models/                   # Mongoose schemas
│       │   ├── repositories/             # Data access layer
│       │   ├── auth/                     # NextAuth config
│       │   └── db/                       # Database connections
│       ├── middleware.ts                 # Mejorado (Fase 1A)
│       ├── docs/                         # Documentación
│       │   ├── PROJECT.md                # Actualizado (Fase 1A)
│       │   ├── CHANGELOG_FASE1A_FINAL.md # Nuevo (Fase 1A)
│       │   ├── SETTINGS_ARCHITECTURE.md
│       │   └── SESSION_SCHEMA_MIGRATION.md
│       └── ...
└── PROJECT_OVERVIEW.md                   # Este archivo
```

---

## Cómo Empezar

### Setup inicial
```bash
# Instalar dependencias
npm install

# Crear .env.local con variables requeridas
cp .env.example .env.local

# Build
npm run build

# Dev server
npm run dev
```

### Variables de Entorno Requeridas
```
MONGODB_URI=mongodb://...
MONGODB_DB_NAME=seo-mongodb
AUTH_SECRET=<32-byte hex>
AUTH_URL=http://localhost:3000
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...
GOOGLE_API_KEY=...
```

### Primera sesión
1. Registrarse en `/register`
2. Crear organización
3. Ir a `/dashboard`
4. Cambiar idioma en `/settings`
5. Crear un sitio con crawler

---

## Contacto & Soporte

**Documentación técnica detallada:** Ver `apps/web/docs/PROJECT.md`
**Cambios recientes:** Ver `apps/web/docs/CHANGELOG_FASE1A_FINAL.md`
**Issues & PRs:** Use GitHub issues for bug reports

---

## Últimas Actualizaciones (Fase 1A)

- ✅ Agregado endpoint DELETE /api/sites/[siteId]
- ✅ Implementado middleware de protección de rutas
- ✅ Sistema i18n completo (ES/EN) en 12 componentes
- ✅ Nuevo componente DashboardContent (refactorisado)
- ✅ Selector de idioma en /settings
- ✅ Build exitoso: 0 TypeScript errors

**Fecha:** Septiembre 10, 2026
**Versión:** 1.0.0-phase1a
