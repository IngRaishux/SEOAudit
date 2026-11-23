# Spec Delta

## Purpose

Permite a visitantes sin cuenta probar herramientas de SEOAudit desde la landing, con un cupo diario por visitante, protección contra bots y resultados que no se guardan, para que conozcan el producto antes de registrarse.

## ADDED Requirements

### Requirement: Sección de herramientas gratuitas en la landing
La landing (`/` y `/en`) SHALL mostrar una sección "Herramientas gratuitas" con ancla `#free-tools`, situada entre "Herramientas" y "Ejemplos de uso". Su título, textos y explicación del cupo MUST estar en el HTML del servidor en el idioma de la ruta.

#### Scenario: Visitante abre la landing
- **WHEN** un visitante abre `/` o `/en`
- **THEN** ve la sección de herramientas gratuitas después de "Herramientas" y antes de "Ejemplos de uso"
- **AND** el título y la explicación del límite diario están en el HTML inicial

#### Scenario: Herramientas desactivadas
- **WHEN** las herramientas gratuitas están desactivadas en el servidor
- **THEN** la sección explica que no están disponibles en este momento e invita a crear una cuenta, sin formulario

### Requirement: Análisis gratuito de un sitio
Un visitante sin cuenta SHALL poder rastrear un sitio introduciendo su URL. La aplicación MUST mostrar el progreso (páginas procesadas sobre el total) y, al terminar, los resultados en la misma sección.

#### Scenario: Rastreo correcto
- **WHEN** el visitante introduce `https://ejemplo.com`, pasa la verificación anti-bots y lanza el análisis
- **THEN** ve el progreso del rastreo
- **AND** al terminar ve una fila por página rastreada

#### Scenario: Sitio sin sitemap
- **WHEN** el sitio no tiene sitemap localizable
- **THEN** se muestra un error que lo explica y no se descuenta ninguna página del cupo

### Requirement: Cupo diario de rastreo
Cada visitante SHALL poder rastrear como máximo 20 páginas por día natural UTC, sumando todos sus rastreos. Un rastreo MUST procesar como máximo las páginas que le queden y solo MUST descontar las páginas realmente rastreadas.

#### Scenario: Primer rastreo de un sitio grande
- **WHEN** un visitante sin uso previo rastrea un sitio con 50 páginas en su sitemap
- **THEN** se rastrean 20 páginas y su cupo de rastreo queda en 0

#### Scenario: Cupo parcial
- **WHEN** un visitante al que le quedan 8 páginas rastrea un sitio de 5 páginas
- **THEN** se rastrean las 5 y le quedan 3

#### Scenario: Cupo agotado
- **WHEN** un visitante sin cupo intenta lanzar otro análisis
- **THEN** la petición se rechaza con un mensaje que indica cuándo se renueva el cupo e invita a crear una cuenta

#### Scenario: Renovación diaria
- **WHEN** empieza un nuevo día UTC
- **THEN** el visitante vuelve a tener 20 páginas de rastreo y 20 de sugerencias

### Requirement: Sugerencias con IA gratuitas
Desde los resultados, el visitante SHALL poder generar sugerencias con IA (title, description y keywords) para una página rastreada en su análisis. Las sugerencias MUST tener su propio cupo de 20 páginas por día UTC, independiente del de rastreo, y solo MUST descontarse cuando la generación termina bien.

#### Scenario: Generar sugerencias
- **WHEN** el visitante pide sugerencias para una página de sus resultados
- **THEN** ve el title, la description y las keywords sugeridos junto a los actuales
- **AND** su cupo de sugerencias baja en 1

#### Scenario: Página ajena al análisis
- **WHEN** se piden sugerencias para una URL que no forma parte del análisis de ese visitante
- **THEN** la petición se rechaza sin llamar a la IA

#### Scenario: Fallo de la IA
- **WHEN** el servicio de IA falla al generar
- **THEN** se muestra un error y el cupo de sugerencias no cambia

#### Scenario: Cupo de sugerencias agotado
- **WHEN** al visitante no le quedan sugerencias
- **THEN** el botón de generar indica que el cupo está agotado y cuándo se renueva

### Requirement: Cupo visible
La sección SHALL mostrar cuántas páginas de rastreo y de sugerencias le quedan hoy al visitante, y MUST actualizarlo tras cada rastreo y cada sugerencia.

#### Scenario: Consulta del cupo
- **WHEN** un visitante que rastreó 12 páginas y generó 3 sugerencias vuelve a la landing el mismo día
- **THEN** la sección indica que le quedan 8 páginas de rastreo y 17 de sugerencias

### Requirement: Identificación del visitante y verificación anti-bots
El cupo SHALL aplicarse por dirección IP del visitante. Lanzar un análisis MUST requerir superar una verificación anti-bots. La IP MUST NOT guardarse en claro.

#### Scenario: Verificación no superada
- **WHEN** se intenta lanzar un análisis sin verificación válida
- **THEN** la petición se rechaza y no se rastrea nada ni se descuenta cupo

#### Scenario: Mismo visitante en otra pestaña
- **WHEN** el visitante abre la landing en otra pestaña o navegador desde la misma IP
- **THEN** ve el mismo cupo restante

### Requirement: Solo sitios públicos
El análisis gratuito MUST aceptar solo URLs `http` o `https` de sitios públicos en los puertos estándar, y MUST rastrear únicamente páginas del mismo host que la URL introducida.

#### Scenario: Dirección interna
- **WHEN** el visitante introduce `http://localhost:3000`, `http://192.168.1.10` o un dominio que resuelve a una IP privada
- **THEN** la petición se rechaza con un error de URL no válida y no se hace ninguna petición a esa dirección

#### Scenario: Sitemap con URLs de otro dominio
- **WHEN** el sitemap del sitio incluye URLs de otros dominios
- **THEN** esas URLs no se rastrean ni cuentan para el cupo

#### Scenario: Formato no válido
- **WHEN** el visitante introduce un texto que no es una URL o usa otro protocolo, como `ftp://`
- **THEN** el formulario muestra el error junto al campo, con la validación propia de la aplicación

### Requirement: Resultados sin guardar
Los resultados del modo gratuito MUST NOT guardarse en la base de datos de sitios, páginas o sugerencias, y MUST dejar de estar disponibles al cerrar o recargar la página. La sección SHALL invitar a crear una cuenta para guardarlos.

#### Scenario: Recarga tras un análisis
- **WHEN** el visitante recarga la página después de un análisis
- **THEN** los resultados ya no se muestran y su cupo sigue descontado

#### Scenario: Invitación a registrarse
- **WHEN** el visitante ve sus resultados
- **THEN** ve una invitación a crear una cuenta para guardar el sitio, sin límite diario y con exportación

#### Scenario: Sin rastro en la cuenta
- **WHEN** el visitante crea una cuenta después de un análisis gratuito
- **THEN** su organización no contiene el sitio ni las sugerencias del análisis gratuito

### Requirement: Resultados por página
La tabla de resultados SHALL mostrar por cada página su URL, estado HTTP, title y description con su longitud, número de H1 y los problemas detectados: sin title, sin description, longitud fuera de rango, sin H1, varios H1 y estado distinto de 200. Al elegir una página MUST mostrarse su vista previa SERP.

#### Scenario: Página con problemas
- **WHEN** una página rastreada no tiene description y tiene dos H1
- **THEN** su fila muestra los problemas "sin description" y "varios H1"

#### Scenario: Vista previa
- **WHEN** el visitante elige una página de la tabla
- **THEN** ve su vista previa SERP con los indicadores de longitud
