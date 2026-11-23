# Tasks

Todas las rutas son relativas a `seoaudit/apps/web/`, salvo que se indique otra cosa. La verificación de tipos se hace con `npx tsc --noEmit` y los tests con `npm test`.

## 1. Setup

- [x] 1.1 Agregar `nodemailer` y `@types/nodemailer` a `package.json`. Verificar que `npm install` termina sin errores y que `import nodemailer from 'nodemailer'` compila.
- [x] 1.2 Agregar el servicio `mailpit` (SMTP en 1025, UI en 8025) a `seoaudit/docker-compose.yml`. Verificar que con `docker compose up mailpit` la UI responde en `http://localhost:8025`.
- [x] 1.3 Agregar a `seoaudit/.env.example` las variables `SMTP_HOST=localhost`, `SMTP_PORT=1025`, `SMTP_SECURE=false` y `MAIL_FROM="SEOAudit <no-reply@localhost>"`, con `SMTP_USER` y `SMTP_PASS` vacías (Mailpit no pide autenticación). Así el entorno local apunta a Mailpit por defecto. Verificar que copiando `.env.example` a `.env.local` y levantando Mailpit, un correo de prueba aparece en `:8025`.

## 2. Roles y reglas de permisos

- [x] 2.1 Crear `lib/auth/permissions.ts` con `OrgRole`, `OrgAction` y `can(role, action)` según la tabla de design.md §1. Agregar `permissions.test.ts`, que recorra la matriz completa de la propuesta (4 roles × 6 acciones), y verificar que pasa.
- [x] 2.2 Crear `lib/org/memberRules.ts` con `canChangeRole`, `canRemove`, `canLeave`, `canDelete` y `canTransfer`, que devuelven `{ ok } | { ok: false, code }`. Agregar `memberRules.test.ts` cubriendo cada escenario de `specs/org-membership`: un admin no toca al owner, nadie cambia su propio rol, nadie asigna `owner`, el owner no sale, la transferencia es solo a un admin y el borrado solo procede sin otros miembros. Verificar que pasa.
- [x] 2.3 Actualizar `lib/models/Membership.ts`: el enum pasa a `owner|admin|editor|viewer`, sin default implícito a `member`, y se agrega el índice único parcial `{ organizationId: 1 }` con `role: 'owner'`. Verificar que `tsc` no reporta usos de `'member'`.
- [x] 2.4 Crear `scripts/verify-org-roles.ts`, de solo lectura salvo con `--fix` (`member` → `editor`). Debe reportar las membresías `member` y las orgs con cero o más de un owner. Verificar ejecutándolo contra la base local y comprobando que la salida es correcta.

## 3. Autorización centralizada en las rutas existentes

- [x] 3.1 Crear `lib/auth/orgAccess.ts` con `requireOrgAccess`, `requireSiteAccess`, `requirePageAccess`, `requireSuggestionAccess` y `requireJobAccess`. Cada uno sigue el orden 401 → 404 → 403 → `can()` y devuelve `{ ok, userId, membership, organizationId } | { ok: false, response }`. Verificar con `tsc`.
- [x] 3.2 Hacer que `resolveGeoContext` (`lib/geo/server/access.ts`) reciba un `OrgAction` y delegue en `requireSiteAccess`. Las rutas `sites/[siteId]/profile`, `profile/suggest`, `structured-data`, `structured-data/resolve` y `llms-txt` usan `site.read` en GET y `content.edit` en escritura. Verificar que un `viewer` recibe 403 en `PUT .../profile` y 200 en el GET.
- [x] 3.3 Migrar `sites/[siteId]` (GET `site.read`; DELETE y PATCH `site.delete`), `site-settings/[siteId]` (GET `site.read`, escritura `content.edit`), `sites/[siteId]/generate-all` y `generate-all/[jobId]` (`content.edit` / `site.read`), y `pages/[pageId]`, que hoy no exige sesión (`site.read`). Verificar que `pages/[pageId]` sin sesión responde 401 y que un `editor` recibe 403 al borrar un sitio.
- [x] 3.4 Migrar `crawl` (`crawl.run`, con `organizationId` obligatorio en el body y 400 si falta), `crawl/[jobId]` (`site.read` sobre la org del job), `sites` (`?org=` obligatorio) y `suggestions` y `suggestions/[suggestionId]` (lectura `site.read`, escritura `content.edit`). Verificar que un `viewer` puede crawlear y recibe 403 al hacer PATCH de una sugerencia.
- [x] 3.5 Quitar `accountId` de `types/next-auth.d.ts` y de los callbacks `jwt`/`session` de `lib/auth/auth.ts`, eliminar los fallbacks de `memberships[0]` de todas las rutas y actualizar `app/crawler/page.tsx` y `app/sugerence/page.tsx` para que envíen siempre el `org` activo. Verificar que `tsc` no reporta ningún uso de `accountId` en la sesión (las rutas de migración de campos de Mongo no cuentan) y que el crawl desde `/crawler?org=<id>` sigue funcionando.
- [x] 3.6 Migrar `PATCH /api/organizations/[orgId]` a `requireOrgAccess(orgId, 'org.manage')`, sin el fallback de `findOne({ userId })`. Verificar que un `admin` recibe 403 al renombrar.

## 4. Gestión de miembros y ciclo de vida de la organización

- [x] 4.1 Extraer `createOrganizationWithOwner(name, userId)` en `lib/org/` (slug único y membresía `owner`), usarla en `POST /api/organizations`, en `POST /api/register` y en el callback `signIn` de Google, y corregir la creación en ese callback, que hoy omite `slug` y `createdByUserId`. Verificar que un alta nueva con Google crea su organización correctamente.
- [x] 4.2 Crear `GET /api/organizations/[orgId]/members`, que devuelve `userId`, nombre, email, rol y fecha, haciendo join con `users`. Exige `site.read`. Verificar que un `viewer` recibe la lista.
- [x] 4.3 Crear `PATCH` y `DELETE /api/organizations/[orgId]/members/[userId]` con `members.manage` + `canChangeRole`/`canRemove`. Verificar que asignar `owner` responde 400 y que un admin recibe 403 al tocar al owner.
- [x] 4.4 Crear `POST /api/organizations/[orgId]/leave` con `canLeave`: 409 para el owner y borrado de la membresía para los demás. Verificar ambos casos.
- [x] 4.5 Crear `POST /api/organizations/[orgId]/transfer` (`{ targetUserId, confirmName }`) con `org.manage` + `canTransfer`: primero degrada al owner y después promueve al admin, con compensación si el segundo paso no modifica nada (design.md §3). Verificar que tras la transferencia hay exactamente un owner y el anterior queda como admin, y que transferir a un editor responde 400.
- [x] 4.6 Agregar `canDelete` a `DELETE /api/organizations/[orgId]`: 409 si hay otros miembros. Verificar que con un viewer adentro el borrado se rechaza y que sin otros miembros se borra.

## 5. Modelo de invitación y correo

- [x] 5.1 Crear `lib/models/Invitation.ts` con los campos e índices de design.md §4, incluido el único parcial `{ organizationId, email }` con `status: 'pending'`. Verificar con `tsc`.
- [x] 5.2 Crear `lib/invitations/token.ts` (`generateToken`, `hashToken`) y `lib/invitations/state.ts` (`normalizeEmail`, `effectiveStatus`, que calcula `expired`, y `expiresAtFrom(now)`). Agregar tests: el token tiene 43 caracteres en base64url, el hash es estable, la normalización quita mayúsculas y espacios, y la invitación vence a los 7 días. Verificar que pasan.
- [x] 5.3 Crear `lib/mail/mailer.ts` con `sendMail`, que nunca lanza excepción y escribe en consola si falta `SMTP_HOST`. Verificar enviando un correo de prueba a Mailpit y viéndolo en `:8025`.
- [x] 5.4 Crear `lib/mail/templates/invitation.ts` (HTML inline y texto) y agregar los textos es/en en `lib/i18n`. Agregar un test que verifique que el asunto y el cuerpo incluyen a quien invita, la organización, el rol, el vencimiento y el link en ambos idiomas, y verificar que pasa.

## 6. API de invitaciones

- [x] 6.1 Crear `GET` y `POST /api/organizations/[orgId]/invitations` con `members.manage`. El POST valida el rol (no `owner`), devuelve 409 si el email ya es miembro o ya tiene una invitación pendiente, guarda el hash, envía el correo, registra `emailStatus` y devuelve `{ invitation, link }`. Verificar que el correo llega a Mailpit, que un duplicado responde 409 y que con el SMTP apagado la invitación queda con `emailStatus: 'failed'`.
- [x] 6.2 Crear `POST .../invitations/[id]/resend` (token nuevo, 7 días nuevos, reenvío del correo) y `DELETE .../invitations/[id]` (revoca). Verificar que tras reenviar el link anterior deja de funcionar y que una invitación revocada no se puede aceptar.
- [x] 6.3 Crear `GET /api/invitations/[token]`, público y con datos mínimos, que no revela la organización si el token no es válido. Verificar las respuestas para un token válido, uno inexistente, uno vencido y uno revocado.
- [x] 6.4 Crear `POST /api/invitations/[token]` (`accept` / `decline`), que exige sesión con el email coincidente (403 si no coincide), acepta con un `findOneAndUpdate` condicional + `upsert` de la membresía con `$setOnInsert`, y fija la cookie `selectedOrganization`. Verificar que aceptar dos veces no duplica la membresía y que un miembro existente conserva su rol.
- [x] 6.5 Hacer que `DELETE /api/organizations/[orgId]` revoque las invitaciones pendientes antes de borrar la org. Verificar que el link de una invitación de una org borrada muestra "no válida".

## 7. Flujo del invitado

- [x] 7.1 Crear la página `app/invite/[token]` con estos estados: inválida, vencida, sin sesión (con botones de login y registro), sesión con otro email (con aviso y cierre de sesión) y pregunta "[X] te ha invitado a [Org]. ¿Deseas aceptar?" con Aceptar y Rechazar, todo en es/en. Verificar cada estado en el navegador.
- [x] 7.2 Soportar `?invite=<token>` en `LoginForm` y `RegisterForm`: email bloqueado, sin campo de organización y `callbackUrl=/invite/<token>` para credenciales y Google. Verificar que después del login se vuelve a la pantalla de aceptación.
- [x] 7.3 Crear `hasPendingInvitation(email)` y usarla en `POST /api/register` y en el callback `signIn` de Google para no crear la org personal. Verificar que un alta con invitación pendiente no crea ninguna organización y que un alta sin invitación con Google sí la crea.

## 8. Interfaz de miembros

- [x] 8.1 Separar `/organization-settings/[orgId]` en las pestañas General y Miembros. General queda editable solo por el owner. Verificar que un admin ve General en solo lectura.
- [x] 8.2 Implementar la tabla de miembros con el selector de rol y el botón quitar, visibles según `memberRules`. Verificar que un viewer no ve acciones y que un admin no ve acciones sobre el owner.
- [x] 8.3 Implementar el diálogo "Invitar miembro" (email y rol) que, tras crear la invitación, muestra el link con un botón para copiarlo. Agregar la lista de invitaciones con estado, vencimiento, aviso de "correo no enviado", reenviar y revocar, visible solo para owner y admin. Verificar el flujo completo con Mailpit.
- [x] 8.4 Implementar la zona de peligro: transferir (selector de admins y confirmación con el nombre de la org), borrar (adaptando `DeleteOrganizationDialog`) y salir. Cada botón bloqueado muestra el paso que falta ("asciende a alguien a admin para poder transferir", "quita a los miembros antes de borrar la organización"). Verificar los tres bloqueos y las tres acciones.

## 9. Interfaz según el rol

- [x] 9.1 Pasar el rol de la org activa al dashboard y a `sites/[siteId]` (y sus subpáginas de GEO y generate-all), y ocultar con `can()` las acciones de generar sugerencias, editar el perfil, JSON-LD y llms.txt, y borrar el sitio. Verificar que un viewer solo ve la lectura y el botón de nuevo crawl.

## 10. Verificación integral

- [x] 10.1 Ejecutar `npx tsc --noEmit`, `npm run lint` y `npm test` en `apps/web` y verificar que terminan sin errores.
- [x] 10.2 Recorrido de punta a punta con Mailpit:
  1. El owner invita a un email nuevo como editor.
  2. El invitado se registra desde el link, sin que se le cree una org personal, y acepta.
  3. El owner lo asciende a admin y le transfiere la propiedad.
  4. El ex-owner sale de la organización.
  5. El nuevo owner quita al resto e intenta borrar la org.

  Verificar que cada paso respeta los specs y que `scripts/verify-org-roles.ts` no reporta problemas al final.

## Workflow follow-up

- Correr `scripts/verify-org-roles.ts` contra producción antes de desplegar.
- **Pospuesto:** elegir y configurar el SMTP de producción (`SMTP_*` y `MAIL_FROM` en Vercel). Mientras tanto, en producción las invitaciones funcionan copiando el link y quedan marcadas como "correo no enviado".
- Archivar el change con `/opsx:archive` cuando esté revisado.
