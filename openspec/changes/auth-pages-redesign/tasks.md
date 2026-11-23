# Tasks

Rutas relativas a `seoaudit/apps/web/`.

## 1. Base: idioma, textos, reglas y API

- [x] 1.1 Añadir `getRequestLanguage()` en `lib/i18n/server.ts` (headers + cookie + Accept-Language vía `resolveLanguage`) y usarlo en `app/layout.tsx`; verificar con `npm test` y comprobando con `curl` que `/` sigue en español, `/en` en inglés y `/login` con cookie `en` en inglés
- [x] 1.2 Añadir en `lib/i18n/ui.ts` (ES y EN) las claves de `auth` del diseño (`loginTitle`, `loginSubtitle`, `registerTitle`, `registerSubtitle`, `confirmPassword`, `optional`, `passwordHint`, `passwordsDoNotMatch`, `or`, `namePlaceholder`, `emailPlaceholder`, `organizationPlaceholder`) y un test `lib/i18n/auth.test.ts` que compruebe claves iguales en ambos idiomas y sin valores vacíos; verificar con `npm test`
- [x] 1.3 Crear `lib/auth/validation.ts` con `validateLogin` y `validateRegistration` (reglas y orden del diseño, devuelven `{ campo: claveI18n }`) y `lib/auth/validation.test.ts` que cubra: campos vacíos, correo con formato inválido (`ana@`), nombre solo con espacios, contraseña de 4 caracteres, confirmación distinta, organización vacía sin error y formularios válidos sin errores; verificar con `npm test`
- [x] 1.4 En `app/api/register/route.ts`, añadir `code` (`EMAIL_IN_USE`, `VALIDATION_ERROR`, `SERVER_ERROR`) a las respuestas de error manteniendo `error` y los códigos HTTP; verificar con `curl` que registrar un correo existente devuelve 400 con `code: "EMAIL_IN_USE"` y que un registro válido sigue devolviendo 201

## 2. Componentes compartidos

- [x] 2.1 Crear `components/auth/AuthLayout.tsx` (Server Component): grid de dos columnas desde `lg` con panel de marca (`home.hero.title`, `home.hero.subtitle` y tres herramientas con icono) oculto por debajo de `lg`, y tarjeta con título, subtítulo y `children`; sin colores fuera del tema
- [x] 2.2 Crear `components/auth/FormField.tsx`: etiqueta (`form-control`), marca opcional, `Input` compartido con `hasError`, `aria-invalid` y `aria-describedby`, y debajo el error (`text-error`) o la ayuda del campo

## 3. Páginas y formularios

- [x] 3.1 Reescribir `app/login/page.tsx` con `generateMetadata` traducido y `AuthLayout`; rediseñar `components/LoginForm.tsx` con `<form noValidate>`, `FormField` sin `required`, `validateLogin` con el flujo del diseño (errores al enviar, foco al primer inválido, revalidación tras el primer intento), aviso `alert-error` dentro de la tarjeta para credenciales inválidas y error del servidor, `divider` "o", botón de Google `btn-outline`, enlace a `/register`, `autoComplete` (`email`, `current-password`), sin toasts ni clases `zinc`/`blue`; verificar en el navegador que enviar vacío no muestra globos nativos y sí los mensajes propios, que un login correcto lleva a `/organizations` y uno incorrecto muestra el aviso en la tarjeta
- [x] 3.2 Reescribir `app/register/page.tsx` igual que el login; rediseñar `components/RegisterForm.tsx` con los cinco campos vía `FormField`, "Opcional" en organización, ayuda de longitud bajo la contraseña, etiqueta "Confirmar contraseña", `<form noValidate>`, `validateRegistration` con el mismo flujo, `EMAIL_IN_USE` bajo el campo de correo y el resto en el aviso genérico, `autoComplete` (`name`, `email`, `organization`, `new-password`) y sin toasts; verificar en el navegador que contraseñas distintas muestran "Las contraseñas no coinciden" bajo la confirmación sin llamar a `/api/register`, que un correo existente muestra "Este usuario ya existe" bajo el correo y que un registro válido lleva a `/organizations`

## 4. Verificación integral

- [x] 4.1 Recorrer los escenarios de `specs/auth-pages/spec.md` en el navegador (Chromium, Firefox y WebKit de Playwright): mismos mensajes y estilo en los tres, sin globos nativos, foco al primer campo inválido, corrección en vivo tras el primer envío, pantalla dividida a 1280 px, solo tarjeta y sin scroll horizontal a 320 y 360 px, textos y título de pestaña en inglés con la cookie `en` y en español con `es`, y tema `dark` sin colores fuera del tema
- [x] 4.2 Ejecutar `npm test`, `npm run lint` y `npm run build` en `apps/web` y verificar que terminan sin errores

## Workflow follow-up

- Archivar el cambio cuando se haya revisado y fusionado el PR.
