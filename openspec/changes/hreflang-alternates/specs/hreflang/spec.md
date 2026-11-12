# Spec Delta

## Purpose

Detecta los idiomas alternos (`hreflang`) que declara cada página de un sitio, revisa si están bien configurados y los muestra al usuario, para que pueda corregir el SEO internacional de su sitio.

## ADDED Requirements

### Requirement: Captura de alternos desde el HTML
Al rastrear una página, el sistema SHALL guardar cada `<link rel="alternate" hreflang="…" href="…">` de su `<head>` con su código de idioma tal como aparece y su URL resuelta a absoluta. También SHALL guardar el valor del atributo `lang` del elemento `<html>`, o vacío si no existe.

#### Scenario: Página con versiones en dos idiomas
- **WHEN** se rastrea una página cuyo `<head>` incluye `hreflang="es-MX"` hacia `/` y `hreflang="en-US"` hacia `/en/`
- **THEN** la página queda con dos alternos, `es-MX` y `en-US`, con sus URLs absolutas

#### Scenario: URL relativa
- **WHEN** un alterno declara `href="/en/rooms/"` en la página `https://hotel.example.com/habitaciones/`
- **THEN** se guarda la URL `https://hotel.example.com/en/rooms/`

#### Scenario: Sin alternos
- **WHEN** se rastrea una página sin anotaciones `hreflang`
- **THEN** la página queda con la lista de alternos vacía

### Requirement: Captura de alternos desde el sitemap
Si el sitemap declara `<xhtml:link rel="alternate" hreflang="…" href="…">` para una URL, el sistema SHALL añadir esos alternos a la página de esa URL. Cada alterno SHALL indicar su fuente: HTML, sitemap o ambas, cuando el mismo código y URL aparecen en las dos.

#### Scenario: Solo en el sitemap
- **WHEN** el sitemap declara un alterno `en` para una URL cuyo HTML no tiene `hreflang`
- **THEN** la página tiene ese alterno con fuente "sitemap"

#### Scenario: En ambas fuentes
- **WHEN** el mismo código y URL aparecen en el HTML y en el sitemap
- **THEN** la página tiene un único alterno con fuente "ambas"

### Requirement: Revisión de la configuración de hreflang
Para un sitio rastreado, el sistema SHALL detectar en cada página que declara alternos estos problemas: código de idioma o región inválido; falta la autorreferencia; falta `x-default`; el mismo código apunta a URLs distintas; y un alterno que apunta a otra página rastreada que no enlaza de vuelta. Las URLs se comparan sin distinguir mayúsculas en el dominio y sin el fragmento. Las páginas sin alternos MUST NOT marcarse con problemas.

#### Scenario: Código inválido
- **WHEN** una página declara `hreflang="english"`, `hreflang="en_US"` o `hreflang="es-419"`
- **THEN** se marca el problema de código inválido para ese alterno

#### Scenario: Código con alias
- **WHEN** una página declara `hreflang="en-UK"`
- **THEN** se marca como inválido y se sugiere `en-GB`

#### Scenario: Sin autorreferencia
- **WHEN** la página `/` declara solo un alterno `en` hacia `/en/`
- **THEN** se marca que falta la autorreferencia

#### Scenario: Sin x-default
- **WHEN** una página declara alternos y ninguno es `x-default`
- **THEN** se marca que falta `x-default`

#### Scenario: Sin enlace de retorno
- **WHEN** la página `/` declara `en` hacia `/en/`, `/en/` fue rastreada y sus alternos no incluyen `/`
- **THEN** se marca en `/` que `/en/` no enlaza de vuelta

#### Scenario: x-default hacia otra página
- **WHEN** la página `/contacto/` declara `x-default` hacia `/`, y `/` (rastreada) no incluye `/contacto/` en sus alternos
- **THEN** se marca en `/contacto/` que su `x-default` apunta a otra página, en lugar de un enlace sin retorno, y la corrección propuesta es apuntar `x-default` a una de sus propias versiones

#### Scenario: Alterno fuera del rastreo
- **WHEN** un alterno apunta a una URL que no fue rastreada
- **THEN** no se marca problema de retorno para ese alterno y se indica que no se pudo verificar

#### Scenario: Configuración correcta
- **WHEN** `/` y `/en/` se declaran mutuamente, cada una se incluye a sí misma y ambas incluyen `x-default`
- **THEN** ninguna de las dos tiene problemas

### Requirement: Idiomas en la vista de páginas
La pestaña de páginas de un sitio SHALL mostrar por cada página sus códigos de idioma alternos, un indicador cuando tiene problemas y, a petición, el detalle de cada alterno (código, URL y fuente) con la lista de problemas. Encima de la tabla SHALL mostrarse cuántas páginas declaran idiomas alternos y cuántas tienen problemas. Todos los textos MUST estar en el idioma activo.

#### Scenario: Página con alternos
- **WHEN** el usuario abre la pestaña de páginas de un sitio cuyas páginas declaran `es-MX`, `en-US` y `x-default`
- **THEN** cada página muestra esos tres códigos en la columna "Idiomas"

#### Scenario: Ver el detalle
- **WHEN** el usuario despliega el detalle de idiomas de una página
- **THEN** ve la URL y la fuente de cada alterno y los problemas detectados

#### Scenario: Resumen del sitio
- **WHEN** 10 de 12 páginas declaran alternos y 3 de ellas tienen problemas
- **THEN** encima de la tabla ve que 10 páginas declaran idiomas alternos y 3 tienen problemas

#### Scenario: Página rastreada antes de esta función
- **WHEN** una página se rastreó antes de que existiera la captura de alternos
- **THEN** la columna "Idiomas" indica que hay que volver a rastrear el sitio para verlos, en lugar de "sin idiomas"

### Requirement: Precarga en el formulario de sugerencias
Al abrir las sugerencias de una página que declara alternos, los campos `en-US`, `es-MX` y `x-default` del formulario SHALL precargarse con la URL del alterno de ese código exacto o, si no existe, del primero de ese idioma (por ejemplo `en` o `en-GB` para `en-US`). Al generar sugerencias con IA, los valores detectados MUST prevalecer sobre los propuestos para esos campos.

#### Scenario: Precarga exacta
- **WHEN** la página declara `en-US` hacia `/en/` y `x-default` hacia `/`
- **THEN** el formulario muestra `/en/` en `en-US` y `/` en `x-default` como URLs absolutas

#### Scenario: Coincidencia por idioma
- **WHEN** la página declara solo `es` hacia `/`
- **THEN** el campo `es-MX` se precarga con esa URL

#### Scenario: La IA no sustituye datos reales
- **WHEN** el usuario genera sugerencias con IA en una página con `en-US` detectado
- **THEN** el campo `en-US` conserva la URL detectada

#### Scenario: Sin alternos
- **WHEN** la página no declara alternos
- **THEN** el formulario se comporta como hoy
