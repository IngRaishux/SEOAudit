# Spec Delta

## Purpose

Permite sacar la tabla de páginas de un sitio a PDF y a XLSX para compartirla o analizarla fuera de la aplicación, con los mismos datos y columnas que se ven en pantalla.

## ADDED Requirements

### Requirement: Exportar desde la tabla de páginas
La pestaña "Páginas" SHALL ofrecer, arriba de la tabla, una acción de exportar con los formatos PDF y XLSX, disponible para cualquier miembro que pueda ver el sitio. La acción SHALL estar deshabilitada mientras se genera un archivo y SHALL avisar con un error si la generación falla.

#### Scenario: Elegir formato
- **WHEN** un miembro abre la acción de exportar en un sitio con páginas
- **THEN** puede elegir "PDF" o "XLSX"

#### Scenario: Sitio sin páginas
- **WHEN** el sitio no tiene páginas rastreadas
- **THEN** la acción de exportar no se muestra

### Requirement: Contenido exportado
Ambos formatos SHALL incluir todas las páginas de la vista, sin importar la página o el tamaño elegidos en el paginador. SHALL usar las columnas URL, Título, Descripción, Idiomas, Encabezados y Estado, en ese orden y con los mismos valores que la tabla, incluida la regla de respaldo de la descripción. La columna Acción SHALL omitirse.

#### Scenario: Export con paginador en otra página
- **WHEN** un sitio tiene 37 páginas, el usuario está en la página 2 del paginador y exporta
- **THEN** el archivo contiene las 37 páginas

#### Scenario: Sin columna Acción
- **WHEN** un usuario con permiso de edición exporta
- **THEN** el archivo no contiene la columna Acción

### Requirement: Formato del PDF
El PDF SHALL presentarse como la tabla de la aplicación:
- orientación horizontal y una cabecera con la URL del sitio, la fecha de exportación y el número de páginas;
- encabezados de columna repetidos en cada hoja;
- el Estado con el color de su distintivo (verde 200, rojo 4xx/5xx, azul otros);
- los Idiomas como texto con sus códigos y una marca de problema;
- los Encabezados como conteo.

#### Scenario: Estado con color
- **WHEN** una página tiene estado 404
- **THEN** en el PDF su celda de Estado aparece con el color de error

#### Scenario: Tabla de varias hojas
- **WHEN** las filas no caben en una hoja
- **THEN** cada hoja del PDF repite los encabezados de columna

### Requirement: Formato del XLSX
El XLSX SHALL tener una hoja con una fila de encabezado fija y una fila por página. El Estado SHALL ser numérico y la Descripción SHALL ser el texto completo. SHALL incluir además una columna con la lista completa de encabezados de la página.

#### Scenario: Valores completos
- **WHEN** una página tiene una descripción de 300 caracteres
- **THEN** la celda de Descripción del XLSX contiene los 300 caracteres

### Requirement: Nombre del archivo exportado
El archivo SHALL llamarse con el dominio del sitio y la fecha, con la extensión del formato (por ejemplo `paginas-ejemplo.com-2026-11-26.pdf`).

#### Scenario: Descarga del XLSX
- **WHEN** un miembro exporta a XLSX el sitio `https://ejemplo.com` el 26 de noviembre de 2026
- **THEN** el navegador descarga `paginas-ejemplo.com-2026-11-26.xlsx`
