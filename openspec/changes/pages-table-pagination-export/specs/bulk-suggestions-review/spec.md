# Spec Delta

## Purpose

Revisión y edición de los resultados de "Generar todas" (sugerencias SEO generadas en bloque para las páginas de un sitio) antes de guardarlos o exportarlos, en bloques paginados.

## ADDED Requirements

### Requirement: Paginación de resultados
Cuando la generación termine, los resultados SHALL mostrarse por bloques, con un tamaño de página elegible entre 10, 25 y 50 (10 por defecto) y el mismo control de paginación que la tabla de páginas del sitio, incluido el rango "X–Y de N". Al cambiar de página, la vista SHALL volver al inicio de la lista de resultados.

#### Scenario: Muchos resultados
- **WHEN** la generación produce 45 resultados y el tamaño de página es 10
- **THEN** se muestran los resultados 1 a 10, el texto "1–10 de 45" y controles para llegar a 5 páginas

#### Scenario: Cambio de página
- **WHEN** el usuario pasa de la página 1 a la 2
- **THEN** se muestran los resultados 11 a 20 y la vista se desplaza al inicio de la lista

### Requirement: Las ediciones sobreviven al cambio de página
Las ediciones hechas en un resultado SHALL conservarse al navegar entre páginas, y su marca de "sin guardar" SHALL seguir visible al volver.

#### Scenario: Editar y volver
- **WHEN** el usuario edita el título del resultado 3, va a la página 2 y regresa a la página 1
- **THEN** el resultado 3 muestra el título editado y la marca "sin guardar"

### Requirement: Guardar y exportar abarcan todas las páginas
"Guardar todo" SHALL guardar los resultados editados de todas las páginas del paginador y mostrar su conteo total. "Exportar todo" SHALL seguir exportando en JSON todos los resultados, no solo los de la página visible.

#### Scenario: Ediciones en varias páginas
- **WHEN** el usuario edita un resultado en la página 1 y otro en la página 3
- **THEN** "Guardar todo" indica 2 cambios y guarda ambos

#### Scenario: Exportar con paginador
- **WHEN** hay 45 resultados, el usuario está en la página 2 y pulsa "Exportar todo"
- **THEN** el JSON descargado contiene los 45 resultados
