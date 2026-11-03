# Spec Delta

## Purpose

Define el contenido y la estructura de la página pública de inicio de SEOAudit, que presenta las herramientas de la aplicación y ejemplos de uso para convertir visitantes en usuarios registrados.

## ADDED Requirements

### Requirement: Estructura de secciones de la landing
La landing SHALL mostrar, en este orden: hero, cifras destacadas, "cómo funciona", herramientas, ejemplos de uso, preguntas frecuentes, llamada final a la acción y pie de página. La página MUST tener un único encabezado de nivel 1, ubicado en el hero.

#### Scenario: Visitante abre la landing
- **WHEN** un visitante abre `/`
- **THEN** ve las ocho secciones en el orden definido
- **AND** la página contiene exactamente un elemento `h1`

### Requirement: Contenido renderizado en el servidor
Todo el texto de las secciones, incluidas las pestañas de ejemplos no seleccionadas y las respuestas de preguntas frecuentes plegadas, SHALL estar presente en el HTML inicial de la respuesta, sin depender de JavaScript del cliente.

#### Scenario: HTML sin JavaScript
- **WHEN** se solicita `/` sin ejecutar JavaScript
- **THEN** el HTML contiene los títulos y textos de todas las herramientas, de todos los ejemplos y de todas las preguntas frecuentes

### Requirement: Apariencia coherente con el tema
La landing SHALL usar los colores semánticos del tema daisyUI activo de la aplicación, sin colores fijos fuera del tema, y MUST ser usable desde 360 px de ancho sin desplazamiento horizontal.

#### Scenario: Pantalla de móvil
- **WHEN** la landing se muestra en un viewport de 360 px de ancho
- **THEN** no aparece barra de desplazamiento horizontal y las tarjetas se apilan en una columna

#### Scenario: Cambio de tema
- **WHEN** se cambia el tema daisyUI de la aplicación
- **THEN** los fondos, textos y botones de la landing adoptan los colores del nuevo tema

### Requirement: Catálogo de herramientas
La sección de herramientas SHALL presentar una tarjeta por cada función disponible: rastreo del sitio, vista previa SERP, auditoría de meta tags, sugerencias con IA, generación masiva de sugerencias, GEO (perfil de negocio, JSON-LD y `llms.txt`) y gestión multi-organización. Cada tarjeta MUST mostrar icono, nombre y una descripción de una o dos frases.

#### Scenario: Herramientas listadas
- **WHEN** el visitante llega a la sección de herramientas
- **THEN** ve siete tarjetas, una por función, cada una con icono, nombre y descripción

### Requirement: Pasos de "cómo funciona"
La sección "cómo funciona" SHALL mostrar el flujo de uso en cuatro pasos numerados: rastrear el sitio, analizar los resultados, optimizar con sugerencias y aplicar los cambios.

#### Scenario: Flujo visible
- **WHEN** el visitante llega a "cómo funciona"
- **THEN** ve los cuatro pasos en orden, cada uno con título y descripción breve

### Requirement: Ejemplos de uso con maquetas
La sección de ejemplos SHALL ofrecer tres casos seleccionables (SEO clásico, IA/GEO y agencias). Cada caso MUST combinar una explicación con una maqueta ilustrativa construida con componentes de la interfaz y datos ficticios, sin capturas de pantalla ni llamadas a la API.

#### Scenario: Caso SEO clásico
- **WHEN** el visitante selecciona el caso SEO clásico
- **THEN** ve la vista previa SERP de la aplicación con un title y una description de ejemplo, con sus indicadores de longitud
- **AND** ve una comparación del title antes y después de aplicar una sugerencia

#### Scenario: Caso IA/GEO
- **WHEN** el visitante selecciona el caso IA/GEO
- **THEN** ve un bloque de código con un JSON-LD de ejemplo y un fragmento de `llms.txt`

#### Scenario: Caso agencias
- **WHEN** el visitante selecciona el caso agencias
- **THEN** ve una maqueta con varias organizaciones y sus sitios

#### Scenario: Selección sin JavaScript
- **WHEN** JavaScript está desactivado y el visitante pulsa otro caso
- **THEN** el contenido del caso seleccionado se muestra igualmente

#### Scenario: Maquetas sin datos reales
- **WHEN** se renderiza la sección de ejemplos
- **THEN** no se hace ninguna petición a la API ni a la base de datos

### Requirement: Preguntas frecuentes plegables
La landing SHALL mostrar al menos cinco preguntas frecuentes en elementos plegables, todos cerrados inicialmente, que el visitante puede abrir.

#### Scenario: Abrir una pregunta
- **WHEN** el visitante pulsa una pregunta
- **THEN** se despliega su respuesta

### Requirement: Llamadas a la acción según la sesión
El hero y la llamada final SHALL mostrar acciones según el estado de autenticación: sin sesión, "Empezar gratis" (a `/register`) y "Iniciar sesión" (a `/login`); con sesión, "Ir al rastreador" (a `/crawler`) y "Ver panel" (a `/dashboard`).

#### Scenario: Visitante sin sesión
- **WHEN** un visitante sin sesión ve el hero
- **THEN** ve "Empezar gratis" enlazando a `/register` e "Iniciar sesión" enlazando a `/login`

#### Scenario: Usuario con sesión
- **WHEN** un usuario autenticado ve el hero
- **THEN** ve "Ir al rastreador" enlazando a `/crawler` y "Ver panel" enlazando a `/dashboard`

### Requirement: Textos traducidos
Todos los textos visibles de la landing SHALL provenir del diccionario i18n de la aplicación y existir en español e inglés.

#### Scenario: Claves completas
- **WHEN** se comparan las claves de textos de la landing en español e inglés
- **THEN** ambos idiomas tienen exactamente las mismas claves y ninguna está vacía
