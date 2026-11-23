# Proposal

## Why

Hoy un visitante solo puede conocer SEOAudit leyendo la landing: para probar cualquier herramienta tiene que crear una cuenta. Dejarle rastrear su propio sitio y ver sugerencias con IA sin registrarse le muestra el valor real del producto y le da un motivo concreto para crear la cuenta. Para que no se convierta en un servicio gratuito sin límites, con costes de Crawl4AI y Gemini, el uso se limita por día y se protege contra bots.

## What Changes

- **Nueva sección "Herramientas gratuitas"** en la landing (`/` y `/en`), entre "Herramientas" y "Ejemplos de uso", con su ancla `#free-tools`. Está pensada para añadir más herramientas después; esta versión incluye una: el análisis gratuito.
- **Crawler gratuito sin cuenta**: el visitante introduce la URL de su sitio, pasa una verificación anti-bots (Cloudflare Turnstile) y ve el progreso del rastreo. Puede rastrear hasta **20 páginas al día en total**, sumando todos sus rastreos; cada rastreo usa como máximo las páginas que le queden.
- **Resultados en la misma sección**: tabla por página con estado HTTP, title, description, H1 y problemas básicos detectados, y vista previa SERP de la página elegida.
- **Sugerencias con IA gratuitas**: desde los resultados, el visitante genera sugerencias de title, description y keywords para una página. Tiene su propio cupo de **20 páginas al día**, aparte del de rastreo.
- **Cupo visible**: la sección muestra cuántas páginas de rastreo y de sugerencias le quedan hoy, y explica cuándo se renueva.
- **Nada se guarda**: los resultados viven en la página y en memoria del servidor mientras dura la sesión de análisis; al recargar se pierden. Una invitación a crear cuenta explica que con ella se guardan el sitio y las sugerencias, sin límite diario y con exportación.
- **Protección del servicio**: solo URLs públicas `http`/`https` (se rechazan `localhost`, IPs privadas y puertos no estándar), solo páginas del mismo sitio, y un interruptor por variable de entorno para desactivar las herramientas gratuitas.

**Fuera de alcance**: guardar o transferir los resultados a una cuenta al registrarse, exportar desde el modo gratuito, renderizado con JavaScript (Playwright) en el modo gratuito, otras herramientas gratuitas y cambiar los límites o la autenticación del crawler y las sugerencias de los usuarios con cuenta.

## Capabilities

### New Capabilities
- `free-tools`: herramientas de SEOAudit disponibles sin cuenta desde la landing, con cupo diario por visitante, verificación anti-bots y resultados que no se guardan.

### Modified Capabilities
<!--
La sección nueva cambia el orden de la landing definido en `landing-page` (cambio landing-page-redesign, aún sin archivar): pasa de ocho a nueve secciones. Como esa capacidad todavía no está en openspec/specs/, no se puede escribir un delta MODIFIED; el requisito de la sección se recoge en `free-tools` y, al archivar ambos cambios, hay que actualizar el requisito "Estructura de secciones de la landing".
-->

## Impact

- **Nuevas rutas públicas** en `seoaudit/apps/web/app/api/free/`: inicio de rastreo, estado del trabajo, sugerencias y cupo. `middleware.ts` no las protege (no están en `PROTECTED_ROUTES`).
- **Nuevo módulo** `seoaudit/apps/web/lib/free/` con tests: validación de URL pública, identificación del visitante, cupo diario, verificación de Turnstile y sesión de análisis firmada.
- **Nueva colección Mongo** `freeusages` con el uso diario por visitante (hash de la IP, nunca la IP en claro), con caducidad automática.
- **Crawler** (`seoaudit/apps/crawler/src/index.ts`): opción para limitar el rastreo al mismo host que la URL inicial; el comportamiento por defecto no cambia.
- **Sugerencias**: se reutiliza el generador de `lib/generateSEOSuggestions.ts`, llamado desde la nueva ruta del servidor.
- **Landing**: nuevo componente cliente en `components/landing/`, textos en `lib/i18n/ui.ts` (ES/EN) y animación con los atributos `data-motion` del cambio `landing-gsap-animations`.
- **Variables de entorno nuevas**: `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` y `FREE_TOOLS_ENABLED`. En desarrollo se usan las claves de prueba de Cloudflare.
- **Script externo**: el widget de Turnstile se carga desde `challenges.cloudflare.com` solo al usar la herramienta.
