# Spec Delta

## Purpose

Define los metadatos públicos que la aplicación web entrega a buscadores y redes sociales: URL base, títulos, nombre del sitio y relación entre las versiones en español e inglés de la landing.

## ADDED Requirements

### Requirement: URL base absoluta del sitio
Los metadatos que contienen URLs (canónica, alternativas `hreflang` y Open Graph) SHALL ser absolutos y construirse sobre la URL base del sitio. La URL base MUST poder configurarse por entorno y, si no se configura, MUST ser `https://seobab.com`.

#### Scenario: Producción sin configuración
- **WHEN** la aplicación se construye sin una URL base configurada
- **THEN** la canónica de `/en` es `https://seobab.com/en`

#### Scenario: Entorno con URL propia
- **WHEN** la aplicación se construye con la URL base `https://preview.ejemplo.dev`
- **THEN** la canónica de `/en` es `https://preview.ejemplo.dev/en`

### Requirement: Plantilla de título
El título de cada página que define su propio título SHALL tener la forma `<título de la página> · SEObab`. Una página sin título propio MUST mostrar "SEObab".

#### Scenario: Página de inicio de sesión
- **WHEN** un visitante abre `/login` en español
- **THEN** el título de la pestaña es el título de inicio de sesión en español seguido de " · SEObab"
- **AND** "SEObab" aparece una sola vez

#### Scenario: Página de invitación
- **WHEN** alguien abre un enlace de invitación válido
- **THEN** el título de la pestaña termina en " · SEObab" y la página sigue sin indexarse

#### Scenario: Página sin título propio
- **WHEN** se abre una página que no define título
- **THEN** el título de la pestaña es "SEObab"

### Requirement: Nombre del sitio en Open Graph
Todas las páginas SHALL declarar `og:site_name` con el valor "SEObab".

#### Scenario: Compartir un enlace
- **WHEN** un servicio lee los metadatos de `/` o de `/en`
- **THEN** encuentra `og:site_name` con el valor "SEObab"

### Requirement: Metadatos de la landing por idioma
Cada landing SHALL declarar título, descripción, `og:title`, `og:description` y `og:locale` en su idioma: español en `/` e inglés en `/en`. El título MUST incluir "SEObab".

#### Scenario: Landing en español
- **WHEN** un buscador lee `/`
- **THEN** el título y la descripción están en español, incluyen "SEObab" y `og:locale` es español

#### Scenario: Landing en inglés
- **WHEN** un buscador lee `/en`
- **THEN** el título y la descripción están en inglés, incluyen "SEObab" y `og:locale` es inglés

### Requirement: Canónica y alternativas hreflang de la landing
Cada landing SHALL declarar como canónica su propia URL absoluta y las mismas alternativas `hreflang`: `es` hacia `/`, `en` hacia `/en` y `x-default` hacia `/`.

#### Scenario: Alternativas desde la landing en español
- **WHEN** un buscador lee `/`
- **THEN** la canónica es `https://seobab.com/`
- **AND** hay alternativas `es` → `https://seobab.com/`, `en` → `https://seobab.com/en` y `x-default` → `https://seobab.com/`

#### Scenario: Alternativas recíprocas desde la landing en inglés
- **WHEN** un buscador lee `/en`
- **THEN** la canónica es `https://seobab.com/en`
- **AND** declara las mismas tres alternativas que `/`, de modo que la relación es recíproca
