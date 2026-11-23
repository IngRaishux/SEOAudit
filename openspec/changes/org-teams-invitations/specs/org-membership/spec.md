# Spec Delta

## Purpose

Gestiona quién pertenece a una organización y con qué rol: listar, cambiar rol, quitar y salir, además de la transferencia de propiedad y las reglas que impiden que una organización quede sin owner o se borre con miembros adentro.

## ADDED Requirements

### Requirement: Un solo owner por organización
Cada organización SHALL tener exactamente una membresía con rol `owner` en todo momento. El sistema MUST rechazar cualquier operación que deje una organización con cero o con más de un owner.

#### Scenario: Intento de crear un segundo owner
- **WHEN** se intenta asignar el rol `owner` a un segundo miembro sin una transferencia
- **THEN** el sistema rechaza la operación y la organización conserva un solo owner

#### Scenario: Crear una organización
- **WHEN** un usuario crea una organización
- **THEN** queda como su único `owner`

### Requirement: Listar miembros
Cualquier miembro SHALL poder ver la lista de miembros de su organización, con nombre, email y rol de cada uno.

#### Scenario: Viewer ve la lista
- **WHEN** un `viewer` abre la pestaña Miembros
- **THEN** ve a todos los miembros con su rol, sin acciones de gestión

### Requirement: Cambiar el rol de un miembro
`owner` y `admin` SHALL poder cambiar el rol de un miembro a `admin`, `editor` o `viewer`. Nadie MUST poder asignar `owner` con esta operación, ni cambiar el rol del owner. Un usuario MUST NOT poder cambiar su propio rol.

#### Scenario: Admin asciende a un editor
- **WHEN** un `admin` cambia a un `editor` al rol `admin`
- **THEN** el miembro queda como `admin`

#### Scenario: Admin intenta cambiar al owner
- **WHEN** un `admin` intenta cambiar el rol del `owner`
- **THEN** el sistema responde 403 y el owner conserva su rol

#### Scenario: Intento de asignar owner
- **WHEN** el `owner` intenta asignar el rol `owner` a otro miembro mediante el cambio de rol
- **THEN** el sistema responde 400 e indica que debe usar la transferencia de propiedad

### Requirement: Quitar a un miembro
`owner` y `admin` SHALL poder quitar a cualquier miembro excepto al owner. Al quitarlo se elimina su membresía y pierde el acceso a la organización de inmediato.

#### Scenario: Admin quita a un viewer
- **WHEN** un `admin` quita a un `viewer`
- **THEN** la membresía se elimina y el usuario ya no puede ver la organización

#### Scenario: Admin intenta quitar al owner
- **WHEN** un `admin` intenta quitar al `owner`
- **THEN** el sistema responde 403

### Requirement: Salir de la organización
Cualquier miembro que no sea owner SHALL poder salir de la organización por su cuenta. El owner MUST NOT poder salir mientras sea owner. La interfaz SHALL indicarle que primero transfiera la propiedad o, si es el único miembro, que borre la organización.

#### Scenario: Editor sale
- **WHEN** un `editor` elige salir de la organización
- **THEN** su membresía se elimina y vuelve a la selección de organizaciones

#### Scenario: Owner intenta salir
- **WHEN** el `owner` intenta salir de la organización
- **THEN** el sistema responde 409 indicando que primero debe transferir la propiedad

### Requirement: Transferir la propiedad
Solo el owner SHALL poder transferir la propiedad, y solo a un miembro con rol `admin`. La transferencia MUST ser atómica: el admin elegido pasa a `owner` y el owner anterior pasa a `admin`. La interfaz SHALL pedir que se escriba el nombre de la organización para confirmar.

#### Scenario: Transferencia exitosa
- **WHEN** el `owner` transfiere la propiedad a un `admin` y confirma con el nombre de la organización
- **THEN** ese admin queda como `owner`, el owner anterior como `admin`, y la organización sigue con un solo owner

#### Scenario: Transferir a un editor
- **WHEN** el `owner` intenta transferir la propiedad a un `editor`
- **THEN** el sistema responde 400 indicando que primero debe ascenderlo a admin

#### Scenario: Sin admins disponibles
- **WHEN** el `owner` abre la opción de transferir y la organización no tiene ningún `admin`
- **THEN** la interfaz explica que debe ascender a alguien a admin antes de transferir

### Requirement: Borrar la organización solo sin otros miembros
Solo el owner SHALL poder borrar la organización, y solo cuando él es su único miembro. Si hay otro miembro, cualquiera sea su rol, el sistema MUST rechazar el borrado. Las invitaciones pendientes no impiden borrarla y se revocan al hacerlo.

#### Scenario: Borrado con miembros
- **WHEN** el `owner` intenta borrar una organización que tiene un `viewer`
- **THEN** el sistema responde 409 indicando que primero debe quitar a los miembros, y la organización se conserva

#### Scenario: Borrado con solo invitaciones pendientes
- **WHEN** el `owner` es el único miembro, hay una invitación pendiente y borra la organización
- **THEN** la organización se borra y la invitación queda revocada

### Requirement: Acceso tras perder la membresía
Cuando un usuario deja de ser miembro (lo quitan, sale o se borra la organización), sus solicitudes siguientes a esa organización MUST rechazarse aunque su sesión siga activa. La organización tampoco SHALL seguir apareciendo en su lista.

#### Scenario: Miembro quitado con sesión abierta
- **WHEN** un usuario quitado de la organización hace una solicitud a uno de sus sitios con su sesión activa
- **THEN** el sistema responde 403
