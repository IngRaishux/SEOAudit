# Spec Delta

## Purpose

Define un tope único de páginas por sitio, que se aplica igual al rastrear, al mostrar y al generar sugerencias, para acotar el costo del crawl y de la IA y preparar los límites por plan.

## ADDED Requirements

### Requirement: Tope de páginas por sitio
El sistema SHALL definir un único tope de páginas por sitio, hoy de 100, en un solo lugar de configuración. El crawl, la vista de páginas y la generación masiva de sugerencias SHALL usar ese mismo valor.

#### Scenario: Valor único
- **WHEN** se cambia el valor del tope
- **THEN** el crawl, la vista de páginas y "Generar todas" usan el nuevo valor sin otros cambios

### Requirement: El crawl respeta el tope
Un crawl de un sitio iniciado por un usuario autenticado SHALL rastrear y guardar como máximo el tope de páginas, tomando las primeras URLs en el orden del sitemap. SHALL registrar cuántas URLs tenía el sitemap antes de aplicar el tope.

#### Scenario: Sitemap mayor que el tope
- **WHEN** un usuario rastrea un sitio cuyo sitemap tiene 400 URLs y el tope es 100
- **THEN** se rastrean y guardan 100 páginas y el sitio registra 400 URLs en el sitemap

#### Scenario: Sitemap dentro del tope
- **WHEN** el sitemap tiene 60 URLs y el tope es 100
- **THEN** se rastrean las 60 URLs

### Requirement: El tope no se confunde con un crawl parcial
Llegar al tope SHALL NOT marcar el crawl como parcial. "Parcial" SHALL seguir significando que se agotó el tiempo antes de rastrear las URLs dentro del tope.

#### Scenario: Tope alcanzado sin agotar el tiempo
- **WHEN** el sitemap tiene 400 URLs, el tope es 100 y se rastrean las 100 a tiempo
- **THEN** el crawl termina como completado, no como parcial

### Requirement: Generar todas respeta el tope
La generación masiva de sugerencias de un sitio SHALL procesar como máximo el tope de páginas, y SHALL procesar las mismas páginas que muestra la tabla de páginas del sitio.

#### Scenario: Sitio antiguo con más páginas guardadas que el tope
- **WHEN** un sitio rastreado antes de este cambio tiene 400 páginas guardadas y el tope es 100
- **THEN** "Generar todas" crea sugerencias para 100 páginas, las mismas que lista la tabla

#### Scenario: Conteo en el diálogo
- **WHEN** el usuario abre el diálogo de "Generar todas" en ese sitio
- **THEN** el diálogo indica 100 páginas, no 400
