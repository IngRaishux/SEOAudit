// Reglas de validación de los formularios de acceso. Devuelven, por campo inválido,
// la clave i18n del mensaje; un objeto vacío significa que el formulario es válido.

export const PASSWORD_MIN_LENGTH = 6;

// Solo descarta errores evidentes; la validación definitiva la hace el servidor
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type FieldErrors<Field extends string> = Partial<Record<Field, string>>;

export interface LoginValues {
  email: string;
  password: string;
}

export interface RegistrationValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

function emailError(email: string): string | undefined {
  const value = email.trim();
  if (!value) return 'validation.required';
  if (!EMAIL_PATTERN.test(value)) return 'validation.invalidEmail';
  return undefined;
}

function withoutEmpty<Field extends string>(errors: Record<Field, string | undefined>): FieldErrors<Field> {
  return Object.fromEntries(Object.entries(errors).filter(([, v]) => v !== undefined)) as FieldErrors<Field>;
}

export function validateLogin({ email, password }: LoginValues): FieldErrors<keyof LoginValues> {
  return withoutEmpty({
    email: emailError(email),
    password: password ? undefined : 'validation.required',
  });
}

export function validateRegistration({
  name,
  email,
  password,
  confirmPassword,
}: RegistrationValues): FieldErrors<keyof RegistrationValues> {
  return withoutEmpty({
    name: name.trim() ? undefined : 'validation.required',
    email: emailError(email),
    password: !password
      ? 'validation.required'
      : password.length < PASSWORD_MIN_LENGTH
        ? 'auth.passwordMinLength'
        : undefined,
    confirmPassword: !confirmPassword
      ? 'validation.required'
      : confirmPassword !== password
        ? 'auth.passwordsDoNotMatch'
        : undefined,
  });
}
