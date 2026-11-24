# Design

## Context

- **Datos.** `Membership` (`userId` string, `organizationId`, `role`) tiene un índice único `(userId, organizationId)`. Los usuarios viven en la colección `users`, que se accede con el driver nativo y no tiene modelo de mongoose.
- **Autorización.** Cada ruta repite: sesión → resolver `userId` por email → `Membership.findOne(...)` → comparar el rol a mano. Hay tres problemas:
  - Varias rutas (`crawl`, `sites`, `suggestions`, `organizations/[orgId]`) resuelven la organización con `Membership.findOne({ userId })` sin filtrar por org. Los callbacks `jwt`/`session` de `lib/auth/auth.ts` fijan `accountId = memberships[0]`.
  - `GET /api/pages/[pageId]` no exige sesión.
  - Las rutas GEO usan `resolveGeoContext` (`lib/geo/server/access.ts`), que solo verifica que la membresía exista.
- **Organización activa.** Se toma de `?org=` en `/dashboard` y de la cookie `selectedOrganization` (`app/actions.ts`).
- **Alta de usuarios.**
  - `POST /api/register` crea la organización solo si llega `organizationName`.
  - El callback `signIn` de Google crea una org con `ownerId` y sin `slug` ni `createdByUserId`. Esos dos campos son obligatorios en el schema, así que hoy esa creación falla la validación.
- **Correo.** No hay infraestructura. La app se despliega en Vercel. En local, Mongo corre en `docker-compose.yml` como instancia standalone, sin replica set, así que no hay transacciones disponibles en desarrollo.
- **Tests.** Vitest para módulos puros en `lib/**`. No hay tests de rutas ni de UI.

## Goals / Non-Goals

**Goals:**
- Una sola fuente de verdad de permisos, testeable sin base de datos.
- Garantizar a nivel de base de datos que nunca haya dos owners en una organización.
- Que ninguna ruta pueda autorizar contra una organización distinta a la del recurso.
- Que el envío de correo no sea un punto único de falla para invitar.

**Non-Goals:**
- Middleware global de autorización en `proxy`/`middleware`. Se autoriza en cada ruta con un helper.
- Rate limiting de invitaciones.
- Reescribir las páginas existentes más allá de ocultar acciones según el rol.

## Decisions

### 1. Permisos como tabla estática de acciones

`lib/auth/permissions.ts` exporta los tipos `OrgRole` y `OrgAction`, y una función `can(role, action)` basada en un mapa `Record<OrgAction, OrgRole[]>`:

```
site.read          owner admin editor viewer
crawl.run          owner admin editor viewer
content.edit       owner admin editor          (IA, sugerencias, settings, perfil, JSON-LD, llms.txt)
site.delete        owner admin
members.manage     owner admin                 (invitaciones, cambio de rol, quitar)
org.manage         owner                       (renombrar, borrar, transferir)
```

Las reglas relativas, que dependen de a quién se aplica la acción (por ejemplo, que un admin no toque al owner o que nadie cambie su propio rol), van en `lib/org/memberRules.ts` como funciones puras: `canChangeRole(actor, target, newRole)`, `canRemove(actor, target)`, `canLeave(member, orgStats)`, `canDelete(orgStats)` y `canTransfer(actor, target)`. Cada una devuelve `{ ok } | { ok: false, code }`, donde `code` lo traduce la interfaz a mensajes que explican el paso que falta.

*Alternativa descartada:* comparar rangos (`viewer < editor < admin < owner`). Es más corto, pero el viewer crawlea y no edita, así que los permisos no siguen un orden lineal limpio. Además, una tabla explícita se lee como la matriz de la propuesta.

### 2. Helpers de acceso que resuelven la organización desde el recurso

`lib/auth/orgAccess.ts`:
- `requireOrgAccess(orgId, action)`
- `requireSiteAccess(siteId, action)`: resuelve `site.organizationId`.
- `requirePageAccess`, `requireSuggestionAccess`, `requireJobAccess`: resuelven el sitio o la organización del recurso.

Todos devuelven `{ ok: true, userId, membership, organizationId } | { ok: false, response }`, el mismo patrón que `resolveGeoContext`. El flujo es: sesión (401) → recurso (404) → membresía en la organización del recurso (403) → `can()` (403). El `userId` se obtiene con `getSessionUserId()`, que ya existe.

`resolveGeoContext(siteId, action)` delega en `requireSiteAccess`. Las rutas GET usan `site.read` y las de escritura `content.edit`.

Las operaciones sin recurso previo exigen la organización de forma explícita:
- `POST /api/crawl`: `organizationId` en el body.
- `GET /api/sites` y `GET/POST /api/suggestions`: `?org=`.

Los clientes ya conocen la organización activa por el `?org=` del dashboard.

**Se elimina `session.user.accountId`** de los callbacks y del tipo `Session`, para que el compilador señale cualquier uso que quede. `session.user.organizations` se mantiene, porque lo usa el selector.

*Alternativa descartada:* seguir con `accountId` y solo validar la membresía. El problema es que el `accountId` sigue apuntando a una org arbitraria, lo que da errores silenciosos con usuarios de varias organizaciones.

### 3. Un solo owner: índice único parcial y transferencia con compensación

- **Garantía en la base.** Índice en `Membership`: `{ organizationId: 1 }` único con `partialFilterExpression: { role: 'owner' }`. La base impide dos owners, sin importar qué haga el código.
- **Transferencia** (`POST /api/organizations/[orgId]/transfer`, `{ targetUserId, confirmName }`), en dos updates condicionales:
  1. `updateOne({ org, userId: actor, role: 'owner' }, { role: 'admin' })`
  2. `updateOne({ org, userId: target, role: 'admin' }, { role: 'owner' })`

  Si el paso 2 no modifica nada (el target dejó de ser admin), se revierte el paso 1 y se responde 409. Con el índice parcial, el orden "degradar primero" es obligatorio: promover primero violaría la unicidad.
- `Organization.createdByUserId` no cambia: es histórico. La propiedad vive en `Membership`.

*Alternativa descartada:* transacciones de Mongo. Requieren replica set, y el `docker-compose` local es standalone. El riesgo es una ventana de milisegundos sin owner, cubierta por la compensación (ver Risks).

### 4. Modelo `Invitation`

```
Invitation {
  organizationId   ObjectId, ref Organization, index
  email            string, lowercase, trim
  role             'admin' | 'editor' | 'viewer'
  tokenHash        string, unique                 sha256(token) en hex
  invitedByUserId  string
  status           'pending' | 'accepted' | 'declined' | 'revoked'
  expiresAt        Date
  emailStatus      'sent' | 'failed'
  emailError?      string
  acceptedByUserId?, respondedAt?
  timestamps
}
indices:
  { organizationId: 1, email: 1 } único, partial { status: 'pending' }   (una pendiente por email y org)
  { email: 1, status: 1 }                                                (¿tiene invitación pendiente? en el alta)
```

- **`expired` no se guarda.** Se calcula como `status === 'pending' && expiresAt < now`. Así no hace falta un job, y una invitación vencida sigue ocupando el lugar de "pendiente" hasta que se reenvía o se revoca. Eso coincide con el spec: "sugiere reenviar".
- **Token.** `crypto.randomBytes(32).toString('base64url')`. Se busca por `sha256(token)`, una comparación exacta sobre un índice único. No hace falta comparar en tiempo constante, porque se compara el hash y no el secreto.
- **Reenviar.** Genera un token nuevo, reemplaza `tokenHash`, resetea `expiresAt` y reintenta el correo, todo sobre el mismo documento.
- **Borrar la organización.** Hace `updateMany({ organizationId, status: 'pending' }, { status: 'revoked' })` antes de borrar la org.
- **Link inválido tras borrar la org.** La pantalla de aceptación no encuentra la org y muestra "no válida".

### 5. Aceptación idempotente

`POST /api/invitations/[token]` con `{ action: 'accept' | 'decline' }`:
1. Busca por hash. Si no existe, no está `pending` o venció → 410 con un `code`.
2. Si el email de la sesión normalizado no coincide → 403.
3. Para aceptar:
   - `findOneAndUpdate({ _id, status: 'pending', expiresAt: { $gt: now } }, { status: 'accepted', ... })`. Este update condicional evita la doble aceptación.
   - Luego `Membership.updateOne({ userId, organizationId }, { $setOnInsert: { role } }, { upsert: true })`. Si ya era miembro, conserva su rol.
4. Fija la cookie `selectedOrganization` y responde `{ redirect: '/dashboard?org=<id>' }`.

`GET /api/invitations/[token]` (público) devuelve solo lo necesario para la pantalla: nombre de quien invita, nombre de la org, rol, email invitado y estado. Si el token no es válido, no revela datos de la org.

*Alternativa descartada:* aceptar con un GET al abrir el link. Los escáneres de seguridad de los clientes de correo abren los links, y eso aceptaría invitaciones sin intervención del usuario.

### 6. Correo con Nodemailer detrás de un puerto mínimo

- **`lib/mail/mailer.ts`.** Expone `sendMail({ to, subject, html, text }): Promise<{ sent: true } | { sent: false; error }>`.
  - El transporte se crea de forma perezosa desde `SMTP_HOST/PORT/SECURE/USER/PASS`, con remitente `MAIL_FROM`.
  - Sin `SMTP_HOST`, el link se escribe en consola y se devuelve `{ sent: false, error: 'SMTP_NOT_CONFIGURED' }`.
  - Nunca lanza excepción.
- **`lib/mail/templates/invitation.ts`.** Función pura `(data, lang) => { subject, html, text }`, con HTML simple inline-styled y versión de texto. Los textos van en `lib/i18n` (es/en) y el idioma es el de quien invita.
- **Link.** `${AUTH_URL}/invite/${token}`.
- **Desarrollo.** Servicio `mailpit` en `docker-compose.yml`: SMTP en :1025, UI en :8025.

*Alternativas descartadas:* Resend y SES, porque el proyecto prioriza recursos propios. React Email, porque es una dependencia innecesaria para una sola plantilla.

### 7. Invitado sin sesión y alta sin organización personal

- **Pantalla sin sesión.** `/invite/[token]` muestra quién invita y a qué org, con dos botones: "Iniciar sesión" (`/login?invite=<token>`) y "Crear cuenta" (`/register?invite=<token>`).
- **Login y registro.**
  - `LoginForm` y `RegisterForm` leen `invite` y piden `GET /api/invitations/[token]` para obtener el email.
  - Muestran el email en un campo de solo lectura.
  - Ocultan el campo de nombre de organización.
  - Usan `callbackUrl = /invite/<token>` tanto en `signIn('credentials')` como en `signIn('google')`.
- **Servidor.** `POST /api/register` y el callback `signIn` de Google consultan `hasPendingInvitation(email)`. Si hay una, no crean la org personal, aunque llegue `organizationName`.
  - El callback de Google pasa a crear la org con `slug` y `createdByUserId`, igual que `POST /api/organizations`. Se extrae una función compartida `createOrganizationWithOwner(name, userId)`.
- **Email distinto al invitado.** Si con Google se entra con un email distinto, la pantalla de aceptación muestra el aviso de otra cuenta.

### 8. Rutas nuevas

```
GET    /api/organizations/[orgId]/members                       site.read
PATCH  /api/organizations/[orgId]/members/[userId]  {role}      members.manage + canChangeRole
DELETE /api/organizations/[orgId]/members/[userId]              members.manage + canRemove
POST   /api/organizations/[orgId]/leave                         miembro + canLeave
POST   /api/organizations/[orgId]/transfer                      org.manage + canTransfer
GET    /api/organizations/[orgId]/invitations                   members.manage
POST   /api/organizations/[orgId]/invitations  {email, role}    members.manage   -> { invitation, link }
POST   /api/organizations/[orgId]/invitations/[id]/resend       members.manage   -> { invitation, link }
DELETE /api/organizations/[orgId]/invitations/[id]              members.manage   (revoca)
GET    /api/invitations/[token]                                 público
POST   /api/invitations/[token]  {action}                       sesión
```

`DELETE /api/organizations/[orgId]` agrega `canDelete`: el owner tiene que ser el único miembro, si no responde 409. `GET .../members` hace join con `users` para traer nombre y email.

### 9. Interfaz

`/organization-settings/[orgId]` pasa a tener pestañas:
- **General:** la actual, editable solo por el owner.
- **Miembros:**
  - Tabla de miembros con un selector de rol y el botón quitar, que se muestran según `canChangeRole` y `canRemove`.
  - Botón "Invitar" que abre un diálogo con email y rol. Al crear, el diálogo muestra el link con un botón para copiarlo.
  - Lista de invitaciones con estado, vencimiento y aviso de "correo no enviado", y acciones copiar link (solo justo después de crear o reenviar), reenviar y revocar.
  - Zona de peligro: transferir, borrar o salir, cada acción con el mensaje de bloqueo correspondiente.

Las reglas puras de `memberRules.ts` se reutilizan en el cliente para decidir qué mostrar. El dashboard y `sites/[siteId]` reciben el rol de la org activa y ocultan las acciones con `can()`.

### 10. Ajustes durante la implementación

- **Sugerencias.** `POST /api/suggestions` resuelve la organización desde el `siteId` del body (`requireSiteAccess`) en vez de exigir `?org=`. El recurso ya determina la organización y los clientes existentes no cambian.
- **Middleware.** Las rutas `/api/*` protegidas responden 401 en JSON sin sesión, en lugar de redirigir a `/login`.
- **Server Action de IA.** `generateSEOSuggestions` (`'use server'`, invocable desde cualquier cliente) ahora recibe `siteId` y exige `content.edit`. Antes no exigía ni sesión.
- **Id de usuario con Google.** El callback `jwt` guarda como `token.id` el `_id` de `users`, no el id del proveedor. Sin esto, las búsquedas de membresía de usuarios de Google fallaban.
- **Perfil GEO en solo lectura.** Para viewers, el perfil GEO se muestra dentro de un `fieldset` deshabilitado. Las pestañas de idioma son `<a role="tab">` para que se pueda seguir cambiando de idioma.

## Risks / Trade-offs

- **[Ventana sin owner durante la transferencia, o fallo entre los dos updates]** → Si el proceso muere entre el paso 1 y el 2, la org queda sin owner. Mitigaciones:
  - La compensación inmediata.
  - Un script `scripts/check-org-owners.ts` que lista las orgs sin owner o con más de uno.
  - Usar transacciones si en el futuro la base de producción corre como replica set.
- **[El correo cae en spam o el SMTP no está configurado]** → La invitación se crea igual, el link se puede copiar y la interfaz muestra "correo no enviado".
- **[Link reenviado por el invitado a otra persona]** → La aceptación exige una sesión cuyo email coincida con el invitado.
- **[Enumeración o fuerza bruta de tokens]** → Los tokens tienen 256 bits y la respuesta para un token inválido no revela la organización. El rate limiting queda fuera de alcance.
- **[Clientes que no envían `org` explícito]** → Esas rutas pasan a responder 400. Se actualizan todos los llamadores del repo en el mismo cambio, y el `tsc` sin `accountId` ayuda a encontrarlos.
- **[El índice parcial falla al crearse si ya hay datos inválidos]** → El script de migración verifica antes que no haya orgs con más de un owner ni membresías `member`.
- **[El JWT conserva `organizations` desactualizado]** → El callback `session` lo recalcula en cada lectura, y la autorización siempre consulta `Membership`. Quitar a un miembro tiene efecto inmediato.

## Migration Plan

1. Antes de desplegar, correr `scripts/verify-org-roles.ts`, en modo solo lectura por defecto. Reporta las membresías con rol `member` y las orgs con cero o más de un owner. Con `--fix`, convierte `member` → `editor`. Ese caso no debería existir.
2. Desplegar. Mongoose crea los índices nuevos (`autoIndex`). Si falla, el script del paso 1 indica qué corregir.
3. Configurar `SMTP_*` y `MAIL_FROM` en Vercel. Mientras no estén, las invitaciones funcionan con el link copiado.
4. **Rollback:** revertir el despliegue. La colección `invitations` y el índice parcial son compatibles con el código anterior. Las membresías `editor`/`viewer` creadas mientras tanto fallarían la validación del enum viejo solo al guardarse, no al leerse, y el código anterior las trataría como miembros sin privilegios de owner.

## Open Questions

- Servidor SMTP de producción (servidor propio o relay del dominio corporativo). **Pospuesto por decisión del usuario:** este cambio solo se prueba en desarrollo con Mailpit. Elegir el servidor solo afecta la configuración, no el código, y sin SMTP configurado las invitaciones siguen funcionando con el link copiable.
