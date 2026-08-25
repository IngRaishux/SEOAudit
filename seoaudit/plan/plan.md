# Fase 1 SaaS: Autenticación OAuth + Multi-tenancy (Mongo + DynamoDB)

## Contexto

SEOAudit es hoy una herramienta de un solo uso, sin persistencia real ni usuarios: se ingresa una URL, se craulea, y los resultados viven en un `Map` en memoria (`jobStore.ts`) + `sessionStorage`. No hay login, no hay noción de "cuenta" (el único campo "Account Name" es texto libre sin relación a identidad), y el diseño de DynamoDB documentado en `docs/dynamo-schema.md` nunca se conectó al código.

El objetivo de esta fase 1 es sentar la base para convertir esto en un SaaS multi-tenant: agregar autenticación (Google OAuth + email/password) y persistencia real, de forma que cada usuario tenga su propia cuenta y sus sites/sugerencias queden aislados por cuenta. **No incluye billing/suscripciones** — eso queda para una fase posterior.

Decisiones ya acordadas con el usuario:
- **Sin servidor Express separado**: se usa el backend nativo de Next.js (Route Handlers/Server Actions) como única capa de API.
- **Dos motores de datos, cada uno con su rol**: MongoDB para identidad/tenancy (User, Organization, Membership — gestionado por Auth.js), y **DynamoDB se mantiene** para el dominio de negocio existente (Site, Page, Suggestion), extendido con un `accountId` para poder filtrar/listar por cuenta. Se conectan por referencia de ID (el `accountId` guardado en Dynamo es el `Organization._id` de Mongo), no por joins.
- **OAuth**: Google + credenciales de email/password.

**Nota de seguridad (housekeeping, no bloqueante):** la `GOOGLE_API_KEY` de Gemini en `.env.local` pasó por logs de esta sesión de exploración — rotarla en Google AI Studio como parte del PR de hardening (no afecta el diseño de esta fase).

## Librería de auth: Auth.js (NextAuth) v4.24.0

Elegida sobre Lucia (proyecto archivado), Clerk/Auth0 (SaaS hosted, choca con requisito de mantener todo en Mongo propio) y better-auth (adapter de Mongo no first-party, API menos madura). **Nota**: Se usa v4.24.0 (stable) en lugar de v5 beta para garantizar compatibilidad con Next.js 16.2.5.

- Session strategy: **JWT** (requerido para la estrategia de autenticación actual).
- Config única en `lib/auth/auth.ts` que exporta `handler` como GET/POST para los Route Handlers.
- En Server Components, usar `getServerSession(handler)` para obtener la sesión (patrón estándar v4).
- Al iniciar sesión por primera vez con Credentials (`events.signIn`), crear automáticamente una `Organization` personal + `Membership` con `role: "owner"` — no hay UI de invitar miembros en fase 1, pero el modelo soporta multi-org a futuro.
- El Credentials provider **no crea usuarios**, solo autentica → registro va por un Route Handler propio (`app/api/register/route.ts`) que hashea password con `bcryptjs` y valida input con `zod`.
- **MongoDBAdapter removido**: Aunque está disponible, se removió para evitar conflictos con JWT strategy; la autenticación usa solo el Credentials provider y Google OAuth.

## Stack del Crawler Web

**Librería Principal:** `@seo-optimizer/crawler`

**Tecnologías Internas:**
- **Playwright**: Motor headless para renderizado de JavaScript (navegación real)
- **Cheerio**: Parser HTML ultra-ligero para extraer datos de la DOM
- **Node.js Workers**: Concurrencia de hasta 5 requests paralelos

**Capacidades:**
- ✅ Detecta y crawlea URLs del sitemap.xml
- ✅ Extrae meta tags (title, description, og:*, robots, canonical)
- ✅ Recolecta headings (h1, h2) para estructura
- ✅ Captura HTTP status codes (200, 404, etc)
- ✅ Resuelve enlaces relativos y absolutos
- ✅ Callback de progreso en tiempo real

**Integración en SEOAudit:**
1. Frontend llama `POST /api/crawl` con URL
2. Route Handler crea un Job (en memoria, en `lib/jobStore.ts`)
3. `runCrawl()` ejecuta `crawlSite()` en background
4. Callback `onProgress` actualiza job.processed/total para polling
5. Al completar: persist en MongoDB vía `persistCrawlResult(job)`
6. Frontend obtiene `siteId` (ObjectId de MongoDB) en siguiente polling

**Limitaciones:**
- Máximo ~1000 páginas por crawl (dependiendo de sitemap)
- No soporta autenticación requerida
- JavaScript muy dinámico puede no capturarse completamente
- Respetuoso: máx 5 requests concurrentes, sin reintento automático

Referir a `docs/PROJECT.md` sección "🕷️ Arquitectura del Crawler" para detalles completos.

## Modelo de datos MongoDB

- **Colecciones gestionadas por el adapter de Auth.js** (driver nativo `mongodb`, no Mongoose): `users`, `accounts` (OAuth linking — no confundir con "cuenta" de negocio), `verificationTokens`. Con JWT strategy no se pobla `sessions`.
- **Modelos Mongoose propios** (mismo `MONGODB_URI`, colecciones distintas):
  - `Organization` (colección `organizations`): tenant de negocio. `name`, `slug`, `createdByUserId`, timestamps. (Se llama `Organization`, no `Account`, para evitar la colisión de nombres con la colección `accounts` de Auth.js.)
  - `Membership` (colección `memberships`): `userId`, `organizationId`, `role: "owner"|"admin"|"member"`, índice único compuesto `{userId, organizationId}`.
- "Cuenta activa": cada `User` crea una sola `Organization` al registrarse; el callback `jwt` de Auth.js resuelve la primera `Membership` y guarda `accountId` + `organizationName` en el token/sesión.

## Persistencia de Crawleos (Fase 1B)

**Enfoque Principal**: Los resultados del crawl se guardan en **MongoDB** como fuente de verdad, con multi-tenancy mediante `accountId`.

**Modelos Mongoose a crear**:
- `Site` (colección `sites`): URL, accountId, createdAt, updatedAt
- `Page` (colección `pages`): siteId (ref), URL, title, statusCode, accountId
- `Suggestion` (colección `suggestions`): pageId (ref), siteId (ref), type, description, accountId

**Índices**:
- `Site`: compound index `{accountId, createdAt}` para listar por cuenta
- `Page`: índice en `siteId` para listar pages de un site
- `Suggestion`: índice en `pageId` para listar sugerencias de una página

**Flujo del crawler**:
1. Usuario autenticado en `/api/crawl` con sesión
2. Ejecutar crawl (jobStore en memoria para progreso en vivo)
3. Al completar: persistir Site + Pages + Suggestions en MongoDB con `accountId` de la sesión
4. Dashboard lista sites/pages/suggestions por `accountId`

**DynamoDB (Opcional)**:
- Exportación configurable: si el usuario lo desea, puede enviar datos a DynamoDB como respaldo/análisis
- No es bloqueante para Fase 1B
- Se implementaría en Fase 2 con un endpoint separado de exportación

## Estructura de archivos nuevos en `apps/web` (✅ completados hasta aquí)

### Completados en Fase 1A - Autenticación Base:
```
middleware.ts                                    # ✅ middleware mínimo (actualmente solo pasa request)
lib/auth/auth.ts                                 # ✅ config de NextAuth v4, exporta handler/GET/POST
lib/db/mongo.ts                                  # ✅ MongoClient singleton + connectToDatabase()
lib/db/mongoose.ts                               # ✅ conexión Mongoose singleton
lib/models/Organization.ts                       # ✅ Mongoose schema
lib/models/Membership.ts                         # ✅ Mongoose schema
lib/password.ts                                  # ✅ bcryptjs hash/compare
app/api/auth/[...nextauth]/route.ts              # ✅ export { GET, POST } desde auth.ts
app/api/register/route.ts                        # ✅ POST endpoint para registro
app/login/page.tsx                               # ✅ Server Component con LoginForm
app/register/page.tsx                            # ✅ Server Component con RegisterForm
app/dashboard/page.tsx                           # ✅ protegido con getServerSession(handler)
components/LoginForm.tsx                         # ✅ Client form con signIn(credentials) y signIn(google)
components/RegisterForm.tsx                      # ✅ Client form con POST a /api/register
components/SessionProvider.tsx                   # ✅ SessionProvider en app/layout.tsx
types/next-auth.d.ts                             # ✅ module augmentation para session.user
```

### ✅ Completados en Fase 1B (MongoDB + Persistencia):
```
✅ Modelos Mongoose:
   lib/models/Site.ts                            # ✅ Schema: url, accountId, title, crawlStatus, pageCount
   lib/models/Page.ts                            # ✅ Schema: siteId (ref), url, accountId, statusCode, metaTags
   lib/models/Suggestion.ts                      # ✅ Schema: pageId (ref), siteId (ref), accountId, type, severity

✅ Persistencia de crawl:
   lib/repositories/siteRepository.ts            # ✅ CRUD: create, get, listByAccount, update, delete, count
   lib/repositories/pageRepository.ts            # ✅ CRUD: create, batch, listBySite, update, delete
   lib/repositories/suggestionRepository.ts      # ✅ CRUD: create, listByPage, listBySite, update, delete
   app/api/crawl/route.ts                        # ✅ POST: auth + persistencia automática con accountId
   lib/jobStore.ts                               # ✅ Actualizado: siteId, accountId en cada job

🚧 Pendientes para Dashboard + Detalles:
   app/dashboard/page.tsx                        # lista sites por accountId
   app/api/sites/route.ts                        # GET — listar sites del accountId
   app/sites/[siteId]/page.tsx                   # ver detalles de un site + pages
   app/page.tsx                                  # navegar a /sites/[siteId] post-crawl

🚀 DynamoDB (Fase 2 - Opcional):
   Endpoint de exportación configurable a DynamoDB (cuando se defina el esquema)
```

## Cambios en archivos existentes

### ✅ Completados en Fase 1A:
- **`app/layout.tsx`**: ✅ envuelto con `SessionProvider` (además del `CrawlProvider` ya existente).
- **`types/next-auth.d.ts`**: ✅ module augmentation con Session y User types.

### 🚧 Pendientes para Fase 1B (DynamoDB + Persistencia):
- **`next.config.ts`**: agregar `"mongodb"`, `"mongoose"`, `"@aws-sdk/client-dynamodb"`, `"@aws-sdk/lib-dynamodb"` a `serverExternalPackages` (ya tiene `playwright`, `cheerio`, `@google/genai`).
- **`app/api/crawl/route.ts`**: exigir sesión vía `getServerSession(handler)` (401 si no hay); en `runCrawl`, tras completar, generar un `siteId` **nuevo y estable** (`crypto.randomUUID()`, distinto del `jobId` efímero) y persistir el site + pages vía los repositorios de Dynamo con el `accountId` de la sesión. Agregar `siteId` al tipo `Job` en `lib/jobStore.ts`. El `jobStore` en memoria **se conserva** — sigue siendo el mecanismo correcto para el progreso en vivo del polling; solo deja de ser la fuente de verdad post-crawl.
- **`app/page.tsx`**: `router.push` debe navegar a `/sites/${data.siteId}` (el id persistido), no a `/sites/${jobId}` como hoy — el endpoint de polling debe incluir `siteId` en su respuesta una vez completado.
- **`app/sites/[siteId]/page.tsx`**: reemplazar `jobStore.get(siteId)` por `getServerSession(handler)` + `siteRepository.getSiteById(siteId)` + `pageRepository.listPagesBySite(siteId)`, con chequeo `site.accountId === session.user.accountId` (→ `notFound()` si no coincide).
- **`components/DialogSugestion.tsx`**: eliminar el input libre "Nombre de la Cuenta" y su estado; usar `useSession()` para obtener `organizationName` y pasarlo directo a `generateSEOSuggestions`, simplificando el diálogo a una simple confirmación.
- **`app/sugerence/page.tsx`**: tras generar la sugerencia, persistirla vía `POST /api/suggestions` (hoy solo vive en estado de React y se pierde al recargar).
- **`.env.example`** (raíz): agregar bloque Mongo (`MONGODB_URI`, `MONGODB_DB_NAME`), Auth.js (`AUTH_SECRET`, `AUTH_URL`) y Google OAuth (`AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` — distintos de `GOOGLE_API_KEY` de Gemini, no confundir).

## Dependencias nuevas (`apps/web/package.json`)

```
✅ next-auth@4.24.0 (versión exacta, stable)
   ❌ @auth/mongodb-adapter (removido — no necesario con JWT strategy)
✅ mongodb@6
✅ mongoose@8
✅ bcryptjs@2.4.3
✅ zod@3
   (pendiente) @aws-sdk/client-dynamodb
   (pendiente) @aws-sdk/lib-dynamodb
```

## Orden recomendado de PRs

### ✅ Fase 1A - Autenticación Base (completada):
1. ✅ **Fundación Mongo**: `lib/db/mongo.ts`, `lib/db/mongoose.ts`, modelos `Organization`/`Membership`.
2. ✅ **Auth.js v4 con Credentials**: config de auth, registro, login, middleware, `SessionProvider` en layout, `getServerSession` en Server Components.

### 🚧 Fase 1B - DynamoDB + Persistencia (pendiente):
3. **Google OAuth**: agregar botón en LoginForm. Proveedor ya configurado en auth.ts.
4. **Extensión de esquema Dynamo**: `packages/types/src/dynamodb.ts` + `docs/dynamo-schema.md` (agregar `accountId`, GSI2 para account listing).
5. **Repositorios Dynamo**: `lib/db/dynamo.ts`, `lib/repositories/siteRepository.ts`, `pageRepository.ts`, `suggestionRepository.ts`.
6. **Dashboard real**: `app/dashboard/page.tsx` que lista sites por `accountId`, `app/api/sites/route.ts` para GET.
7. **Migración del flujo de crawl**: `app/api/crawl/route.ts` con sesión + persistencia de Site/Pages en Dynamo con `accountId`. Agregar `siteId` a `Job` type.
8. **Persistencia de sugerencias**: `app/api/suggestions/route.ts`, actualizar `DialogSugestion.tsx` para quitar input "Nombre de la Cuenta".
9. **Hardening**: rotar `GOOGLE_API_KEY`, revisar cobertura del `middleware.ts`.

## Estado Actual (2026-08-24)

### ✅ Completado en Fase 1A - Autenticación:
- ✅ Email/password registration + login
- ✅ Google OAuth (completo y funcional)
- ✅ User, Organization, Membership en MongoDB
- ✅ JWT session con accountId y organizationName
- ✅ Header global con logout en todas las páginas
- ✅ Dashboard protegido con getServerSession(handler)
- ✅ SessionProvider para Client Components

### ✅ Completado en Fase 1B - MongoDB Persistencia:
- ✅ Modelos Mongoose: Site, Page, Suggestion (con índices)
- ✅ Repositorios CRUD: siteRepository, pageRepository, suggestionRepository
- ✅ Integración en `/api/crawl`: Automáticamente persiste resultados con accountId
- ✅ jobStore actualizado: agrega siteId y accountId a cada job
- ✅ Endpoint retorna: `{ jobId, siteId }` para navegación post-crawl

### ✅ Documentación Completada:
- ✅ `docs/PROJECT.md` - Arquitectura de datos, rutas de API, modelos, componentes, flujos principales
- ✅ Plan actualizado con estado actual (este archivo)
- ✅ `.env.example` - Variables de entorno documentadas

### ✅ Completado en Fase 1A - Multi-Org Management (última sesión):
- ✅ Settings sincronizado con organización seleccionada (`?org={orgId}`)
- ✅ Navbar navega automáticamente a Settings con parámetro org
- ✅ Sección "Danger Zone" en Settings para eliminación de organizaciones
- ✅ Diálogo de confirmación en dos pasos (advertencia + confirmar nombre)
- ✅ Endpoint DELETE con cascada de eliminación (Sites, Pages, Suggestions, Memberships)
- ✅ Protección contra acceso a organizaciones eliminadas
- ✅ Historial limpio (router.replace previene volver a org eliminada)
- ✅ Todos los errores de TypeScript resueltos

### 🚧 Pendientes para Fase 1B - Dashboard + Detalles:
1. Google OAuth: testing end-to-end (proveedor ya configurado)
2. Invitar miembros a organización con roles
3. Rate limiting por organización según plan
4. Mejorar dashboard: filtros, búsqueda, sorting, exportación
5. Hardening: rotar GOOGLE_API_KEY, CORS, CSRF

## Verificación (Fase 1A - completada)

✅ Autenticación & Registro:
- Registrarse por email/password → ✅ crea User + Organization + Membership en Mongo
- Iniciar sesión con credenciales → ✅ sesión JWT con accountId/organizationName
- Logout funciona correctamente

✅ Multi-Organización:
- Un usuario crea múltiples organizaciones → ✅ todas visible en navbar
- Cambiar entre organizaciones → ✅ dashboard y settings se sincroniza
- Dashboard muestra sitios de org seleccionada → ✅ filtrado por accountId
- Settings muestra datos de org seleccionada → ✅ sincronizado con query param

✅ Operaciones CRUD:
- Crear organización → ✅ POST `/api/organizations`
- Editar nombre de organización (owner) → ✅ PUT `/api/organizations/[orgId]`
- Eliminar organización (owner) → ✅ DELETE `/api/organizations/[orgId]` con cascada
- Crawlear URL → ✅ persiste Sites y Pages con accountId
- Generar sugerencias SEO → ✅ persiste en MongoDB

✅ Seguridad & Multi-Tenancy:
- User no puede ver sites de otra org → ✅ 404 si intenta acceso directo
- Memberships eliminados previenen acceso a org borrada → ✅ redirige a /settings
- Router.replace previene volver atrás a org eliminada → ✅ historial limpio
- TypeScript strict mode → ✅ `npm run build` sin errores de tipo

⏳ Pendiente (Fase 1B):
- Google OAuth: testing end-to-end completo
- Invitar miembros con roles (Admin/Member/Viewer)
- Rate limiting por organización
- Dashboard mejorado: filtros, búsqueda, exportación
- Tests automatizados
