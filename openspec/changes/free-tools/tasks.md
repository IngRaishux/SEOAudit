# Tasks

## 1. Configuración

- [ ] 1.1 Añadir `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` y `FREE_TOOLS_ENABLED` a `apps/web/.env.example` con las claves de prueba de Cloudflare y un comentario de uso, y `lib/free/config.ts` que lea el interruptor y los límites (20/20); verificar con un test que `FREE_TOOLS_ENABLED` distinto de `'true'` se interpreta como desactivado

## 2. Validación de URL y crawler

- [ ] 2.1 Crear `lib/free/publicUrl.ts` (protocolo, puerto, credenciales, nombres internos, literales IP y rangos privados IPv4/IPv6 con DNS inyectable) y su test con `localhost`, `127.0.0.1`, `10.0.0.1`, `172.16.0.1`, `192.168.1.10`, `169.254.169.254`, `100.64.0.1`, `[::1]`, `[fe80::1]`, `::ffff:127.0.0.1`, `ftp://`, puerto `:8080`, un dominio que resuelve a IP privada (rechazados) y un dominio público (aceptado); verificar con `npm test`
- [ ] 2.2 Añadir `sameHostOnly` a `CrawlOptions` en `apps/crawler/src/index.ts`, que filtra las entradas del sitemap por host (ignorando `www.`) antes de `maxUrls`, con un test en el crawler que lo compruebe y otro que confirme que sin la opción el comportamiento no cambia; verificar con los tests del crawler

## 3. Cupo y sesión

- [ ] 3.1 Crear `lib/free/quota.ts` (`utcDay`, `resetsAt`, `remaining`) y `lib/free/visitor.ts` (IP desde `x-forwarded-for` / `x-real-ip` y hash con `AUTH_SECRET`), con tests de cambio de día UTC, cabeceras con varias IPs y ausencia de cabeceras; verificar con `npm test`
- [ ] 3.2 Crear el modelo `lib/models/FreeUsage.ts` (índice único `{ visitor, day }` y TTL en `expiresAt`) y `lib/repositories/freeUsageRepository.ts` con `reserveCrawl`, `settleCrawl`, `reserveSuggestion`, `releaseSuggestion` y `getUsage` atómicos; verificar con un script contra el Mongo local que 5 reservas concurrentes no superan 20 páginas
- [ ] 3.3 Crear `lib/free/session.ts` (firma y verificación HMAC de `{ jobId, visitor, exp }`) y `lib/free/turnstile.ts` (`siteverify` con `fetch` inyectable), con tests de firma alterada, caducada, visitante distinto, y respuestas `success: true/false` y error de red de Turnstile; verificar con `npm test`

## 4. Rutas del servidor

- [ ] 4.1 `GET /api/free/quota`: cupo del visitante y `enabled`; verificar con `curl` que devuelve 20/20 para una IP nueva y `404 DISABLED` con el interruptor apagado
- [ ] 4.2 `POST /api/free/crawl` y `GET /api/free/crawl/[jobId]`: validación de URL, Turnstile, reserva, trabajo `kind: 'free'` sin persistencia, `crawlSite` con `maxUrls`, `concurrency: 3`, `sameHostOnly: true`, ajuste del cupo al terminar o fallar, cookie `free_session`, resumen por página y borrado del trabajo a la hora; verificar con `curl` usando las claves de prueba: rastreo de un sitio real, `INVALID_URL` para `http://localhost`, `TURNSTILE_FAILED` sin token, `QUOTA_EXCEEDED` tras agotar el cupo, `403` al pedir el estado sin cookie, y que `sites` y `pages` no cambian en Mongo
- [ ] 4.3 `POST /api/free/suggestions`: comprobación de cookie y de que la URL está en el trabajo, reserva, `generateSEOSuggestions` con los datos del servidor, liberación del cupo si falla y respuesta en texto plano; verificar con `curl`: `NOT_IN_JOB` para una URL ajena, cupo que baja tras una generación correcta, que no cambia si Gemini falla (simulado con una clave inválida) y que `suggestions` no cambia en Mongo

## 5. Interfaz

- [ ] 5.1 Extraer los rangos de longitud de `SERPPreview` a una constante compartida y crear `lib/free/issues.ts` (`pageIssues`) con su test (sin title, sin description, fuera de rango, sin H1, varios H1, estado distinto de 200); verificar con `npm test` y que `SERPPreview` se ve igual en `/sites/[siteId]`
- [ ] 5.2 Añadir los textos `home.freeTools.*` en ES y EN en `lib/i18n/ui.ts` (sección, formulario, errores por código, progreso, columnas, problemas, cupo, sugerencias, CTA y aviso de desactivado) con test de paridad de claves; verificar con `npm test`
- [ ] 5.3 Crear `components/landing/FreeTools.tsx` (servidor, con aviso si está desactivado) y colocarlo entre `Tools` y `UseCases` en `Landing.tsx`, con `data-motion="reveal"`; verificar sin JavaScript que el título y la explicación del cupo están en el HTML de `/` y `/en`
- [ ] 5.4 Crear `components/landing/FreeAnalyzer.tsx` (cliente): formulario con `FormField` y errores junto al campo, Turnstile cargado al enfocar, progreso, tabla con problemas, `SERPPreview` de la fila elegida, botón de sugerencias por fila con estado de cupo agotado, cupo visible y CTA de registro; verificar en el navegador el flujo completo con un sitio real

## 6. Verificación integral (Playwright contra `next build` + `next start`)

- [ ] 6.1 Flujo completo en `/` y `/en`: analizar un sitio, ver progreso y resultados, elegir una página y ver su SERP, generar una sugerencia y ver el cupo actualizado; sin errores en consola
- [ ] 6.2 Cupo: tras agotar las 20 páginas, el formulario muestra el cupo agotado con la hora de renovación; recargar no devuelve los resultados y conserva el cupo; otra pestaña ve el mismo cupo
- [ ] 6.3 Errores en la interfaz: URL inválida y `localhost` con el error junto al campo, sitio sin sitemap sin descontar cupo, e interruptor apagado con el aviso de no disponible
- [ ] 6.4 A 360 px la sección, la tabla de resultados y las sugerencias no provocan desplazamiento horizontal de la página
- [ ] 6.5 `npm test`, `npx eslint` y `npx tsc --noEmit` limpios en `apps/web`, tests del crawler en verde y `openspec validate free-tools --strict` pasa

## Workflow follow-up

- Corregir aparte que `generateSEOSuggestions` (Server Action) no comprueba sesión: hoy permite saltarse el cupo gratuito.
- Al archivar `landing-page-redesign` y este cambio, actualizar el requisito "Estructura de secciones de la landing" con la sección nueva.
