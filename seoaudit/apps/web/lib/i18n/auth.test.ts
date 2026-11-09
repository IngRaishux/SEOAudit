import { describe, expect, it } from 'vitest';
import { translations } from './ui';

function leafPaths(value: unknown, prefix = ''): string[] {
  if (value !== null && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, child]) =>
      leafPaths(child, prefix ? `${prefix}.${key}` : key)
    );
  }
  return [prefix];
}

describe('textos de inicio de sesión y registro (auth)', () => {
  it('español e inglés tienen exactamente las mismas claves', () => {
    expect(leafPaths(translations.en.auth).sort()).toEqual(leafPaths(translations.es.auth).sort());
  });

  it.each(['es', 'en'] as const)('ningún texto en %s está vacío', (lang) => {
    for (const value of Object.values(translations[lang].auth)) {
      expect(typeof value).toBe('string');
      expect(value.trim()).not.toBe('');
    }
  });

  it.each(['es', 'en'] as const)('en %s existen los textos que usan las validaciones', (lang) => {
    const { auth, validation } = translations[lang];
    for (const text of [auth.passwordsDoNotMatch, auth.passwordMinLength, auth.userAlreadyExists, auth.invalidCredentials, validation.required, validation.invalidEmail]) {
      expect(text.length).toBeGreaterThan(0);
    }
  });
});
