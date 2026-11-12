# Design

## Context

Ver proposal.md (Why). Estado actual relevante:

- `app/login/page.tsx` y `app/register/page.tsx` son Server Components mínimos que pintan un `h1` fijo en inglés y el formulario. Su `metadata` también está fija en inglés.
- `LoginForm` y `RegisterForm` son Client Components con la lógica de acceso (credenciales con `signIn`, registro con `POST /api/register` y Google). Ya obtienen el idioma con `useCurrentLanguage()` y usan `Input` y `Button` de `@seo-optimizer/ui`, que aceptan atributos nativos (`autoComplete`, `minLength`) e `Input` ya incluye el botón para mostrar u ocultar la contraseña.
- El idioma del servidor se resuelve en `app/layout.tsx` con `resolveLanguage(header de la landing, cookie, Accept-Language)`. En `/login` y `/register` no hay header de landing, así que manda la cookie.
- La landing ya define en `home` los textos del titular y de las herramientas, reutilizables en el panel de marca.
- El proyecto usa daisyUI 4 + Tailwind 3 (ver el cambio `landing-page-redesign`).

## Goals / Non-Goals

**Goals:**
- Un único diseño de página compartido por inicio de sesión y registro.
- Validación definida por la aplicación: misma apariencia en cualquier navegador, mensajes traducidos junto al campo.
- Reglas de validación aisladas en funciones puras con tests.
- La lógica de acceso (NextAuth, `/api/register`, redirecciones) queda igual.

**Non-Goals:**
- Sustituir los componentes `Input`/`Button` del paquete compartido.
- Añadir una librería de formularios o de esquemas en el cliente: dos formularios pequeños no lo justifican.
- Validar en el servidor reglas nuevas: `/api/register` sigue con su esquema Zod actual.

## Decisions

### 1. `AuthLayout` compartido, renderizado en el servidor

`components/auth/AuthLayout.tsx` (Server Component) recibe `lang`, `title`, `subtitle` y el formulario como `children`:

```
lg y más (>= 1024 px)                     menos de lg
+------------------+-------------------+  +-------------------+
| panel de marca   |  card             |  |  card             |
| (hidden lg:flex) |   title/subtitle  |  |   title/subtitle  |
|  titular home    |   {children}      |  |   {children}      |
|  3 herramientas  |                   |  |                   |
+------------------+-------------------+  +-------------------+
```

- Contenedor `grid lg:grid-cols-2 min-h-[calc(100vh-4rem)]` (la cabecera mide 4rem).
- Panel de marca: `hidden lg:flex`, fondo con el degradado de la landing (`from-base-200 to-base-100`) o `bg-primary`; usa `home.hero.title`, `home.hero.subtitle` y tres herramientas de `home.tools.items` (rastreo, sugerencias con IA, GEO) con sus iconos.
- Tarjeta: `card bg-base-100 border border-base-300 shadow-xl w-full max-w-md` dentro de `card-body`.

Los títulos y subtítulos de las tarjetas los pasa la página a `AuthLayout`; los formularios no repiten encabezados.

Alternativa descartada: cada página con su propio marcado; duplicaría el panel y se desalinearían con el tiempo.

### 2. Idioma resuelto en el servidor con un helper común

Nuevo `getRequestLanguage()` en `lib/i18n/server.ts`, que lee `headers()` y `cookies()` y llama a `resolveLanguage` como hoy hace el layout. `app/layout.tsx` pasa a usarlo para no duplicar la lógica. Las páginas lo usan para:
- `generateMetadata()` → título de la pestaña traducido (`auth.loginTitle` / `auth.registerTitle`).
- Pasar `lang`, `title` y `subtitle` a `AuthLayout`.

Los formularios siguen tomando el idioma del cliente (`useCurrentLanguage`), que coincide con el del servidor porque `LanguageProvider` arranca con él.

### 3. Formularios con estructura daisyUI 4

- Cada campo se pinta con un componente `components/auth/FormField.tsx`: `label.form-control w-full` con `div.label > span.label-text` (y `span.label-text-alt` "Opcional"/"Optional" en organización), el `Input` compartido y, debajo, `div.label > span.label-text-alt.text-error` con el error o, si no hay error, la ayuda del campo (p. ej. "Mínimo 6 caracteres" en la contraseña del registro). Con error, el `Input` recibe `hasError` (borde de error) y `aria-invalid`, y su `aria-describedby` apunta al mensaje.
- Botón principal: `Button` de `@seo-optimizer/ui` (variante primaria, ancho completo, `isLoading`).
- Separador: `div.divider` con el texto "o"/"or".
- Google: `btn btn-outline w-full` con `RiGoogleFill`; sustituye las clases `bg-white`/`zinc`.
- Enlace para cambiar de página: `link font-semibold` con colores del tema (sin `blue-600`).
- Se eliminan todos los colores `zinc`/`blue` de estos archivos.

### 4. Validación propia, sin la nativa del navegador

**Reglas** en `lib/auth/validation.ts`, funciones puras que devuelven un objeto `{ campo: claveI18n }` solo con los campos inválidos:

```
validateLogin({ email, password })
  email:    requerido -> formato
  password: requerido

validateRegistration({ name, email, password, confirmPassword })
  name:            requerido (tras recortar espacios)
  email:           requerido -> formato
  password:        requerido -> mínimo 6
  confirmPassword: requerido -> igual a password
  (organizationName: sin reglas, opcional)
```

Claves: `validation.required` y `validation.invalidEmail` (ya existen), `auth.passwordMinLength` (ya existe) y `auth.passwordsDoNotMatch` (nueva). El formato de correo usa una expresión sencilla (`algo@algo.dominio`); la validación definitiva sigue siendo la del servidor.

**Comportamiento en el formulario** (estado local, sin librerías):

```
[sin intentar] --submit--> validar
                             | errores  -> mostrar todos, foco al 1.er campo inválido,
                             |             pasar a [intentado]; no se llama al servidor
                             | sin errores -> enviar
[intentado] --cada cambio--> revalidar y actualizar mensajes
```

- `<form noValidate>` y sin `required`, `minLength` ni `pattern` en los campos: el navegador no muestra sus globos. Se mantiene `type="email"` por el teclado móvil; con `noValidate` no dispara la validación nativa.
- Se eliminan los `toastError` de ambos formularios.

Alternativas descartadas:
- *Validación nativa con estilos propios (`:invalid`, `setCustomValidity`)*: el globo del navegador sigue apareciendo y su diseño no se puede controlar.
- *React Hook Form + Zod*: dependencia nueva para cinco campos; las funciones puras son más fáciles de testear aquí.

### 5. Errores del envío dentro de la tarjeta

- Un `div.alert.alert-error` con `role="alert"` encima de los campos muestra los errores que no pertenecen a un campo: credenciales inválidas (login) y error genérico del servidor (`errors.serverError`).
- `/api/register` añade `code` a sus respuestas de error sin quitar `error`: `EMAIL_IN_USE` (400), `VALIDATION_ERROR` (400) y `SERVER_ERROR` (500). `RegisterForm` traduce `EMAIL_IN_USE` a `auth.userAlreadyExists` bajo el campo de correo y el resto al aviso genérico. Así no se depende del texto en inglés del servidor.
- El aviso se limpia al volver a enviar.

### 6. Autocompletado

| Campo | `autoComplete` |
|---|---|
| Nombre | `name` |
| Correo | `email` |
| Organización | `organization` |
| Contraseña (login) | `current-password` |
| Contraseña y confirmación (registro) | `new-password` |

### 7. Textos nuevos en `auth` (ES/EN)

`loginTitle`, `loginSubtitle`, `registerTitle`, `registerSubtitle`, `confirmPassword`, `optional`, `passwordHint`, `passwordsDoNotMatch`, `or`, `namePlaceholder`, `emailPlaceholder`, `organizationPlaceholder`. Un test comprueba que el espacio `auth` tiene las mismas claves en ambos idiomas y ningún valor vacío.

## Risks / Trade-offs

- [El panel de marca repite contenido de la landing] → Es intencional para reforzar la propuesta de valor en el momento de registrarse; usa las mismas claves `home`, así que no se desalinea.
- [La expresión de correo del cliente es más permisiva que un validador completo] → Solo evita errores evidentes; el servidor (Zod) sigue rechazando correos inválidos y ese caso cae en el aviso genérico.
- [Los gestores de contraseñas rellenan campos sin eventos de teclado] → La revalidación usa `onChange`, que los gestores sí disparan; y antes del primer envío no se muestran errores.
- [El color primario de `cupcake` es claro y un enlace `link-primary` sobre blanco tendría poco contraste] → Los enlaces usan el color de texto del tema con subrayado al pasar el cursor.

## Migration Plan

Despliegue normal, sin datos afectados. El campo `code` de `/api/register` es aditivo, así que los clientes actuales siguen funcionando. Para revertir, basta con restaurar las páginas, formularios y la ruta de registro anteriores y eliminar `components/auth/` y `lib/auth/validation.ts`.
