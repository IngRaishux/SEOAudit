import { describe, expect, it } from 'vitest';
import {
  alternateLandingLanguage,
  landingLanguageForPath,
  landingPath,
  languageCookie,
  languageFromAcceptLanguage,
  resolveLanguage,
} from './language';

describe('resolveLanguage', () => {
  it('la cookie gana sobre el navegador', () => {
    expect(resolveLanguage(null, 'es', 'en-US,en;q=0.9')).toBe('es');
  });

  it('sin cookie usa Accept-Language', () => {
    expect(resolveLanguage(null, undefined, 'en-US,en;q=0.9,es;q=0.8')).toBe('en');
  });

  it('una cookie inválida se ignora', () => {
    expect(resolveLanguage(null, 'fr', 'en')).toBe('en');
  });

  it('sin datos usa español', () => {
    expect(resolveLanguage(undefined, undefined, null)).toBe('es');
    expect(resolveLanguage(undefined, undefined, 'fr-FR,de;q=0.5')).toBe('es');
  });

  it('el idioma de la ruta gana sobre la cookie y el navegador', () => {
    expect(resolveLanguage('en', 'es', 'es-MX')).toBe('en');
    expect(resolveLanguage('es', 'en', 'en-US')).toBe('es');
  });

  it('un idioma de ruta inválido se ignora', () => {
    expect(resolveLanguage('fr', 'en', 'es')).toBe('en');
  });
});

describe('landingLanguageForPath', () => {
  it('reconoce las dos landings', () => {
    expect(landingLanguageForPath('/')).toBe('es');
    expect(landingLanguageForPath('/en')).toBe('en');
    expect(landingLanguageForPath('/en/')).toBe('en');
  });

  it('no confunde rutas que empiezan igual', () => {
    expect(landingLanguageForPath('/enterprise')).toBeNull();
    expect(landingLanguageForPath('/en/x')).toBeNull();
    expect(landingLanguageForPath('/login')).toBeNull();
    expect(landingLanguageForPath('/dashboard')).toBeNull();
  });
});

describe('landingPath', () => {
  it('devuelve la ruta de cada idioma', () => {
    expect(landingPath('es')).toBe('/');
    expect(landingPath('en')).toBe('/en');
  });
});

describe('alternateLandingLanguage', () => {
  it('sugiere inglés a un navegador en inglés que está en /', () => {
    expect(alternateLandingLanguage('es', 'en-US,en')).toBe('en');
  });

  it('sugiere español a un navegador en español que está en /en', () => {
    expect(alternateLandingLanguage('en', 'es-MX,es')).toBe('es');
  });

  it('no sugiere nada si el idioma coincide', () => {
    expect(alternateLandingLanguage('es', 'es')).toBeNull();
  });

  it('no sugiere nada con un idioma no soportado o sin header', () => {
    expect(alternateLandingLanguage('es', 'fr-FR')).toBeNull();
    expect(alternateLandingLanguage('en', null)).toBeNull();
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
