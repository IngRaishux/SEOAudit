# Spec Delta

## Purpose

Captura durante el crawl las señales de contenido que necesitan la revisión y generación GEO (datos estructurados, texto, links, imágenes y llms.txt), y las persiste junto con cada página y sitio.

## ADDED Requirements

### Requirement: Captura de bloques JSON-LD por página
El sistema SHALL extraer de cada página crawleada todos los bloques `<script type="application/ld+json">` del documento completo (incluido el `<head>`), conservando su contenido crudo y el resultado del parseo. Esto aplica tanto al crawl vía servicio externo como al modo con render de JavaScript.

#### Scenario: Página con varios bloques
- **WHEN** una página contiene dos bloques JSON-LD, uno en `<head>` y otro en `<body>`
- **THEN** la página persistida contiene ambos bloques, cada uno con su texto crudo y su JSON parseado

#### Scenario: Bloque con JSON inválido
- **WHEN** una página contiene un bloque JSON-LD que no es JSON válido
- **THEN** el bloque se persiste con su texto crudo y marcado con un error de parseo, sin interrumpir el crawl

#### Scenario: Página sin JSON-LD
- **WHEN** una página no contiene bloques JSON-LD
- **THEN** la página persistida registra una lista vacía de bloques

### Requirement: Persistencia de links de la página
El sistema SHALL persistir los links de cada página con su URL, texto e indicador de si son externos, incluidos los esquemas `tel:` y `mailto:`.

#### Scenario: Links de contacto y redes
- **WHEN** el footer de una página contiene `tel:+527444696900`, `mailto:info@ejemplo.com` y un link a `https://www.instagram.com/hotel/`
- **THEN** los tres links quedan persistidos en la página; el de Instagram marcado como externo

### Requirement: Persistencia de imágenes de la página
El sistema SHALL persistir las imágenes de cada página con su URL absoluta y su texto alternativo.

#### Scenario: Imagen con ruta relativa
- **WHEN** una página contiene `<img src="/img/logo.svg" alt="Logo">`
- **THEN** se persiste la imagen con su URL resuelta contra la URL de la página y alt `Logo`

### Requirement: Persistencia acotada del texto de la página
El sistema SHALL persistir el texto visible del cuerpo de cada página y, por separado, el texto del footer cuando exista, truncando cada uno a un límite máximo configurable para acotar el almacenamiento.

#### Scenario: Texto dentro del límite
- **WHEN** el texto del cuerpo de una página es menor al límite
- **THEN** se persiste completo

#### Scenario: Texto que excede el límite
- **WHEN** el texto del cuerpo de una página excede el límite
- **THEN** se persiste truncado al límite y la página indica que el texto fue truncado

### Requirement: Captura de llms.txt a nivel de sitio
El sistema SHALL solicitar `/llms.txt` en el origen del sitio durante el crawl y persistir a nivel de sitio el código de estado HTTP, el tipo de contenido y el contenido cuando la respuesta sea exitosa.

#### Scenario: El archivo existe
- **WHEN** `https://dominio.com/llms.txt` responde 200 con texto
- **THEN** el sitio persistido registra el estado 200, el tipo de contenido y el contenido del archivo

#### Scenario: El archivo no existe
- **WHEN** `https://dominio.com/llms.txt` responde 404
- **THEN** el sitio persistido registra el estado 404 sin contenido, y el crawl continúa normalmente

#### Scenario: Error de red
- **WHEN** la petición a `/llms.txt` falla por error de red o timeout
- **THEN** el sitio registra el fallo de la petición sin interrumpir el crawl
