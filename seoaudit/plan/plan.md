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

## Modelo de datos MongoDB

- **Colecciones gestionadas por el adapter de Auth.js** (driver nativo `mongodb`, no Mongoose): `users`, `accounts` (OAuth linking — no confundir con "cuenta" de negocio), `verificationTokens`. Con JWT strategy no se pobla `sessions`.
- **Modelos Mongoose propios** (mismo `MONGODB_URI`, colecciones distintas):
  - `Organization` (colección `organizations`): tenant de negocio. `name`, `slug`, `createdByUserId`, timestamps. (Se llama `Organization`, no `Account`, para evitar la colisión de nombres con la colección `accounts` de Auth.js.)
  - `Membership` (colección `memberships`): `userId`, `organizationId`, `role: "owner"|"admin"|"member"`, índice único compuesto `{userId, organizationId}`.
- "Cuenta activa": cada `User` crea una sola `Organization` al registrarse; el callback `jwt` de Auth.js resuelve la primera `Membership` y guarda `accountId` + `organizationName` en el token/sesión.

## Extensión de DynamoDB para multi-tenancy

En `packages/types/src/dynamodb.ts`, agregar `accountId: string` a `DynamoSiteItem`, `DynamoPageItem`, `DynamoSuggestionItem` (sin tocar el `PK`/`SK` primario existente). Agregar a `DynamoSiteItem` un nuevo GSI2:

| GSI2PK | GSI2SK | Uso |
|---|---|---|
| `ACCOUNT#<accountId>` | `SITE#<createdAt ISO8601>` | Listar todos los sites de una cuenta (para el dashboard) |

Solo `DynamoSiteItem` necesita el GSI2 — Page/Suggestion siempre se acceden vía un `siteId` ya conocido; su `accountId` es para trazabilidad y para validar en el Route Handler que `site.accountId === session.accountId` antes de servir sus datos.

Actualizar `docs/dynamo-schema.md` con: el nuevo atributo `accountId` en las tres tablas de item types, la sección `GSI2`, la fila de access pattern "Listar sites de una cuenta", y una nota explícita de que no hay validación referencial entre Mongo y Dynamo — la consistencia la garantiza la aplicación.

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

### Pendientes para Fase 1B - DynamoDB + Persistencia:
```
lib/db/dynamo.ts                                 # DynamoDBClient singleton (hoy no existe)
lib/repositories/siteRepository.ts               # createSite, getSiteById, listSitesByAccount (usa GSI2)
lib/repositories/pageRepository.ts               # batchPutPages, listPagesBySite
lib/repositories/suggestionRepository.ts         # putSuggestion, getSuggestion
app/api/sites/route.ts                           # GET — sites del accountId de la sesión
app/api/suggestions/route.ts                     # POST — persiste una sugerencia generada
components/SignOutButton.tsx                     # botón de logout
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

### ✅ Completado en Fase 1A:
- Autenticación con email/password funcional (registro + login)
- User, Organization, Membership creados en MongoDB automáticamente al registrarse
- Sesión JWT con accountId y organizationName en el token
- Server Component dashboard protegido con getServerSession(handler)
- SessionProvider en layout para acceso a sesión en Client Components
- Google OAuth provider configurado (pendiente botón funcional)
- next-auth v4.24.0 estable (compatible con Next.js 16.2.5)

### 🔄 En progreso:
- Prueba de Google OAuth flow
- Documentación actualizada del plan

### 📋 Próximos pasos para Fase 1B:
1. Probar Google OAuth (botón ya existe en LoginForm)
2. Extender DynamoDB schema con `accountId` y GSI2
3. Crear repositorios de DynamoDB
4. Implementar persistencia de Sites/Pages/Suggestions
5. Dashboard real que lista sites por cuenta
6. Migración del flujo de crawl para persistir resultados

## Verificación (Fase 1A - completada)

✅ Flujo manual de registro/login:
- Registrarse por email/password → ✅ se crea User + Organization + Membership en Mongo
- Iniciar sesión con credenciales → ✅ sesión JWT con accountId/organizationName
- Acceder a `/dashboard` → ✅ sesión disponible, puede ver su información

⏳ Pendiente (Fase 1B):
- Google OAuth login
- Craulear una URL como usuario autenticado → confirmar que aparece en `/dashboard` con `accountId`
- Persistencia de sugerencias SEO
- Validación multi-tenancy (segunda cuenta no ve sites de la primera)
- `npm run lint` y `npm run build` deben pasar sin errores
