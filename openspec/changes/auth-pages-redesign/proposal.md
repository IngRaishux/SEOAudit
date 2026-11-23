# Proposal

## Why

Tras el rediseño de la landing, las páginas de inicio de sesión (`/login`) y registro (`/register`) son el siguiente paso de quien quiere usar la aplicación, pero siguen con el diseño anterior: formulario suelto sin tarjeta, colores fijos fuera del tema daisyUI (`zinc`, `blue-600`) y textos mezclados en inglés y español ("Sign In", "Sign Up", "(optional)", placeholders en inglés). Además tienen dos fallos visibles: la confirmación de contraseña se rotula "Contraseña (Cerrar)" y, cuando las contraseñas no coinciden, el error dice "Este campo es requerido".

## What Changes

- **Diseño en pantalla dividida** para `/login` y `/register`: en pantallas grandes, un panel de marca (titular y beneficios de la aplicación, con el estilo de la landing) junto al formulario en una tarjeta; en móvil solo el formulario.
- **Formularios con componentes daisyUI 4 y colores del tema**: tarjeta, campos con etiqueta, botón principal, separador "o" antes de "Continuar con Google" y enlace para cambiar entre inicio de sesión y registro.
- **Textos completos en el idioma activo**: títulos, subtítulos, etiquetas, marcas de campo opcional, placeholders y título de la pestaña del navegador en español o inglés.
- **Validación propia de la aplicación**: hoy los formularios dependen de la validación nativa del navegador (`required`, `type="email"`), cuyo globo cambia de diseño e idioma según el navegador, y de toasts que aparecen lejos del campo. Pasan a validarse con reglas propias y mensajes traducidos:
  - Errores de cada campo debajo del campo, con el campo marcado en rojo, al enviar y, después del primer intento, mientras el usuario corrige.
  - Errores del envío (credenciales inválidas, correo ya registrado, error del servidor) en un aviso dentro de la tarjeta, o en el campo correspondiente cuando aplica.
  - Sin globos nativos del navegador ni toasts en estos formularios.
- **Reglas**: nombre, correo, contraseña y confirmación obligatorios en el registro; correo y contraseña obligatorios en el inicio de sesión; formato de correo válido; contraseña de al menos 6 caracteres; confirmación igual a la contraseña.
- **Correcciones**: etiqueta "Confirmar contraseña" y mensaje "Las contraseñas no coinciden" (hoy dice "Este campo es requerido").
- **Ayudas del navegador**: atributos `autocomplete` adecuados (nombre, correo, organización, contraseña actual y nueva).

El flujo no cambia: misma llamada a `/api/register`, mismo inicio de sesión con credenciales o Google y misma redirección a `/organizations`. La única adición en la API es un campo `code` en las respuestas de error de `/api/register` para poder traducirlas; el campo `error` actual se mantiene.

**Fuera de alcance**: recuperación de contraseña, verificación de correo, nuevos proveedores de acceso, cambios en NextAuth, indicador de fortaleza de contraseña y versiones por URL (`/en/login`) de estas páginas.

## Capabilities

### New Capabilities
- `auth-pages`: presentación de las páginas públicas de inicio de sesión y registro: estructura, textos en el idioma activo, campos y validación de los formularios con mensajes propios de la aplicación.

### Modified Capabilities
<!-- No hay specs existentes en openspec/specs/. -->

## Impact

- `seoaudit/apps/web/app/login/page.tsx` y `app/register/page.tsx`: nueva estructura de página y título traducido.
- `seoaudit/apps/web/components/LoginForm.tsx` y `components/RegisterForm.tsx`: rediseño visual, textos traducidos, validación propia y correcciones.
- Nuevos componentes compartidos en `seoaudit/apps/web/components/auth/` (diseño de página y campo con mensaje de error).
- Nuevas reglas de validación en `seoaudit/apps/web/lib/auth/`, con tests.
- `seoaudit/apps/web/app/api/register/route.ts`: campo `code` adicional en las respuestas de error (compatible con los clientes actuales).
- `seoaudit/apps/web/lib/i18n/ui.ts`: nuevas claves en el espacio `auth` (ES y EN).
- Sin cambios en la base de datos ni en las dependencias.
