# Spec Delta

## Purpose

Mantiene por sitio un perfil de negocio confirmado por el usuario —un grafo de entidades tipadas con su alcance por URL e idioma— que es la fuente de verdad para revisar y generar datos estructurados y llms.txt sin inventar información.

## ADDED Requirements

### Requirement: Perfil asociado a organización y origen
El sistema SHALL asociar cada perfil de negocio a una organización y al origen (esquema + host) del sitio, de modo que un nuevo crawl del mismo origen reutilice el perfil existente. Solo los miembros de la organización pueden ver o modificar el perfil.

#### Scenario: Re-crawl conserva el perfil
- **WHEN** un usuario crawlea de nuevo `https://www.lasbrisashotels.com.mx/` y ya existe un perfil para ese origen en su organización
- **THEN** el nuevo crawl usa el perfil existente sin pedir que se capture de nuevo

#### Scenario: Acceso de otra organización
- **WHEN** un usuario que no pertenece a la organización solicita el perfil
- **THEN** el sistema responde con acceso denegado

### Requirement: Entidades tipadas
El perfil SHALL contener una o más entidades, cada una con un tipo de schema.org de un catálogo soportado: `Organization`, `LocalBusiness` y la familia `LodgingBusiness` (`Hotel`, `Resort`, `BedAndBreakfast`, `Hostel`, `Motel`, `VacationRental`). Cada entidad tiene un `@id` estable.

#### Scenario: Hotel independiente
- **WHEN** el usuario configura un sitio de un solo hotel
- **THEN** el perfil tiene una entidad de la familia `LodgingBusiness` con scope `/`

#### Scenario: Tipo no soportado
- **WHEN** se intenta guardar una entidad con un tipo fuera del catálogo
- **THEN** el sistema rechaza el cambio indicando los tipos permitidos

### Requirement: Cadenas con scope por prefijo de URL
El perfil SHALL permitir entidades con scope por prefijo de ruta y relaciones `parentOrganization` entre ellas. Cada página del sitio se asigna a la entidad cuyo scope sea el prefijo más largo que coincida con su ruta normalizada.

#### Scenario: Página de un hotel dentro de una cadena
- **WHEN** existen las entidades Organization (scope `/`) y Resort "Las Brisas Acapulco" (scope `/acapulco/`)
- **THEN** la página `/acapulco/habitaciones/` se asigna al Resort y `/contacto/` a la Organization

### Requirement: Normalización de idioma en la ruta
Antes de asignar una página a una entidad, el sistema SHALL quitar un primer segmento de ruta que sea un código de idioma (por ejemplo `en`, `es`, `es-MX`) y registrar ese idioma como el idioma de la página. Las páginas sin segmento de idioma usan el idioma por defecto del perfil.

#### Scenario: Ruta con idioma primero
- **WHEN** se asigna la página `/en/acapulco/rooms/`
- **THEN** se asigna al Resort con scope `/acapulco/` y su idioma es `en`

#### Scenario: Ruta sin idioma
- **WHEN** se asigna la página `/acapulco/` y el idioma por defecto del perfil es `es`
- **THEN** se asigna al Resort con idioma `es`

### Requirement: Identificador único sin idioma
El `@id` de cada entidad interna SHALL derivarse del origen y del scope sin segmento de idioma, con un fragmento por tipo (`#organization` para organizaciones, `#hotel` para la familia de hospedaje, `#business` en otros casos), y ser el mismo en todas las versiones de idioma.

#### Scenario: @id de un hotel de cadena
- **WHEN** se crea el Resort con scope `/acapulco/` en `https://www.lasbrisashotels.com.mx`
- **THEN** su `@id` es `https://www.lasbrisashotels.com.mx/acapulco/#hotel` tanto para páginas `/es/` como `/en/`

### Requirement: Entidades externas
El perfil SHALL permitir entidades externas (por ejemplo, un grupo corporativo en otro dominio) definidas solo por `@id`, nombre y URL, que pueden ser destino de `parentOrganization` y que nunca se crawlean ni se validan.

#### Scenario: Grupo corporativo en otro dominio
- **WHEN** el usuario agrega la entidad externa "Grupo Brisas" con `@id` `https://www.brisas.com.mx/#organization` como padre de la Organization del sitio
- **THEN** la relación queda guardada y ninguna página del sitio se asigna a la entidad externa

### Requirement: Campos factuales y textuales por idioma
Cada entidad SHALL distinguir campos factuales con un solo valor (teléfono, email, dirección, coordenadas, logo, imagen, redes sociales, horarios) de campos textuales con un valor por idioma (descripción, nombre alternativo, nombres de amenidades).

#### Scenario: Descripción en dos idiomas
- **WHEN** el Resort tiene descripción en `es` y en `en`
- **THEN** cada versión de idioma usa su propia descripción y el teléfono es el mismo en ambas

### Requirement: Trazabilidad de la fuente de cada campo
Cada valor del perfil SHALL registrar su fuente: `user`, `existing-jsonld`, `extracted` o `generated`. Un valor confirmado o editado por el usuario pasa a fuente `user`.

#### Scenario: Valor editado por el usuario
- **WHEN** el usuario corrige un teléfono pre-llenado con fuente `extracted`
- **THEN** el valor se guarda con fuente `user`

### Requirement: Detección sugerida de propiedades en cadenas
El sistema SHALL sugerir entidades candidatas agrupando las URLs crawleadas por su primer segmento de ruta normalizado e identificando cuáles corresponden a propiedades. Las sugerencias no se guardan en el perfil hasta que el usuario las confirma.

#### Scenario: Cadena con tres hoteles y un blog
- **WHEN** el sitio tiene páginas bajo `/ixtapa/`, `/acapulco/`, `/huatulco/` y `/blog/`
- **THEN** el sistema sugiere tres entidades de hospedaje con esos scopes y no sugiere `/blog/`

#### Scenario: El usuario descarta una sugerencia
- **WHEN** el usuario descarta la entidad sugerida para `/huatulco/`
- **THEN** el perfil no contiene esa entidad

### Requirement: Pre-llenado sin inventar datos
El sistema SHALL pre-llenar campos con esta prioridad: JSON-LD existente del sitio, extracción determinista de las señales del crawl (links `tel:` y `mailto:`, links a redes sociales, links de mapas con coordenadas, `og:image`) y extracción literal del texto de la página. Un campo factual sin evidencia en esas fuentes SHALL quedar vacío.

#### Scenario: Teléfono presente en el footer
- **WHEN** el footer de las páginas del hotel contiene `tel:+527444696900`
- **THEN** el teléfono se pre-llena con `+52 744 469 6900` y fuente `extracted`

#### Scenario: Dato sin evidencia
- **WHEN** ninguna fuente contiene coordenadas del hotel
- **THEN** el campo de coordenadas queda vacío y no se genera un valor

#### Scenario: JSON-LD existente tiene prioridad
- **WHEN** el JSON-LD del sitio declara un teléfono y el footer contiene otro distinto
- **THEN** el campo se pre-llena con el teléfono del JSON-LD, con fuente `existing-jsonld`

### Requirement: Textos generados marcados
El sistema SHALL poder generar campos textuales (como la descripción) a partir del contenido crawleado o de las entidades del perfil, guardándolos con fuente `generated` hasta que el usuario los confirme.

#### Scenario: Descripción de la organización de una cadena
- **WHEN** el usuario pide generar la descripción de la Organization de una cadena con tres hoteles confirmados
- **THEN** se propone una descripción que menciona los tres hoteles, con fuente `generated`

### Requirement: Selección asistida del tipo de negocio
Al crear un perfil, el sistema SHALL sugerir el tipo de negocio a partir del contenido crawleado (hotel independiente, cadena hotelera, negocio local u organización), y el usuario confirma o cambia la sugerencia.

#### Scenario: Sitio de hotel
- **WHEN** el contenido crawleado describe habitaciones, reservas y amenidades de un solo hotel
- **THEN** el sistema sugiere el tipo "hotel independiente"
