import { describe, expect, it } from 'vitest';
import { languageCookie, languageFromAcceptLanguage, resolveLanguage } from './language';

describe('resolveLanguage', () => {
  it('la cookie gana sobre el navegador', () => {
    expect(resolveLanguage('es', 'en-US,en;q=0.9')).toBe('es');
  });

  it('sin cookie usa Accept-Language', () => {
    expect(resolveLanguage(undefined, 'en-US,en;q=0.9,es;q=0.8')).toBe('en');
  });

  it('una cookie inválida se ignora', () => {
    expect(resolveLanguage('fr', 'en')).toBe('en');
  });

  it('sin datos usa español', () => {
    expect(resolveLanguage(undefined, null)).toBe('es');
    expect(resolveLanguage(undefined, 'fr-FR,de;q=0.5')).toBe('es');
  });
});

describe('languageFromAcceptLanguage', () => {
  it('respeta el peso q', () => {
    expect(languageFromAcceptLanguage('fr;q=0.9,es;q=0.8,en;q=0.7')).toBe('es');
  });
});

describe('languageCookie', () => {
  it('persiste un año en todo el sitio', () => {
    expect(languageCookie('en')).toBe('language=en; path=/; max-age=31536000; samesite=lax');
  });
});
