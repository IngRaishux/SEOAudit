# Spec Delta

## Purpose

Define los roles que un usuario puede tener dentro de una organización y garantiza que cada operación sobre datos de una organización se autorice según el rol del usuario en esa organización concreta.

## ADDED Requirements

### Requirement: Roles de organización
Cada membresía SHALL tener exactamente uno de estos roles: `owner`, `admin`, `editor` o `viewer`. El sistema MUST rechazar cualquier otro valor, incluido `member`.

#### Scenario: Rol válido
- **WHEN** se crea o actualiza una membresía con rol `editor`
- **THEN** la membresía se guarda con ese rol

#### Scenario: Rol inválido
- **WHEN** se intenta guardar una membresía con rol `member`
- **THEN** el sistema rechaza la operación con un error de validación

### Requirement: Permisos de lectura y crawl
Cualquier miembro de una organización, con cualquier rol, SHALL poder ver los sitios, páginas, reportes y sugerencias de esa organización, y lanzar crawls y consultar su estado.

#### Scenario: Viewer lanza un crawl
- **WHEN** un usuario con rol `viewer` lanza un crawl en su organización
- **THEN** el crawl se crea y se asocia a esa organización

#### Scenario: Viewer consulta un sitio
- **WHEN** un usuario con rol `viewer` abre un sitio de su organización
- **THEN** el sistema muestra el sitio y sus páginas

### Requirement: Permisos de edición de contenido
Solo `owner`, `admin` y `editor` SHALL poder generar sugerencias con IA, editar o aplicar sugerencias, y modificar site settings, el perfil de negocio, el JSON-LD y el llms.txt de un sitio.

#### Scenario: Editor genera sugerencias
- **WHEN** un `editor` solicita generar sugerencias con IA para un sitio de su organización
- **THEN** la generación se ejecuta

#### Scenario: Viewer intenta generar sugerencias
- **WHEN** un `viewer` solicita generar sugerencias con IA o editar el perfil de negocio
- **THEN** el sistema responde 403 y no modifica nada

### Requirement: Permiso para borrar sitios
Solo `owner` y `admin` SHALL poder borrar un sitio.

#### Scenario: Admin borra un sitio
- **WHEN** un `admin` borra un sitio de su organización
- **THEN** el sitio se elimina

#### Scenario: Editor intenta borrar un sitio
- **WHEN** un `editor` intenta borrar un sitio
- **THEN** el sistema responde 403 y el sitio se conserva

### Requirement: Permisos de administración de la organización
Solo el `owner` SHALL poder renombrar o borrar la organización y transferir la propiedad. `owner` y `admin` SHALL poder gestionar miembros e invitaciones, dentro de los límites que define la capacidad `org-membership`.

#### Scenario: Admin intenta renombrar la organización
- **WHEN** un `admin` intenta cambiar el nombre de la organización
- **THEN** el sistema responde 403 y el nombre no cambia

#### Scenario: Editor intenta invitar
- **WHEN** un `editor` intenta crear una invitación
- **THEN** el sistema responde 403

### Requirement: Organización determinada por el recurso
Cada operación sobre un recurso (sitio, página, sugerencia, job de crawl o de generación) SHALL autorizarse contra la organización a la que pertenece ese recurso. Las operaciones sin recurso previo SHALL recibir la organización de forma explícita. El sistema MUST NOT usar como sustituto una membresía cualquiera del usuario.

#### Scenario: Usuario con varias organizaciones
- **WHEN** un usuario es `owner` de la organización A y `viewer` de la B, e intenta borrar un sitio de B
- **THEN** el sistema evalúa su rol en B, responde 403 y no borra el sitio

#### Scenario: Crawl sin organización explícita
- **WHEN** se solicita un crawl sin indicar la organización
- **THEN** el sistema responde 400 y no crea el crawl

### Requirement: Acceso denegado a no miembros
Toda operación sobre datos de una organización MUST exigir sesión y membresía en esa organización. Sin sesión, el sistema SHALL responder 401. Con sesión pero sin membresía, SHALL responder 403. Si el recurso no existe, SHALL responder 404.

#### Scenario: Página consultada sin sesión
- **WHEN** se consulta una página por su id sin sesión iniciada
- **THEN** el sistema responde 401 y no devuelve datos

#### Scenario: Usuario ajeno consulta un sitio
- **WHEN** un usuario con sesión pide un sitio de una organización a la que no pertenece
- **THEN** el sistema responde 403

### Requirement: Interfaz acorde al rol
La interfaz SHALL ocultar o deshabilitar las acciones que el rol del usuario no permite en la organización activa. El servidor SHALL aplicar los permisos aunque la interfaz no lo haga.

#### Scenario: Viewer en el detalle de un sitio
- **WHEN** un `viewer` abre el detalle de un sitio
- **THEN** no ve los botones de generar sugerencias, editar el perfil ni borrar el sitio, pero sí el de lanzar un nuevo crawl
