# Spec Delta

## Purpose

Define las animaciones de entrada y de scroll de la landing pública (`/` y `/en`), que dan un aspecto más cuidado sin ocultar contenido ni molestar a quien prefiere menos movimiento.

## ADDED Requirements

### Requirement: Entrada del hero
Al cargar la landing con el movimiento permitido, los elementos del hero SHALL aparecer de forma escalonada en este orden: insignia, título, subtítulo, botones y maqueta del navegador. La entrada MUST terminar en menos de 1,5 segundos.

#### Scenario: Carga de la página
- **WHEN** un visitante abre `/` o `/en` sin preferencia de movimiento reducido
- **THEN** los elementos del hero aparecen uno tras otro con un desplazamiento vertical corto
- **AND** en menos de 1,5 segundos todos están visibles y en su posición final

### Requirement: Aparición al hacer scroll
Con el movimiento permitido, los encabezados de sección, los pasos de "cómo funciona", las tarjetas de herramientas, el bloque de ejemplos de uso, las preguntas frecuentes y la llamada final SHALL aparecer al entrar en la ventana. Los elementos de una misma lista MUST aparecer escalonados y cada animación MUST ejecutarse una sola vez.

#### Scenario: El visitante baja hasta las herramientas
- **WHEN** la sección de herramientas entra en la ventana
- **THEN** las tarjetas aparecen escalonadas

#### Scenario: El visitante vuelve a subir
- **WHEN** el visitante sube y vuelve a bajar a una sección ya animada
- **THEN** la sección sigue visible y no se repite su animación

#### Scenario: Salto a un ancla
- **WHEN** el visitante entra a una sección con un enlace `#tools`, `#how-it-works` o `#faq`
- **THEN** esa sección termina visible aunque se hayan saltado las anteriores

### Requirement: Contadores en las cifras
Con el movimiento permitido, las cifras con valor numérico SHALL contar desde 0 hasta su valor al entrar en la ventana. Las cifras no numéricas MUST mostrarse con su texto sin contar. El valor final MUST ser idéntico al texto del HTML del servidor.

#### Scenario: Cifras numéricas
- **WHEN** las cifras entran en la ventana
- **THEN** "7", "2" y "4" cuentan desde 0 y terminan en su valor

#### Scenario: Cifra de texto
- **WHEN** las cifras entran en la ventana
- **THEN** "JSON-LD" aparece sin conteo

### Requirement: Movimiento reducido
Si el sistema indica `prefers-reduced-motion: reduce`, la landing MUST mostrar todo el contenido en su estado final desde el principio, sin desplazamientos, desvanecidos ni contadores.

#### Scenario: Preferencia de movimiento reducido
- **WHEN** un visitante con movimiento reducido abre la landing y la recorre
- **THEN** todo el contenido está visible en su posición final en todo momento
- **AND** las cifras muestran su valor final desde el principio

### Requirement: Contenido disponible sin animaciones
Las animaciones SHALL ser una mejora: todo el texto MUST seguir en el HTML del servidor y visible sin JavaScript. Si la biblioteca de animación no llega a ejecutarse, el contenido MUST quedar visible en menos de 3 segundos.

#### Scenario: Sin JavaScript
- **WHEN** se abre la landing con JavaScript desactivado
- **THEN** todas las secciones se ven completas y en su posición final

#### Scenario: Fallo al cargar las animaciones
- **WHEN** el script de animaciones no se ejecuta
- **THEN** el hero se ve completo en menos de 3 segundos

### Requirement: Animaciones sin efectos secundarios
Las animaciones MUST NOT causar desplazamiento horizontal desde 360 px de ancho, MUST NOT cambiar el comportamiento de los controles (pestañas, preguntas plegables, enlaces y botones) y MUST NOT persistir al salir de la landing.

#### Scenario: Pantalla de móvil
- **WHEN** la landing se anima en un viewport de 360 px
- **THEN** no aparece barra de desplazamiento horizontal en ningún momento

#### Scenario: Navegación a otra página
- **WHEN** el visitante pasa de la landing a `/login` o de `/` a `/en`
- **THEN** no quedan animaciones ni observadores de scroll activos de la página anterior, y la nueva landing se anima desde el principio

#### Scenario: Hover de las tarjetas
- **WHEN** una tarjeta de herramienta ya apareció y el visitante pasa el cursor
- **THEN** la tarjeta se eleva igual que antes del cambio
