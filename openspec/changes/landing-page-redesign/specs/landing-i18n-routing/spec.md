# Spec Delta

## Purpose

Ofrece la landing en español e inglés con una URL propia por idioma, para que cada público llegue y comparta la versión en su idioma y el resto de la aplicación continúe en ese idioma.

## ADDED Requirements

### Requirement: Una URL por idioma
La landing SHALL estar disponible en `/` en español y en `/en` en inglés, ambas públicas y sin requerir sesión.

#### Scenario: Versión en español
- **WHEN** un visitante sin sesión abre `/`
- **THEN** recibe la landing en español con estado 200

#### Scenario: Versión en inglés
- **WHEN** un visitante sin sesión abre `/en`
- **THEN** recibe la landing en inglés con estado 200, sin redirección a `/login`

### Requirement: La URL decide el idioma de la landing
En `/` y `/en` el idioma de toda la página, incluidos la cabecera global y el atributo `lang` del documento, SHALL ser el de la URL, por encima de la cookie de idioma y del idioma del navegador.

#### Scenario: Cookie en español visitando /en
- **WHEN** un visitante con la cookie de idioma en `es` abre `/en`
- **THEN** el documento tiene `lang="en"` y tanto la cabecera como el contenido están en inglés

#### Scenario: Navegador en inglés visitando /
- **WHEN** un visitante sin cookie y con `Accept-Language: en-US` abre `/`
- **THEN** el documento tiene `lang="es"` y la página está en español

#### Scenario: Resto de la aplicación sin cambios
- **WHEN** un usuario abre una ruta distinta de `/` y `/en`
- **THEN** el idioma se resuelve como antes: cookie, luego `Accept-Language` y por último español

### Requirement: Sincronización de la cookie de idioma
Al visitar `/` o `/en`, la respuesta SHALL guardar en la cookie de idioma el idioma de esa URL, de modo que las páginas siguientes de la aplicación se muestren en ese idioma.

#### Scenario: Registro tras llegar por /en
- **WHEN** un visitante abre `/en` y después navega a `/register`
- **THEN** el formulario de registro se muestra en inglés

#### Scenario: Visita a /
- **WHEN** un visitante con la cookie de idioma en `en` abre `/`
- **THEN** la cookie de idioma pasa a `es`

### Requirement: Sin redirección automática por idioma
La aplicación MUST NOT redirigir entre `/` y `/en` por la cookie o por el idioma del navegador.

#### Scenario: Navegador en inglés
- **WHEN** un visitante con `Accept-Language: en` abre `/`
- **THEN** recibe la respuesta de `/` sin redirección

### Requirement: Selector de idioma en la landing
En `/` y `/en` la cabecera SHALL mostrar un selector ES/EN formado por enlaces normales a `/` y `/en`, que indica el idioma actual. Fuera de la landing el selector no se muestra.

#### Scenario: Cambiar a inglés
- **WHEN** el visitante en `/` pulsa "EN"
- **THEN** navega a `/en` y ve la landing en inglés

#### Scenario: Idioma actual marcado
- **WHEN** el visitante está en `/en`
- **THEN** la opción "EN" aparece como activa

#### Scenario: Selector fuera de la landing
- **WHEN** un usuario abre `/dashboard`
- **THEN** la cabecera no muestra el selector ES/EN

### Requirement: Aviso de versión en otro idioma
La landing SHALL mostrar un aviso con un enlace a la otra versión cuando el idioma preferido del navegador es el otro idioma soportado. Cuando el navegador prefiere el idioma de la página o uno no soportado, el aviso MUST NOT mostrarse.

#### Scenario: Navegador en inglés en /
- **WHEN** un visitante con `Accept-Language: en-US,en` abre `/`
- **THEN** ve un aviso en inglés con un enlace a `/en`

#### Scenario: Navegador en español en /en
- **WHEN** un visitante con `Accept-Language: es-MX,es` abre `/en`
- **THEN** ve un aviso en español con un enlace a `/`

#### Scenario: Idioma coincidente
- **WHEN** un visitante con `Accept-Language: es` abre `/`
- **THEN** no se muestra el aviso

#### Scenario: Idioma no soportado
- **WHEN** un visitante con `Accept-Language: fr-FR` abre `/`
- **THEN** no se muestra el aviso
