import { describe, expect, it } from 'vitest';
import { validateLogin, validateRegistration } from './validation';

const validRegistration = {
  name: 'Ana García',
  email: 'ana@example.com',
  password: 'secreto1',
  confirmPassword: 'secreto1',
};

describe('validateLogin', () => {
  it('exige correo y contraseña', () => {
    expect(validateLogin({ email: '', password: '' })).toEqual({
      email: 'validation.required',
      password: 'validation.required',
    });
  });

  it('rechaza un correo con formato inválido', () => {
    expect(validateLogin({ email: 'ana@', password: 'x' })).toEqual({ email: 'validation.invalidEmail' });
  });

  it('no valida la longitud en el inicio de sesión', () => {
    expect(validateLogin({ email: 'ana@example.com', password: 'x' })).toEqual({});
  });
});

describe('validateRegistration', () => {
  it('un formulario válido no tiene errores', () => {
    expect(validateRegistration(validRegistration)).toEqual({});
  });

  it('exige todos los campos salvo la organización', () => {
    expect(validateRegistration({ name: '', email: '', password: '', confirmPassword: '' })).toEqual({
      name: 'validation.required',
      email: 'validation.required',
      password: 'validation.required',
      confirmPassword: 'validation.required',
    });
  });

  it('un nombre solo con espacios cuenta como vacío', () => {
    expect(validateRegistration({ ...validRegistration, name: '   ' })).toEqual({ name: 'validation.required' });
  });

  it.each(['ana@', 'ana', 'ana@example', 'ana @example.com'])('rechaza el correo "%s"', (email) => {
    expect(validateRegistration({ ...validRegistration, email })).toEqual({ email: 'validation.invalidEmail' });
  });

  it('exige al menos 6 caracteres de contraseña', () => {
    expect(validateRegistration({ ...validRegistration, password: '1234', confirmPassword: '1234' })).toEqual({
      password: 'auth.passwordMinLength',
    });
  });

  it('la confirmación debe coincidir', () => {
    expect(validateRegistration({ ...validRegistration, confirmPassword: 'otra-cosa' })).toEqual({
      confirmPassword: 'auth.passwordsDoNotMatch',
    });
  });
});
