# Spec Delta

## Purpose

Define cómo se llama y cómo se muestra la marca SEObab en la aplicación web, para que el nombre sea el mismo en la interfaz, los textos traducidos, los títulos y los correos.

## ADDED Requirements

### Requirement: Nombre canónico de la marca
La aplicación web SHALL mostrar el nombre del producto como "SEObab": "SEO" en mayúsculas y "bab" en minúsculas, sin espacio. Ningún texto visible para el usuario, título de pestaña ni correo de la aplicación web MUST contener "SEO Audit" ni "SEOAudit".

#### Scenario: Recorrido por las páginas públicas
- **WHEN** un visitante abre `/`, `/en`, `/login` y `/register`
- **THEN** todas las menciones del producto dicen "SEObab"
- **AND** ninguna dice "SEO Audit" ni "SEOAudit"

#### Scenario: Textos en inglés
- **WHEN** un visitante abre `/en`
- **THEN** los textos que mencionan el producto (subtítulos, herramientas gratuitas, FAQ) usan "SEObab" sin traducir el nombre

### Requirement: Logo en cabecera y pie
La cabecera, tanto con sesión como sin sesión, y el pie de la landing SHALL mostrar el mismo logo: un icono seguido del texto "SEObab". El enlace del logo en la cabecera MUST tener "SEObab" como nombre accesible, también cuando el texto está oculto en pantallas pequeñas.

#### Scenario: Cabecera sin sesión
- **WHEN** un visitante sin sesión abre cualquier página
- **THEN** la cabecera muestra el logo con el texto "SEObab", que enlaza a la landing del idioma actual

#### Scenario: Cabecera con sesión
- **WHEN** un usuario con sesión abre cualquier página
- **THEN** la cabecera muestra el mismo logo, que enlaza a `/organizations`

#### Scenario: Pantalla estrecha
- **WHEN** la cabecera se muestra por debajo del punto de corte `sm`
- **THEN** solo se ve el icono, y el enlace se anuncia como "SEObab" a los lectores de pantalla

#### Scenario: Pie de la landing
- **WHEN** un visitante llega al pie de `/` o `/en`
- **THEN** ve el mismo icono y el texto "SEObab" que en la cabecera

### Requirement: Marca en los correos de invitación
El asunto y el cuerpo del correo de invitación a una organización SHALL nombrar el producto como "SEObab" en el idioma del correo. Cuando el invitador no tiene nombre ni correo, el correo MUST usar "SEObab" como nombre del invitador.

#### Scenario: Invitación en español
- **WHEN** Hiram invita a alguien a la organización "Hoteles Brisas" con el idioma español
- **THEN** el asunto es "Hiram te ha invitado a Hoteles Brisas en SEObab"

#### Scenario: Invitación en inglés
- **WHEN** Hiram invita a alguien a "Hoteles Brisas" con el idioma inglés
- **THEN** el asunto es "Hiram has invited you to Hoteles Brisas on SEObab"

#### Scenario: Remitente por defecto
- **WHEN** se envía un correo y `MAIL_FROM` no está configurada
- **THEN** el nombre visible del remitente es "SEObab"
