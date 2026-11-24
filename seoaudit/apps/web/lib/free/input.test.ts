import { describe, expect, it } from 'vitest';
import { parseSiteInput } from './input';

describe('parseSiteInput', () => {
  it('acepta URLs http(s) y completa un dominio sin protocolo', () => {
    expect(parseSiteInput('https://www.ejemplo.com')).toEqual({ ok: true, url: 'https://www.ejemplo.com/' });
    expect(parseSiteInput('  ejemplo.com/es  ')).toEqual({ ok: true, url: 'https://ejemplo.com/es' });
    expect(parseSiteInput('http://ejemplo.com.mx')).toEqual({ ok: true, url: 'http://ejemplo.com.mx/' });
  });

  it('pide la URL si está vacía', () => {
    expect(parseSiteInput('   ')).toEqual({ ok: false, error: 'required' });
  });

  it.each(['ftp://ejemplo.com', 'mailto:hola@ejemplo.com', 'esto no es una url', 'localhost', 'https://'])('rechaza %j', (value) => {
    expect(parseSiteInput(value)).toEqual({ ok: false, error: 'format' });
  });
});
