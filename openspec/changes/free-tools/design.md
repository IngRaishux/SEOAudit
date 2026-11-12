# Design

## Context

Ver proposal.md (Why). Estado actual relevante:

- `POST /api/crawl` exige sesión y organización, crea un trabajo en `lib/jobStore.ts` (un `Map` en memoria del proceso) y lanza `crawlSite()` sin esperar. Al terminar persiste `Site` y `Page` en Mongo. `GET /api/crawl/[jobId]` devuelve el progreso **sin comprobar sesión**.
- `crawlSite(url, { maxUrls, concurrency, renderJs, crawl4aiUrl, onProgress })` descubre el sitemap (`discoverSitemap`, que hace `fetch` desde Node a `/sitemap*.xml` y `robots.txt`), lee sus entradas y recorta con `maxUrls`. No filtra por host: un sitemap puede listar URLs de otros dominios.
- Las páginas las descarga Crawl4AI (contenedor propio); `sitemap`, `robots.txt` y `llms.txt` los descarga Node directamente.
- `lib/generateSEOSuggestions.ts` es una Server Action (`'use server'`) que recibe `{ url, title, description, wordCount }` y llama a Gemini (`gemini-3.6-flash`). **No comprueba sesión**: cualquiera puede invocarla desde el cliente.
- `middleware.ts` solo protege los prefijos de `PROTECTED_ROUTES`; `/api/free/*` queda público sin cambios.
- `SERPPreview` ya calcula los indicadores de longitud de title y description.
- Producción documentada en Vercel, pero el `Procfile` arranca un único `next start`; el `jobStore` en memoria ya depende de un solo proceso.

## Goals / Non-Goals

**Goals:**
- Reutilizar `crawlSite`, `generateSEOSuggestions` y `SERPPreview` sin duplicar lógica.
- Que el cupo sea atómico: dos peticiones simultáneas no pueden superar 20.
- Que ningún dato del modo gratuito llegue a las colecciones `sites`, `pages` o `suggestions`.

**Non-Goals:**
- Cambiar el flujo autenticado (`/api/crawl`, sugerencias de usuarios).
- Resolver la ejecución en varias instancias: se mantiene el `jobStore` en memoria, igual que hoy (ver Risks).
- Proteger contra DNS rebinding de forma completa (ver Risks).

## Decisions

### 1. Rutas

| Ruta | Uso |
|---|---|
| `GET /api/free/quota` | Cupo restante del visitante: `{ enabled, crawl: { used, limit }, suggestions: { used, limit }, resetsAt }` |
| `POST /api/free/crawl` | `{ url, turnstileToken }` → valida, reserva cupo, crea el trabajo y devuelve `{ jobId }`; emite la cookie de sesión |
| `GET /api/free/crawl/[jobId]` | Progreso y, al terminar, las páginas resumidas (solo con la cookie de ese trabajo) |
| `POST /api/free/suggestions` | `{ jobId, url }` → genera sugerencias para una página de ese trabajo |

Todas responden `404` con `{ code: 'DISABLED' }` si `FREE_TOOLS_ENABLED` no es `true`. Los errores usan códigos estables (`INVALID_URL`, `TURNSTILE_FAILED`, `QUOTA_EXCEEDED`, `NO_SITEMAP`, `NOT_IN_JOB`, `AI_FAILED`), traducidos en el cliente, igual que `/api/register`.

### 2. Identificación del visitante

`visitorKey(request)`: primera IP de `x-forwarded-for`, luego `x-real-ip` y, si no hay, `'unknown'`, y se guarda `sha256(ip + AUTH_SECRET)`. Nunca se guarda la IP en claro. Se usa `AUTH_SECRET` como sal para no añadir otra variable.

Alternativa descartada: cookie o fingerprint del navegador, que se borran o se falsifican con facilidad.

### 3. Cupo en Mongo

Colección `freeusages`: `{ visitor, day: 'YYYY-MM-DD' (UTC), crawlPages, suggestions, expiresAt }`, índice único `{ visitor, day }` e índice TTL sobre `expiresAt` (dos días).

- **Reserva atómica**: antes de rastrear se reservan las páginas que quedan con `findOneAndUpdate({ visitor, day, crawlPages: { $lte: 20 - n } }, { $inc: { crawlPages: n } }, { upsert: true })`, donde `n = 20 - usado`. `crawlSite` recibe `maxUrls: n`.
- **Ajuste**: al terminar se devuelve la diferencia entre lo reservado y lo realmente rastreado (`$inc: -(n - rastreadas)`). Si el rastreo falla (sin sitemap, error), se devuelve todo.
- **Sugerencias**: se incrementa en 1 solo tras una generación correcta, con la condición `suggestions: { $lt: 20 }` comprobada **antes** de llamar a Gemini (reserva) y revertida si falla, para que dos peticiones simultáneas no pasen de 20.

Funciones puras de cálculo (`remaining`, `utcDay`, `resetsAt`) en `lib/free/quota.ts`, con tests; el acceso a Mongo, en `lib/repositories/freeUsageRepository.ts`.

Alternativa descartada: guardar el cupo en memoria, que se pierde al reiniciar y es trivial de esquivar.

### 4. Turnstile y sesión de análisis

- El widget se carga desde `https://challenges.cloudflare.com/turnstile/v0/api.js` con `next/script` solo cuando el visitante enfoca el campo URL. Modo `managed`: la mayoría no ve ningún reto.
- `POST /api/free/crawl` verifica el token en `https://challenges.cloudflare.com/turnstile/v0/siteverify` con `TURNSTILE_SECRET_KEY` y la IP. Los tokens son de un solo uso.
- Las sugerencias no piden otro token: tras un rastreo correcto se emite la cookie `free_session` (`httpOnly`, `sameSite=lax`, 1 hora) con `{ jobId, visitor, exp }` firmados con HMAC-SHA256 y `AUTH_SECRET`. Las rutas de estado y de sugerencias exigen que el `jobId` coincida con la cookie y el `visitor` con la IP actual.
- En desarrollo se usan las claves de prueba de Cloudflare que siempre aprueban (`1x00000000000000000000AA` / `1x0000000000000000000000000000000AA`), documentadas en `.env.example`.

Alternativa descartada: pedir un Turnstile por cada sugerencia, porque obliga a resolver un reto por página.

### 5. URL pública y mismo host

`lib/free/publicUrl.ts`:

1. `new URL()`: protocolo `http:` o `https:`, sin usuario ni contraseña, puerto vacío, `80` o `443`.
2. Se rechazan `localhost`, `*.local`, `*.internal` y los literales IP.
3. `dns.lookup(host, { all: true })`: todas las direcciones deben ser públicas. Se rechazan loopback, privadas (10/8, 172.16/12, 192.168/16), link-local (169.254/16, incluida la metadata de nubes), CGNAT (100.64/10), `0.0.0.0/8` y sus equivalentes IPv6 (`::1`, `fc00::/7`, `fe80::/10`, IPv4 mapeadas).

Las comprobaciones de rangos son funciones puras con tests; la resolución DNS se inyecta para poder probarla.

En el crawler se añade `CrawlOptions.sameHostOnly?: boolean`. Si está activa, las entradas del sitemap se filtran por el host de la URL inicial (ignorando `www.`) **antes** de aplicar `maxUrls`. Por defecto es `false` y el flujo autenticado no cambia.

### 6. Trabajo gratuito y resultados

- Se reutiliza `jobStore` con un campo `kind: 'free'` y `visitor`. Para trabajos gratuitos no se llama a `persistCrawlResult`. El resultado se borra del `Map` 1 hora después de terminar (igual que la cookie), para no acumular memoria.
- `crawlSite(url, { maxUrls: n, concurrency: 3, renderJs: false, sameHostOnly: true })`.
- La ruta de estado devuelve un resumen por página (`url`, `statusCode`, `title`, `description`, `h1`, `wordCount`), no el HTML ni el texto completo.
- Los problemas por página se calculan en el cliente con una función pura `pageIssues(page)` en `lib/free/issues.ts` (sin title, sin description, longitudes fuera del rango de `SERPPreview`, sin H1, varios H1, estado distinto de 200), con tests. Los rangos se extraen de `SERPPreview` a una constante compartida para no duplicarlos.

### 7. Sugerencias

`POST /api/free/suggestions` busca la página en el trabajo (normalizando la URL) y llama a `generateSEOSuggestions` en el servidor con los datos guardados, no con lo que envía el cliente. Así el visitante no puede usar la ruta como proxy de Gemini con contenido arbitrario. Devuelve `title`, `description` y `keywords` en texto plano, no el formato DynamoDB.

### 8. Interfaz

- `components/landing/FreeTools.tsx` (servidor): encabezado, explicación del cupo y una rejilla de tarjetas de herramientas, preparada para más entradas. Si `FREE_TOOLS_ENABLED` no está activo, muestra el aviso de no disponible.
- `components/landing/FreeAnalyzer.tsx` (cliente): formulario con la validación propia del proyecto (`FormField`, sin alertas del navegador), widget Turnstile, `progress` daisyUI mientras rastrea (sondeo cada segundo), tabla con `badge` por problema, `SERPPreview` de la fila elegida, botón de sugerencias por fila y una `alert` con el CTA de registro.
- El cupo se pide a `/api/free/quota` al montar y se actualiza con las respuestas.
- Textos en `home.freeTools.*` (ES/EN), con test de paridad.
- Encabezado y tarjeta con `data-motion="reveal"`, para seguir el patrón de `landing-gsap-animations`.

## Risks / Trade-offs

- [`generateSEOSuggestions` es una Server Action sin comprobación de sesión, ya invocable hoy sin cuenta, saltándose cualquier cupo] → Fuera de alcance de este cambio, pero conviene corregirlo aparte: sin eso, el cupo gratuito de sugerencias se puede esquivar llamando a la acción directamente.
- [`GET /api/crawl/[jobId]` no comprueba sesión] → Las rutas nuevas sí la comprueban. La existente queda igual.
- [La IP en `x-forwarded-for` es falsificable si la app no está detrás de un proxy de confianza] → Turnstile por análisis limita el abuso; en Vercel la cabecera la pone la plataforma.
- [Varias personas tras la misma IP (oficina, CGNAT móvil) comparten cupo] → Aceptado para la versión gratuita; el mensaje de cupo agotado invita a crear cuenta.
- [DNS rebinding: el dominio resuelve a una IP pública al validar y a una privada cuando Crawl4AI o Node lo descargan] → Se valida también cada URL del sitemap contra el host ya validado y no se siguen redirecciones a otros hosts en el descubrimiento del sitemap. Protegerlo del todo requeriría fijar la IP en las descargas de Crawl4AI, fuera de alcance.
- [El `jobStore` en memoria no funciona con varias instancias] → Igual que el crawler actual. Si se despliega en serverless con varias instancias, el sondeo puede caer en otra instancia; queda anotado para cuando se migre el almacén de trabajos.
- [Coste de Gemini y Crawl4AI] → Tope de 20 + 20 por IP, Turnstile y el interruptor `FREE_TOOLS_ENABLED` para cortarlo sin desplegar.

## Migration Plan

1. Configurar `NEXT_PUBLIC_TURNSTILE_SITE_KEY` y `TURNSTILE_SECRET_KEY` (claves de prueba en desarrollo) y `FREE_TOOLS_ENABLED=true`.
2. La colección `freeusages` y sus índices se crean al primer uso con Mongoose (`autoIndex`).
3. Para retirarlo: `FREE_TOOLS_ENABLED=false` oculta el formulario y desactiva las rutas; los datos de `freeusages` caducan solos.

## Open Questions

- Texto exacto y orden de los problemas en la tabla: se puede ajustar en revisión de diseño sin cambiar el comportamiento.
