# Spec Delta

## Purpose

Revisa si un sitio publica un llms.txt válido en la raíz de su dominio y, cuando falta o es inválido, genera uno a partir del perfil de negocio y de las páginas crawleadas.

## ADDED Requirements

### Requirement: Estado de llms.txt del sitio
El sistema SHALL reportar el estado del llms.txt del sitio a partir de lo capturado en el último crawl: `missing` (sin respuesta exitosa), `invalid` (respuesta exitosa que no cumple el formato), `ok`, o `unknown` si la petición falló.

#### Scenario: Archivo inexistente
- **WHEN** el crawl registró un 404 para `/llms.txt`
- **THEN** el estado es `missing`

#### Scenario: Respuesta HTML en lugar de texto
- **WHEN** `/llms.txt` respondió 200 con una página HTML (por ejemplo, la home por una regla de rewrite)
- **THEN** el estado es `invalid` indicando que el contenido no es un llms.txt

#### Scenario: Petición fallida
- **WHEN** la petición a `/llms.txt` falló por timeout
- **THEN** el estado es `unknown` y se sugiere volver a crawlear

### Requirement: Validación del formato
El sistema SHALL considerar `invalid` un llms.txt solo si no inicia con un encabezado H1, tiene más de un H1 o no contiene ningún link Markdown `[título](url)`. Los elementos de lista sin link dentro de secciones H2 SHALL reportarse como una sola advertencia agrupada, sin cambiar el estado.

#### Scenario: Falta el H1
- **WHEN** el archivo no inicia con un encabezado `# `
- **THEN** el estado es `invalid` con el problema "falta el título H1"

#### Scenario: Secciones con datos y prosa
- **WHEN** un archivo con H1 y links tiene, dentro de una sección H2, elementos de lista como `- Teléfono: +52 744 469 6900`
- **THEN** el estado es `ok` y el reporte incluye una advertencia que indica cuántos elementos de lista no son links y en qué líneas

#### Scenario: Sin ningún link
- **WHEN** el archivo tiene H1 pero ningún link Markdown
- **THEN** el estado es `invalid` con el problema "no contiene links"

#### Scenario: Links rotos
- **WHEN** el archivo contiene links a URLs del mismo dominio que el crawl registró con estado 404
- **THEN** el reporte lista esos links como rotos

### Requirement: Generación de llms.txt
Cuando el estado es `missing` o `invalid`, el sistema SHALL generar un llms.txt con el nombre del sitio como H1, un resumen en blockquote, información de contacto y ubicación tomada del perfil, y secciones H2 con links a páginas relevantes con su descripción.

#### Scenario: Hotel independiente
- **WHEN** se genera el llms.txt de un sitio con una entidad Hotel
- **THEN** el archivo contiene el nombre del hotel, su resumen, su dirección y teléfono del perfil, y secciones como habitaciones, amenidades y contacto con links a las páginas correspondientes

#### Scenario: Datos factuales faltantes
- **WHEN** el perfil no tiene teléfono
- **THEN** el archivo generado no incluye un teléfono

### Requirement: Secciones por propiedad en cadenas
Para perfiles con varias entidades de hospedaje, el llms.txt generado SHALL incluir un resumen de la organización y una sección H2 por propiedad con los links relevantes de su scope.

#### Scenario: Cadena con tres hoteles
- **WHEN** se genera el llms.txt de una cadena con Ixtapa, Acapulco y Huatulco
- **THEN** el archivo tiene una sección H2 por cada hotel con links a páginas dentro de su scope

### Requirement: Selección de páginas relevantes
El llms.txt generado SHALL incluir solo páginas relevantes y no la lista completa del crawl: excluye páginas con estado distinto de 200, páginas no canónicas y duplicados por idioma, usando un único idioma (el idioma por defecto del perfil, salvo que el usuario elija otro).

#### Scenario: Sitio bilingüe
- **WHEN** el sitio tiene `/acapulco/habitaciones/` y `/en/acapulco/rooms/`
- **THEN** el llms.txt en el idioma por defecto incluye solo `/acapulco/habitaciones/`

#### Scenario: Página con error
- **WHEN** una página del crawl respondió 404
- **THEN** no aparece en el llms.txt generado

### Requirement: Entrega del archivo
El sistema SHALL mostrar una vista previa del llms.txt generado y permitir copiarlo o descargarlo como `llms.txt`, indicando que debe publicarse en la raíz del dominio.

#### Scenario: Descarga
- **WHEN** el usuario descarga el archivo generado
- **THEN** obtiene un archivo de texto llamado `llms.txt` con el contenido de la vista previa
