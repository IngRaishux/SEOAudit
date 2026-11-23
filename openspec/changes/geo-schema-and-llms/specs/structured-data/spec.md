# Spec Delta

## Purpose

Revisa el JSON-LD de cada página por niveles contra reglas por tipo y contra el perfil de negocio, y produce bloques completados de forma determinista, sin borrar datos existentes y con los conflictos resueltos por el usuario.

## ADDED Requirements

### Requirement: Revisión por niveles
El sistema SHALL asignar a cada página un estado de datos estructurados evaluando en orden: existe, válido, tipo esperado, completo y consistente. El estado es el del primer nivel que falla: `missing`, `invalid`, `wrong-type`, `incomplete`, `inconsistent` u `ok`.

#### Scenario: Sin JSON-LD
- **WHEN** una página no tiene bloques JSON-LD
- **THEN** su estado es `missing`

#### Scenario: JSON inválido
- **WHEN** el único bloque JSON-LD de una página no es JSON válido o no declara `@context` de schema.org y `@type`
- **THEN** su estado es `invalid`

#### Scenario: Todo correcto
- **WHEN** una página declara la entidad esperada con todos los campos requeridos y recomendados, y sus valores coinciden con el perfil
- **THEN** su estado es `ok`

### Requirement: Nodos en varios bloques y en @graph
La revisión SHALL considerar todos los nodos de todos los bloques JSON-LD de la página, incluidos los nodos dentro de `@graph`, y localizar la entidad esperada por `@id` o, si no lo hay, por tipo.

#### Scenario: Entidad dentro de @graph
- **WHEN** la página tiene un bloque con `@graph` que contiene un `WebPage` y un `Hotel`
- **THEN** la revisión evalúa el nodo `Hotel` como la entidad de la página

### Requirement: Tipo esperado según el perfil
Cuando existe un perfil de negocio, el sistema SHALL determinar la entidad esperada de cada página según su scope y reportar `wrong-type` si la página no declara un nodo de ese tipo o de un subtipo compatible. Sin perfil, este nivel se omite.

#### Scenario: Página de hotel que solo declara la organización
- **WHEN** la página `/acapulco/` debería declarar el Resort y solo contiene un nodo `Organization`
- **THEN** su estado es `wrong-type`, indicando que falta la entidad Resort

#### Scenario: Sin perfil
- **WHEN** el sitio no tiene perfil de negocio
- **THEN** la revisión no evalúa los niveles de tipo esperado ni de consistencia, y lo indica en el reporte

### Requirement: Reglas de completitud por tipo
El sistema SHALL evaluar la completitud con reglas configurables por tipo que clasifican propiedades como REQ (requeridas), REC (recomendadas) o EXTRA. La familia `LodgingBusiness` exige `@id`, `name`, `url`, `address`, `telephone`; recomienda `alternateName`, `description`, `image`, `geo`, `amenityFeature`, `sameAs`, `parentOrganization`.

#### Scenario: Hotel sin coordenadas ni amenidades
- **WHEN** un nodo `Resort` tiene todas las REQ pero le faltan `geo` y `amenityFeature`
- **THEN** su estado es `incomplete` y el reporte lista `geo` y `amenityFeature` como recomendadas faltantes

#### Scenario: Organization incompleta
- **WHEN** un nodo `Organization` no tiene `logo`
- **THEN** su estado es `incomplete` con `logo` como requerida faltante

### Requirement: Propiedades EXTRA como sugerencia
Las propiedades EXTRA (por ejemplo `checkinTime`, `checkoutTime`, `priceRange`, `starRating`, `numberOfRooms`, `petsAllowed` en hospedaje) SHALL mostrarse como sugerencias y no SHALL afectar el estado ni el puntaje de completitud.

#### Scenario: Hotel completo sin EXTRA
- **WHEN** un nodo de hospedaje tiene todas las REQ y REC pero ninguna EXTRA
- **THEN** su estado no es `incomplete` y las EXTRA aparecen como sugerencias

### Requirement: Consistencia con el perfil
El sistema SHALL comparar los valores factuales del nodo con los del perfil, de forma tolerante al formato (por ejemplo, espacios y signos en teléfonos), y reportar `inconsistent` con cada diferencia encontrada.

#### Scenario: Teléfono distinto
- **WHEN** el nodo declara `+52 744 469 6900` y el perfil tiene `+52 744 469 6901`
- **THEN** el estado es `inconsistent` y el reporte muestra ambos valores

#### Scenario: Mismo teléfono con distinto formato
- **WHEN** el nodo declara `+527444696900` y el perfil `+52 744 469 6900`
- **THEN** no se reporta inconsistencia

### Requirement: Detección de @id por idioma
El sistema SHALL detectar a nivel de sitio cuando una misma entidad se declara con `@id` distintos por idioma (por ejemplo `/es/acapulco/#hotel` y `/en/acapulco/#hotel`) y recomendar unificarlos al `@id` sin idioma del perfil.

#### Scenario: Hotel con @id por idioma
- **WHEN** las páginas `/es/acapulco/` y `/en/acapulco/` declaran el Resort con `@id` que incluyen el idioma
- **THEN** el reporte del sitio incluye un hallazgo recomendando `https://dominio/acapulco/#hotel`

### Requirement: Completado sin borrar datos
Al completar un nodo existente, el sistema SHALL agregar solo las propiedades faltantes con valor en el perfil y conservar sin cambios todas las demás propiedades, incluidas las que el perfil no modela (por ejemplo `makesOffer` o `potentialAction`).

#### Scenario: Nodo con ofertas del motor de reservas
- **WHEN** se completa un nodo `Hotel` que contiene `makesOffer` y le falta `geo`
- **THEN** el bloque resultante conserva `makesOffer` intacto y agrega `geo` desde el perfil

#### Scenario: Campo sin valor en el perfil
- **WHEN** falta `geo` en el nodo y el perfil tampoco lo tiene
- **THEN** el bloque resultante no incluye `geo` y el reporte indica que falta completarlo en el perfil

### Requirement: Conflictos resueltos por el usuario
El sistema SHALL presentar como conflicto, sin aplicarlo automáticamente, cualquier valor existente distinto al del perfil, incluidos los cambios de `@type` y de `@id`. El usuario elige por conflicto mantener el valor existente o usar el del perfil.

#### Scenario: Usuario mantiene el valor existente
- **WHEN** hay conflicto en `priceRange` y el usuario elige mantener el existente
- **THEN** el bloque resultante conserva el `priceRange` original

#### Scenario: Cambio de @id coherente
- **WHEN** el usuario acepta cambiar el `@id` de una entidad al del perfil
- **THEN** todas las referencias a esa entidad en los bloques generados del sitio (por ejemplo `parentOrganization`) usan el nuevo `@id`

### Requirement: Generación cuando no existe
Para páginas con estado `missing` o `invalid`, el sistema SHALL generar un bloque nuevo desde el perfil con la entidad esperada, enlazando sus relaciones por `@id`, con los textos en el idioma de la página y la `url` de la página en ese idioma.

#### Scenario: Página en inglés de un hotel de cadena
- **WHEN** se genera el bloque para `/en/acapulco/` sin JSON-LD previo
- **THEN** el bloque declara el Resort con `@id` sin idioma, `url` `/en/acapulco/`, descripción en `en` y `parentOrganization` apuntando al `@id` de la Organization

### Requirement: Entrega del bloque
El sistema SHALL entregar cada bloque resultante como un `<script type="application/ld+json">` listo para copiar o descargar, con un diff que marque lo agregado y los conflictos resueltos, e indicando dónde colocarlo: global del sitio, plantilla de la entidad o página específica.

#### Scenario: Bloque de la organización
- **WHEN** el usuario obtiene el bloque de la Organization de una cadena
- **THEN** se indica colocarlo en el layout global del sitio y puede copiarse o descargarse

#### Scenario: Diff de lo agregado
- **WHEN** se completa un nodo agregando `telephone` y `geo`
- **THEN** el diff marca ambas propiedades como agregadas y el resto como existente
