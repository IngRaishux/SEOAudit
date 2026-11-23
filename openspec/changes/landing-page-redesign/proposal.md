# Proposal

## Why

La página de inicio (`/`) solo muestra tres tarjetas genéricas y no refleja lo que la aplicación ya hace: rastreo, vista previa SERP, auditoría de meta tags, sugerencias con IA, generación masiva y la pestaña GEO (perfil de negocio, JSON-LD y `llms.txt`). Además está fija en inglés, ignora el sistema i18n y usa colores sueltos (`zinc`, `blue-600`) en lugar del tema daisyUI que usa el resto de la app. Queremos captar público hispanohablante y angloparlante, así que la landing necesita una versión por idioma con su propia URL.

## What Changes

- **Rediseño de la landing** con componentes de daisyUI 4 y el tema activo (`cupcake`), organizada en secciones: hero, cifras, "cómo funciona", herramientas, ejemplos de uso, preguntas frecuentes, llamada final a la acción y pie de página.
- **Sección de herramientas** que presenta cada función real de la aplicación con icono, nombre y descripción breve.
- **Ejemplos de uso con maquetas** construidas con componentes existentes (la vista previa SERP real alimentada con datos de ejemplo, bloques de código de JSON-LD y `llms.txt`, comparación antes/después de un title, ventana de organizaciones). Sin capturas de pantalla.
- **Llamadas a la acción según la sesión**: visitantes ven "Empezar gratis" / "Iniciar sesión"; usuarios con sesión ven "Ir al rastreador" / "Ver panel".
- **Rutas por idioma para la landing**: `/` en español y `/en` en inglés. En esas rutas el idioma lo decide la URL (por encima de la cookie), la visita actualiza la cookie de idioma para que el resto de la app continúe en ese idioma, hay un selector ES/EN con enlaces reales y un aviso discreto cuando el navegador prefiere el otro idioma. No hay redirecciones automáticas.
- **Textos traducidos** en un nuevo espacio `home` del diccionario i18n (ES y EN).

**Fuera de alcance**:
- SEO de la propia landing: metadata por idioma, Open Graph, `robots.txt`, `sitemap.xml`, `canonical`, `hreflang` y JSON-LD. Se pospone hasta tener dominio de producción.
- Migración a daisyUI 5 / Tailwind 4 y la corrección de las variables de tema personalizadas en `tailwind.config.ts`.
- Rutas por idioma en el resto de la aplicación (dashboard, sitios, configuración), que siguen usando la cookie.

## Capabilities

### New Capabilities
- `landing-page`: contenido y estructura de la página pública de inicio: secciones, catálogo de herramientas, ejemplos de uso con maquetas y llamadas a la acción según la sesión.
- `landing-i18n-routing`: versiones de la landing por idioma con URL propia (`/` y `/en`), prioridad de la URL sobre la cookie, sincronización de la cookie, selector de idioma y aviso de versión alternativa.

### Modified Capabilities
<!-- No hay specs existentes en openspec/specs/. -->

## Impact

- `seoaudit/apps/web/app/page.tsx`: se reescribe; la landing pasa a Server Component con islas cliente mínimas.
- Nueva ruta `seoaudit/apps/web/app/en/page.tsx` que reutiliza la misma landing con idioma inglés.
- Nuevos componentes de la landing en `seoaudit/apps/web/components/landing/`.
- `seoaudit/apps/web/middleware.ts`: marca el idioma de la landing según la ruta y actualiza la cookie; `/en` se declara pública.
- `seoaudit/apps/web/app/layout.tsx` y `lib/i18n/language.ts`: el idioma indicado por la ruta tiene prioridad sobre la cookie.
- `seoaudit/apps/web/components/Header.tsx`: selector ES/EN visible en la landing.
- `seoaudit/apps/web/lib/i18n/ui.ts`: nuevo espacio `home` en ES y EN.
- `components/SERPPreview.tsx` se reutiliza sin cambios de comportamiento.
- Sin cambios en la API, la base de datos ni las dependencias.
