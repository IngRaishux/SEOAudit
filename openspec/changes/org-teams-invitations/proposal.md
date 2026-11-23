# Proposal

## Why

Hoy cada organización de SEOAudit tiene un solo usuario: quien la creó, con rol `owner`. No hay forma de sumar colaboradores. El enum de `Membership` ya declara `admin` y `member`, pero nadie los asigna, y los permisos se revisan a mano en cada ruta, de forma inconsistente. Para trabajar en equipo (agencias, cadenas hoteleras con varias personas de marketing) hacen falta roles con permisos claros e invitaciones por correo.

## What Changes

- **Cuatro roles por organización**: `owner` (exactamente uno), `admin`, `editor` y `viewer`, con esta matriz de permisos:

  | Acción | owner | admin | editor | viewer |
  |---|---|---|---|---|
  | Ver sitios y reportes | ✓ | ✓ | ✓ | ✓ |
  | Lanzar crawl | ✓ | ✓ | ✓ | ✓ |
  | Generar sugerencias con IA | ✓ | ✓ | ✓ | – |
  | Editar site settings, perfil de negocio, JSON-LD y llms.txt | ✓ | ✓ | ✓ | – |
  | Borrar sitio | ✓ | ✓ | – | – |
  | Invitar y revocar invitaciones | ✓ | ✓ | – | – |
  | Cambiar rol o quitar miembros | ✓ | ✓* | – | – |
  | Renombrar o borrar la org, transferir la propiedad | ✓ | – | – | – |

  \* El admin no puede modificar ni quitar al owner, ni asignar el rol `owner`.

- **BREAKING**: el rol `member` sale del enum y lo reemplazan `editor` y `viewer`. Hoy ninguna membresía lo usa; un script lo verifica antes del despliegue.
- **Autorización centralizada**: todas las rutas que tocan datos de una organización validan el permiso con un único helper, y resuelven la organización a partir del recurso (sitio, página, sugerencia, job) o de un `orgId` explícito. Se elimina el fallback a "la primera membresía del usuario". También se cierra `GET /api/pages/[pageId]`, que hoy no exige sesión.
- **Invitaciones por correo**: el owner o un admin invita un email con un rol. Se envía un correo (Nodemailer sobre SMTP configurable) con un link de un solo uso que vence en 7 días. El link también se puede copiar desde la interfaz, y la invitación se puede reenviar o revocar.
- **Pantalla de aceptación** `/invite/[token]`: "[quien invita] te ha invitado a [organización]. ¿Deseas aceptar?", con las opciones Aceptar y Rechazar. Si el invitado no tiene sesión, pasa por registro o login con el email bloqueado. Si el email de la sesión no coincide con el invitado, se le avisa. Al registrarse con una invitación pendiente, no se le crea una organización personal.
- **Ciclo de vida de la organización**:
  - Cualquier miembro que no sea owner puede salir.
  - El owner solo puede salir después de transferir la propiedad a un admin; el ex-owner queda como admin.
  - Solo se puede borrar una organización cuando el owner es su único miembro. Al borrarla se revocan sus invitaciones pendientes.
  - Cada bloqueo explica en la interfaz qué paso falta.
- **Interfaz de miembros**: una pestaña "Miembros" en `/organization-settings/[orgId]` con la lista de miembros, el cambio de rol, quitar miembros, las invitaciones pendientes y una zona de peligro (transferir, borrar, salir).
- **Mailpit** en `docker-compose.yml` para probar los correos en local.

**Fuera de alcance**: más de un owner por organización, invitar a varios emails a la vez, roles personalizados, verificación de email en el registro y elección del servidor SMTP de producción (se configura con variables de entorno al desplegar).

## Capabilities

### New Capabilities
- `org-access-control`: roles de organización, matriz de permisos y cómo cada operación sobre datos de una organización determina la organización y valida el rol de quien la ejecuta.
- `org-membership`: gestión de miembros (listar, cambiar rol, quitar, salir), transferencia de propiedad, garantía de un solo owner y reglas para borrar la organización.
- `org-invitations`: ciclo de vida de una invitación (crear, enviar correo, copiar link, reenviar, revocar, expirar), pantalla de aceptación o rechazo y flujo de registro o login del invitado.

### Modified Capabilities
<!-- No hay specs existentes en openspec/specs/. -->

## Impact

- **Modelos** (`apps/web/lib/models/`): se cambia el enum de `Membership.role` y se agrega un índice único parcial para garantizar un solo owner por organización. Nuevo modelo `Invitation`.
- **Autorización** (`apps/web/lib/auth/`): nuevo módulo de permisos y helper de acceso. `lib/geo/server/access.ts` (`resolveGeoContext`) pasa a recibir el permiso requerido.
- **Rutas API**:
  - Cambian: `crawl`, `crawl/[jobId]`, `sites`, `sites/[siteId]/**`, `site-settings/[siteId]`, `pages/[pageId]`, `suggestions/**` y `organizations/[orgId]` (`PATCH`/`DELETE`).
  - Nuevas: `organizations/[orgId]/members`, `organizations/[orgId]/invitations`, `organizations/[orgId]/transfer`, `organizations/[orgId]/leave` e `invitations/[token]`.
- **Auth** (`lib/auth/auth.ts`, `app/api/register/route.ts`): no se crea la organización personal si hay una invitación pendiente. Se corrige la creación de la organización en el alta con Google, que hoy omite `slug` y `createdByUserId`. Se deja de usar `memberships[0]` como organización activa.
- **Páginas y componentes**: `app/organization-settings/[orgId]`, `DeleteOrganizationDialog`, la nueva `app/invite/[token]`, `LoginForm` y `RegisterForm` (soporte de `callbackUrl` y del email bloqueado), y ocultar en dashboard y sitios las acciones que el rol no permite.
- **Dependencias**: `nodemailer` y `@types/nodemailer`. Variables de entorno nuevas: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE` y `MAIL_FROM`. Los links de invitación se arman con el `AUTH_URL` existente.
- **Infraestructura local**: servicio Mailpit en `seoaudit/docker-compose.yml`.
