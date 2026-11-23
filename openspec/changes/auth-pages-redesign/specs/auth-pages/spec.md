# Spec Delta

## Purpose

Define cómo se presentan las páginas públicas de inicio de sesión y registro de SEOAudit: su estructura, los textos en el idioma activo y los mensajes que ve el usuario al completar los formularios.

## ADDED Requirements

### Requirement: Estructura en pantalla dividida
`/login` y `/register` SHALL mostrar, desde 1024 px de ancho, un panel de marca con el titular de la aplicación y al menos tres beneficios junto a una tarjeta con el formulario. Por debajo de 1024 px MUST mostrarse solo la tarjeta del formulario, sin desplazamiento horizontal desde 320 px.

#### Scenario: Escritorio
- **WHEN** un visitante abre `/login` con 1280 px de ancho
- **THEN** ve el panel de marca y, a su lado, la tarjeta con el formulario de inicio de sesión

#### Scenario: Móvil
- **WHEN** un visitante abre `/register` con 360 px de ancho
- **THEN** ve solo la tarjeta del formulario de registro, sin el panel de marca ni barra de desplazamiento horizontal

### Requirement: Apariencia coherente con el tema
Las páginas de inicio de sesión y registro SHALL usar los colores semánticos del tema daisyUI activo, sin colores fijos fuera del tema, y MUST seguir siendo legibles al cambiar al tema oscuro.

#### Scenario: Tema oscuro
- **WHEN** se cambia el tema de la aplicación a `dark`
- **THEN** el fondo, la tarjeta, los campos, los botones y los enlaces de ambas páginas adoptan los colores del tema

### Requirement: Contenido de la tarjeta de inicio de sesión
La tarjeta de `/login` SHALL mostrar, en este orden: título, subtítulo, campo de correo, campo de contraseña, botón para ingresar, un separador "o", el botón "Continuar con Google" y un enlace a `/register`.

#### Scenario: Elementos visibles
- **WHEN** un visitante abre `/login`
- **THEN** ve todos los elementos de la tarjeta en el orden definido

### Requirement: Contenido de la tarjeta de registro
La tarjeta de `/register` SHALL mostrar, en este orden: título, subtítulo, campos de nombre, correo, organización (marcado como opcional), contraseña y confirmación de contraseña, botón para crear la cuenta, un separador "o", el botón "Continuar con Google" y un enlace a `/login`.

#### Scenario: Elementos visibles
- **WHEN** un visitante abre `/register`
- **THEN** ve todos los elementos de la tarjeta en el orden definido
- **AND** la confirmación de contraseña se rotula "Confirmar contraseña" (en inglés, "Confirm password")

### Requirement: Textos en el idioma activo
Todos los textos visibles de ambas páginas, incluidos títulos, etiquetas, marcas de campo opcional, placeholders, textos del panel de marca y el título de la pestaña del navegador, SHALL mostrarse en el idioma activo de la aplicación (español o inglés).

#### Scenario: Idioma inglés
- **WHEN** un visitante con el idioma activo en inglés abre `/register`
- **THEN** todos los textos de la página y el título de la pestaña están en inglés

#### Scenario: Idioma español
- **WHEN** un visitante con el idioma activo en español abre `/login`
- **THEN** todos los textos de la página y el título de la pestaña están en español

### Requirement: Validación propia de la aplicación
Los formularios de inicio de sesión y registro SHALL validarse con reglas y mensajes de la aplicación, en el idioma activo. MUST NOT mostrarse los avisos nativos de validación del navegador ni toasts para estos errores, de modo que la apariencia sea la misma en cualquier navegador.

#### Scenario: Enviar vacío
- **WHEN** el visitante pulsa "Ingresar" en `/login` con los campos vacíos
- **THEN** no aparece ningún aviso nativo del navegador y ve, debajo de cada campo, el mensaje "Este campo es requerido" con el estilo de la aplicación

#### Scenario: Mismo aspecto en cualquier navegador
- **WHEN** se envía el formulario de registro con errores en Chrome, Firefox y Safari
- **THEN** los mensajes de error tienen el mismo texto, posición y estilo en los tres

### Requirement: Reglas de validación
Los formularios SHALL aplicar estas reglas antes de enviar nada al servidor: en el inicio de sesión, correo y contraseña obligatorios y correo con formato válido; en el registro, nombre, correo, contraseña y confirmación obligatorios, correo con formato válido, contraseña de al menos 6 caracteres y confirmación igual a la contraseña. La organización MUST seguir siendo opcional.

#### Scenario: Correo con formato inválido
- **WHEN** el visitante envía el registro con el correo `ana@`
- **THEN** ve "Correo electrónico inválido" debajo del campo de correo y no se envía la solicitud de registro

#### Scenario: Contraseña demasiado corta
- **WHEN** el visitante envía el registro con una contraseña de 4 caracteres
- **THEN** ve debajo del campo que la contraseña debe tener al menos 6 caracteres y no se envía la solicitud de registro

#### Scenario: Contraseñas distintas
- **WHEN** el visitante envía el registro con contraseña y confirmación diferentes
- **THEN** ve "Las contraseñas no coinciden" (en inglés, "Passwords do not match") debajo de la confirmación y no se envía la solicitud de registro

#### Scenario: Organización vacía
- **WHEN** el visitante envía el registro con todos los campos válidos y la organización vacía
- **THEN** no se muestra ningún error en la organización y se envía la solicitud de registro

### Requirement: Presentación de los errores de campo
Cada error de campo SHALL mostrarse debajo de su campo, con el campo resaltado como inválido y asociado a su mensaje para lectores de pantalla. Al enviar con errores, el foco MUST pasar al primer campo inválido. Tras el primer intento de envío, los mensajes SHALL actualizarse mientras el usuario corrige, y desaparecer cuando el valor es válido.

#### Scenario: Foco en el primer error
- **WHEN** el visitante envía el registro con el nombre válido y el correo vacío
- **THEN** el foco pasa al campo de correo

#### Scenario: Corrección en vivo
- **WHEN** tras un envío fallido el visitante escribe un correo válido
- **THEN** el mensaje de error del correo desaparece sin volver a enviar

#### Scenario: Sin errores antes de intentar
- **WHEN** el visitante empieza a escribir en un formulario que aún no ha enviado
- **THEN** no se muestra ningún mensaje de error

### Requirement: Errores del envío dentro del formulario
Los errores que devuelve el servidor SHALL mostrarse dentro de la tarjeta del formulario y en el idioma activo: las credenciales inválidas en un aviso encima de los campos, el correo ya registrado debajo del campo de correo y cualquier otro fallo en un aviso genérico de error.

#### Scenario: Correo ya registrado
- **WHEN** el visitante se registra con un correo que ya tiene cuenta
- **THEN** ve debajo del campo de correo el mensaje "Este usuario ya existe" (en inglés, "This user already exists")

#### Scenario: Error del servidor
- **WHEN** el servidor responde con un error inesperado al registrarse
- **THEN** ve dentro de la tarjeta un aviso de error genérico traducido y puede volver a intentarlo

### Requirement: Ayudas de autocompletado
Los campos SHALL declarar su propósito para el autocompletado del navegador y los gestores de contraseñas: nombre, correo, organización, contraseña actual en el inicio de sesión y contraseña nueva en el registro.

#### Scenario: Gestor de contraseñas
- **WHEN** un gestor de contraseñas analiza el formulario de registro
- **THEN** identifica los campos de contraseña como contraseña nueva y el de correo como correo electrónico

### Requirement: Flujo de acceso sin cambios
El rediseño MUST NOT cambiar el comportamiento del acceso: tras iniciar sesión o registrarse correctamente, el usuario SHALL llegar a `/organizations`, y las credenciales inválidas SHALL seguir mostrando el mensaje de credenciales inválidas.

#### Scenario: Inicio de sesión correcto
- **WHEN** un usuario registrado ingresa correo y contraseña válidos en `/login`
- **THEN** llega a `/organizations`

#### Scenario: Credenciales inválidas
- **WHEN** un usuario ingresa una contraseña incorrecta en `/login`
- **THEN** ve dentro de la tarjeta el aviso de credenciales inválidas y permanece en `/login`

#### Scenario: Registro correcto
- **WHEN** un visitante completa el registro con datos válidos
- **THEN** se crea la cuenta, se inicia su sesión y llega a `/organizations`
