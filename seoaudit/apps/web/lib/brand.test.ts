import { describe, expect, it } from 'vitest';
import { BRAND_NAME, siteUrl } from './brand';

describe('brand', () => {
  it('el nombre canónico es SEObab', () => {
    expect(BRAND_NAME).toBe('SEObab');
  });

  it('sin configuración usa https://seobab.com', () => {
    expect(siteUrl(undefined).href).toBe('https://seobab.com/');
  });

  it('una cadena vacía también usa producción', () => {
    expect(siteUrl('').href).toBe('https://seobab.com/');
    expect(siteUrl('   ').href).toBe('https://seobab.com/');
  });

  it('respeta la URL configurada', () => {
    expect(siteUrl('https://preview.ejemplo.dev').href).toBe('https://preview.ejemplo.dev/');
  });
});
