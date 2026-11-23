# Tasks

## 1. Setup de pruebas

- [x] 1.1 Agregar Vitest como devDependency y un script `test` en `apps/crawler` y `apps/web` (hoy no hay framework de pruebas); verificar que `npm test` corre una prueba trivial en ambos
- [x] 1.2 Agregar fixtures en `apps/web/lib/geo/__fixtures__/` con los JSON-LD de ejemplo de Las Brisas (Resort Acapulco y Organization) y una página HTML de muestra con footer, `tel:`, `mailto:`, redes y JSON-LD; verificar que las pruebas pueden importarlos

## 2. Captura en el crawl (site-crawl)

- [x] 2.1 Extender `PageSeo` y `parseSeoFromHtml` para extraer los bloques JSON-LD del HTML completo (crudo + parseado + error de parseo); verificar con pruebas de varios bloques, JSON inválido y página sin JSON-LD
- [x] 2.2 Extraer links (URL absoluta, texto, `isExternal`, incluidos `tel:` y `mailto:`) e imágenes (URL absoluta, alt) en `parseSeoFromHtml`; verificar con pruebas sobre la página de muestra
- [x] 2.3 Extraer el texto del cuerpo y del footer con truncado por constante y bandera `textTruncated`; verificar con pruebas de texto dentro y fuera del límite
- [x] 2.4 Pasar el HTML completo en la ruta de Playwright (`render.ts`) y en Crawl4AI (`extract.ts`) para que ambas rutas produzcan las nuevas señales; verificar con una prueba que use la misma página en ambas rutas de parseo
- [x] 2.5 Pedir `/llms.txt` una vez por sitio en `crawlSite` y agregarlo a `CrawlResult` (estado, content-type, contenido o error); verificar con pruebas usando un `fetch` simulado para 200, 404 y timeout
- [x] 2.6 Agregar los campos nuevos a `Page` (`jsonLd`, `bodyText`, `footerText`, `textTruncated`) y a `Site` (`llmsTxt`), y persistirlos en `persistCrawlResult` (incluidos los `links` e `images` que hoy se guardan vacíos); verificar crawleando un sitio en local y consultando los documentos en Mongo

## 3. Dominio GEO: URLs, reglas y JSON-LD (funciones puras)

- [x] 3.1 Implementar `lib/geo/url.ts`: detección de idiomas del sitio, normalización de idioma, asignación por prefijo más largo y derivación del `@id` sin idioma; verificar con pruebas de `/en/acapulco/rooms/`, `/acapulco/`, `/contacto/` y un slug de dos letras que no es idioma
- [x] 3.2 Implementar `lib/geo/rules.ts` con las reglas REQ/REC/EXTRA de `Organization`, `LocalBusiness` y la familia `LodgingBusiness`, y la jerarquía de subtipos; verificar con pruebas que `Resort` es compatible con `LodgingBusiness` y que las listas coinciden con el spec
- [x] 3.3 Implementar `lib/geo/jsonld.ts` para aplanar bloques y `@graph` en nodos y localizar la entidad por `@id` o tipo; verificar con pruebas de `@graph` y de varios bloques enlazados por `@id`

## 4. Perfil de negocio (business-profile)

- [x] 4.1 Crear el modelo `BusinessProfile` (índice único `organizationId + origin`, entidades internas/externas, `facts` y `texts` por idioma con `source`) y su repositorio; verificar con una prueba de que guardar dos perfiles para la misma org y el mismo origen falla
- [x] 4.2 Implementar la validación del perfil (tipos del catálogo, `parentKey` existente, scopes únicos, externas sin scope); verificar con pruebas de tipo no soportado y padre inexistente
- [x] 4.3 Implementar el pre-llenado determinista (tel, mailto, redes por dominio, coordenadas de Google Maps, `og:image`, valores del JSON-LD existente con prioridad); verificar con pruebas sobre los fixtures, incluido el caso de JSON-LD contra footer en conflicto
- [x] 4.4 Implementar la extracción literal con Gemini (dirección, amenidades, nombre alternativo) descartando valores cuya cita no aparezca en el texto; verificar con pruebas usando una respuesta simulada que incluye un valor inventado y otro literal
- [x] 4.5 Implementar la sugerencia de tipo de negocio y la detección de propiedades (agrupación por primer segmento normalizado + clasificación con Gemini, descartando prefijos que no estaban en la entrada); verificar con pruebas de cadena con `/blog/` y con una respuesta simulada que devuelve un prefijo inexistente
- [x] 4.6 Implementar la generación de textos marcados `generated` (descripción de entidad y de la organización de una cadena); verificar con una prueba que confirme la fuente `generated` y que la descripción de la cadena recibe las entidades confirmadas
- [x] 4.7 Crear las rutas `app/api/sites/[siteId]/profile` (GET/PUT) y `profile/suggest` (POST) con validación de `Membership` y resolución por origen del `Site` más reciente; verificar con llamadas locales: un re-crawl del mismo origen devuelve el mismo perfil y otra organización recibe 403

## 5. Revisión y completado de JSON-LD (structured-data)

- [x] 5.1 Implementar `lib/geo/audit.ts` con la cascada `missing → invalid → wrong-type → incomplete → inconsistent → ok`, EXTRA como sugerencia y omisión de niveles sin perfil; verificar con pruebas de cada escenario del spec usando los fixtures de Las Brisas
- [x] 5.2 Implementar la comparación de consistencia normalizada (teléfono, email, URL) y la detección a nivel de sitio de `@id` por idioma; verificar con pruebas de teléfono con distinto formato y del `@id` `/es/acapulco/#hotel`
- [x] 5.3 Implementar `lib/geo/merge.ts` (agregar faltantes, conservar propiedades no modeladas, conflictos para valores distintos, `@type` y `@id`, aplicación de resoluciones, diff); verificar con pruebas de `makesOffer` intacto, campo sin valor en el perfil y resolución `keep`/`profile`
- [x] 5.4 Implementar la generación de bloques nuevos y el agrupamiento por destino (global, por entidad, por página) con `url` y textos por idioma y referencias por `@id`; verificar con una prueba que el bloque de `/en/acapulco/` coincide con el escenario del spec
- [x] 5.5 Implementar la reescritura coherente de `@id` aceptado en todas las referencias de los bloques del sitio; verificar con una prueba de que `parentOrganization` se actualiza
- [x] 5.6 Crear las rutas `structured-data` (GET) y `structured-data/resolve` (POST) con validación de `Membership`; verificar con llamadas locales sobre un sitio crawleado con y sin perfil

## 6. llms.txt (llms-txt)

- [x] 6.1 Implementar en `lib/geo/llmsTxt.ts` el cálculo de estado (`missing`, `invalid`, `ok`, `unknown`) y el validador de formato (H1, secciones H2, links, contenido HTML, links rotos según el crawl); verificar con pruebas de cada escenario del spec
- [x] 6.2 Implementar el filtrado de páginas candidatas (status 200, canónicas, un idioma) y el renderizador desde `{title, summary, contact, sections[]}` sin datos factuales ausentes; verificar con pruebas de sitio bilingüe y perfil sin teléfono
- [x] 6.3 Implementar la selección y agrupación con Gemini por ids (descartando ids desconocidos) y las secciones por propiedad en cadenas; verificar con pruebas usando una respuesta simulada con un id inventado y una cadena de tres hoteles
- [x] 6.4 Crear la ruta `llms-txt` (GET estado, POST generar) con validación de `Membership`; verificar con llamadas locales sobre un sitio sin llms.txt

## 7. UI: pestaña GEO

- [x] 7.1 Agregar la pestaña GEO a `SiteDetailsTabs` con el aviso de "volver a crawlear" para sitios sin las nuevas señales y los textos en `lib/i18n/ui.ts`; verificar en el navegador con un sitio viejo y uno nuevo
- [x] 7.2 Construir la sección Perfil: tipo de negocio sugerido, entidades sugeridas para confirmar/descartar, formulario de `facts` y `texts` por idioma con la fuente visible y los valores `extracted`/`generated` resaltados; verificar en el navegador el flujo completo con una cadena
- [x] 7.3 Construir la sección Datos estructurados: reporte por página y hallazgos del sitio, bloque propuesto con diff, selector de conflictos, copiar/descargar e indicación de destino; verificar en el navegador completando una página con conflictos
- [x] 7.4 Construir la sección llms.txt: estado y problemas, generación, vista previa, copiar y descargar como `llms.txt`; verificar en el navegador que el archivo descargado coincide con la vista previa

## 8. Verificación de integración

- [ ] 8.1 Recorrer de punta a punta con un sitio de cadena real (crawl → perfil → revisión → completar → llms.txt) y confirmar que ningún dato factual del resultado carece de fuente en el perfil; documentar el resultado en el PR
- [x] 8.2 Correr `npm test` y `npm run build` en `apps/crawler` y `apps/web` y verificar que pasan; verificar que ESLint no reporta errores en los archivos creados o modificados por este change (el lint completo tiene deuda previa y el crawler no tiene configuración de ESLint, fuera de alcance)
