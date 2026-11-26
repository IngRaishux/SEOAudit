# Spec Delta

## Purpose

Tabla de las páginas rastreadas de un sitio: muestra por página sus datos SEO principales en un orden fijo y en bloques paginados, para revisar sitios con muchas páginas sin scroll excesivo.

## ADDED Requirements

### Requirement: Columnas de la tabla de páginas
La tabla de páginas de un sitio SHALL mostrar estas columnas en este orden: URL, Título, Descripción, Idiomas, Encabezados, Estado y Acción. La columna Acción SHALL mostrarse solo a usuarios con permiso para editar contenido.

#### Scenario: Orden de columnas
- **WHEN** un miembro abre la pestaña "Páginas" de un sitio con páginas rastreadas
- **THEN** el encabezado de la tabla muestra URL, Título, Descripción, Idiomas, Encabezados, Estado y Acción, en ese orden

### Requirement: Descripción de cada página
La columna Descripción SHALL mostrar la meta description de la página. Si la página no tiene meta description, SHALL mostrar su `og:description`. Si no tiene ninguna, SHALL mostrar un guion (—). Un texto largo SHALL recortarse visualmente y el texto completo SHALL estar disponible al pasar el cursor.

#### Scenario: Página con meta description
- **WHEN** una página tiene meta description "Hotel en Cancún" y og:description "Reserva ya"
- **THEN** la columna Descripción muestra "Hotel en Cancún"

#### Scenario: Página solo con og:description
- **WHEN** una página no tiene meta description y su og:description es "Reserva ya"
- **THEN** la columna Descripción muestra "Reserva ya"

#### Scenario: Página sin descripción
- **WHEN** una página no tiene meta description ni og:description
- **THEN** la columna Descripción muestra "—"

### Requirement: Paginación de la tabla de páginas
La tabla de páginas SHALL mostrar las filas por bloques, con un tamaño de página elegible entre 10, 25 y 50 (10 por defecto). SHALL indicar el rango visible y el total ("X–Y de N") y permitir ir a la página anterior, a la siguiente, a la primera, a la última y a un número de página.

#### Scenario: Sitio con más filas que el tamaño de página
- **WHEN** un sitio tiene 37 páginas y el tamaño de página es 10
- **THEN** la tabla muestra las filas 1 a 10, el texto "1–10 de 37" y controles para llegar a 4 páginas

#### Scenario: Cambio de página
- **WHEN** el usuario está en la página 1 de 4 y elige ir a la siguiente
- **THEN** la tabla muestra las filas 11 a 20 y el texto "11–20 de 37"

#### Scenario: Cambio de tamaño de página
- **WHEN** el usuario está en la página 3 y cambia el tamaño de página a 25
- **THEN** la tabla vuelve a la página 1 y muestra las filas 1 a 25

#### Scenario: Una sola página de resultados
- **WHEN** un sitio tiene 8 páginas y el tamaño de página es 10
- **THEN** la tabla muestra las 8 filas y el texto "1–8 de 8", sin controles de navegación activos

### Requirement: El resumen de idiomas considera todas las páginas
El resumen de `hreflang` sobre la tabla y la revisión de idiomas de cada fila SHALL calcularse con todas las páginas de la vista, no solo con las de la página visible del paginador.

#### Scenario: Alterno en otra página del paginador
- **WHEN** la página A está en el bloque 1, su alterno B está en el bloque 3 y B enlaza de vuelta a A
- **THEN** la fila de A no marca "falta enlace de retorno" aunque B no esté visible

### Requirement: Aviso de páginas por encima del tope
Cuando el sitio tenga más URLs que el tope de páginas por sitio (ver `site-page-limit`), la vista SHALL avisar cuántas páginas se analizaron y cuántas URLs tiene el sitio. Para sitios rastreados con este cambio, el total SHALL ser el de URLs del sitemap. Para sitios anteriores, SHALL ser el de páginas guardadas.

#### Scenario: Sitemap mayor que el tope
- **WHEN** el sitemap de un sitio tiene 400 URLs y el tope es 100
- **THEN** la vista muestra un aviso de que se analizaron 100 de 400 URLs por el límite actual

#### Scenario: Sitio dentro del tope
- **WHEN** el sitemap de un sitio tiene 60 URLs y el tope es 100
- **THEN** la vista no muestra el aviso de límite
