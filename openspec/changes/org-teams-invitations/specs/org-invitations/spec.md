# Spec Delta

## Purpose

Permite sumar personas a una organización mediante invitaciones por email con un link de un solo uso. Cubre la creación, el envío, el reenvío, la revocación y la expiración, la pantalla donde el invitado acepta o rechaza, y el registro o login del invitado.

## ADDED Requirements

### Requirement: Crear una invitación
`owner` y `admin` SHALL poder invitar un email con rol `admin`, `editor` o `viewer`. La invitación queda pendiente, vence a los 7 días y registra quién invitó. El sistema MUST rechazar el rol `owner`, los emails que ya son miembros y los que ya tienen una invitación pendiente en esa organización.

#### Scenario: Invitación válida
- **WHEN** un `admin` invita a `ana@ejemplo.com` como `editor`
- **THEN** se crea una invitación pendiente que vence en 7 días y se envía el correo

#### Scenario: Email que ya es miembro
- **WHEN** se invita a un email que ya es miembro de la organización
- **THEN** el sistema responde 409 y no crea la invitación

#### Scenario: Invitación duplicada
- **WHEN** se invita a un email que ya tiene una invitación pendiente en la organización
- **THEN** el sistema responde 409 y sugiere reenviar la existente

### Requirement: Comparación de emails sin distinguir mayúsculas
Los emails de las invitaciones SHALL normalizarse a minúsculas y sin espacios al guardarse y al compararse con la cuenta del invitado.

#### Scenario: Mayúsculas distintas
- **WHEN** se invita a `Ana@Ejemplo.com` y la cuenta de la invitada es `ana@ejemplo.com`
- **THEN** la invitación se reconoce como dirigida a esa cuenta

### Requirement: Token secreto de un solo uso
Cada invitación SHALL tener un token aleatorio con al menos 256 bits de entropía. El sistema MUST guardar solo un hash del token, nunca el token en claro. El token SHALL dejar de servir en cuanto la invitación se acepta, se rechaza, se revoca o vence.

#### Scenario: Token reutilizado
- **WHEN** alguien abre el link de una invitación ya aceptada
- **THEN** la pantalla indica que la invitación ya no es válida y no ofrece aceptarla

#### Scenario: Token inexistente
- **WHEN** alguien abre `/invite/<token>` con un token que no corresponde a ninguna invitación
- **THEN** la pantalla indica que la invitación no es válida, sin revelar ninguna organización

### Requirement: Correo de invitación
Al crear o reenviar una invitación, el sistema SHALL enviar un correo al email invitado con el nombre de quien invita, el nombre de la organización, el rol, la fecha de vencimiento y el link de aceptación. Si el envío falla, la invitación MUST seguir creada y quedar marcada como "correo no enviado".

#### Scenario: Falla el SMTP
- **WHEN** se crea una invitación y el servidor SMTP rechaza el envío
- **THEN** la invitación queda pendiente, se marca como "correo no enviado" y la interfaz ofrece copiar el link o reintentar

### Requirement: Copiar el link de invitación
Al crear o reenviar una invitación, `owner` y `admin` SHALL recibir el link de aceptación para compartirlo por otro canal. Como el token no se guarda en claro, el link SHALL mostrarse solo en ese momento.

#### Scenario: Copiar tras crear
- **WHEN** un `admin` crea una invitación
- **THEN** la interfaz muestra el link con una opción para copiarlo

### Requirement: Reenviar una invitación
`owner` y `admin` SHALL poder reenviar una invitación pendiente o vencida. Reenviar genera un token nuevo, invalida el anterior, reinicia el vencimiento a 7 días y envía el correo otra vez.

#### Scenario: Reenviar una invitación vencida
- **WHEN** un `admin` reenvía una invitación vencida
- **THEN** la invitación vuelve a quedar pendiente con un nuevo vencimiento a 7 días, y el link anterior deja de funcionar

### Requirement: Revocar una invitación
`owner` y `admin` SHALL poder revocar una invitación pendiente. Una invitación revocada MUST NOT poder aceptarse.

#### Scenario: Abrir un link revocado
- **WHEN** el invitado abre el link de una invitación revocada
- **THEN** la pantalla indica que la invitación ya no es válida

### Requirement: Listar invitaciones pendientes
`owner` y `admin` SHALL ver las invitaciones pendientes y vencidas de la organización, con email, rol, quién invitó, vencimiento y estado del correo. Los demás roles MUST NOT verlas.

#### Scenario: Editor abre la pestaña Miembros
- **WHEN** un `editor` abre la pestaña Miembros
- **THEN** no ve la sección de invitaciones

### Requirement: Pantalla de aceptación
Al abrir un link válido con sesión iniciada en la cuenta invitada, la pantalla SHALL mostrar "[nombre de quien invita] te ha invitado a [nombre de la organización]. ¿Deseas aceptar?", junto con el rol ofrecido y los botones Aceptar y Rechazar.

#### Scenario: Aceptar
- **WHEN** la invitada pulsa Aceptar
- **THEN** se crea su membresía con el rol de la invitación, la invitación queda aceptada, la organización pasa a ser la activa y se la lleva al dashboard de esa organización

#### Scenario: Rechazar
- **WHEN** la invitada pulsa Rechazar
- **THEN** la invitación queda rechazada, no se crea ninguna membresía y el link deja de funcionar

#### Scenario: Ya es miembro al aceptar
- **WHEN** la invitada ya se había vuelto miembro de la organización por otra vía y pulsa Aceptar
- **THEN** la invitación queda aceptada, su rol actual no cambia y se la lleva al dashboard

### Requirement: Invitado sin sesión
Al abrir un link válido sin sesión, la pantalla SHALL mostrar quién invita y a qué organización, y ofrecer iniciar sesión o crear una cuenta con el email invitado ya escrito y bloqueado. Después de autenticarse, el invitado SHALL volver a la pantalla de aceptación.

#### Scenario: Invitado nuevo se registra
- **WHEN** un invitado sin cuenta abre el link, crea su cuenta con el email invitado y termina el registro
- **THEN** vuelve a `/invite/<token>` y ve la pregunta de aceptación

#### Scenario: Registro con Google
- **WHEN** un invitado sin cuenta abre el link y se registra con Google usando el email invitado
- **THEN** vuelve a `/invite/<token>` y ve la pregunta de aceptación

### Requirement: Sin organización personal para invitados
Cuando alguien crea una cuenta, con credenciales o con Google, y su email tiene una invitación pendiente, el sistema MUST NOT crearle una organización personal automáticamente.

#### Scenario: Alta con Google con invitación pendiente
- **WHEN** un usuario nuevo se registra con Google y su email tiene una invitación pendiente
- **THEN** la cuenta se crea sin organización propia

#### Scenario: Alta con Google sin invitación
- **WHEN** un usuario nuevo se registra con Google y su email no tiene invitaciones pendientes
- **THEN** la cuenta se crea con una organización propia de la que es `owner`

### Requirement: Sesión con otra cuenta
Si quien abre un link válido tiene sesión iniciada con un email distinto al invitado, la pantalla SHALL indicar a qué email va dirigida la invitación y ofrecer cerrar sesión para entrar con la cuenta correcta. El sistema MUST rechazar la aceptación desde una cuenta cuyo email no coincide.

#### Scenario: Email distinto
- **WHEN** un usuario con sesión `luis@ejemplo.com` abre una invitación para `ana@ejemplo.com`
- **THEN** ve "Esta invitación es para ana@ejemplo.com" con la opción de cerrar sesión, sin botón de aceptar

#### Scenario: Aceptación forzada desde otra cuenta
- **WHEN** se envía una solicitud de aceptación desde una sesión con un email que no coincide con el invitado
- **THEN** el sistema responde 403 y no crea ninguna membresía

### Requirement: Vencimiento
Una invitación pendiente SHALL tratarse como vencida cuando pasa su fecha de vencimiento, y MUST NOT poder aceptarse.

#### Scenario: Abrir un link vencido
- **WHEN** el invitado abre el link 8 días después de creada la invitación
- **THEN** la pantalla indica que la invitación venció y que pida un nuevo envío a quien lo invitó
