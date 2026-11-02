import { describe, expect, it } from 'vitest';
import { candidatePages, checkLlmsTxt, generateLlmsTxt, renderLlmsTxt, selectSections, validateLlmsTxtFormat } from './llmsTxt';
import type { ProfileInput } from './profile';
import { chainPages } from './__fixtures__/pages';
import { brisasProfile } from './__fixtures__/profile';

const origin = 'https://www.lasbrisashotels.com.mx';
const url = `${origin}/llms.txt`;
const capture = (over: Partial<Parameters<typeof checkLlmsTxt>[0] & object>) => ({
  url,
  status: 200,
  contentType: 'text/plain',
  content: '# Sitio\n',
  error: null,
  ...over,
});

describe('checkLlmsTxt', () => {
  it('404 es missing', () => {
    expect(checkLlmsTxt(capture({ status: 404, content: null }), []).status).toBe('missing');
  });

  it('HTML servido por un rewrite es invalid', () => {
    const report = checkLlmsTxt(capture({ contentType: 'text/html; charset=utf-8', content: '<!doctype html><html>' }), []);
    expect(report.status).toBe('invalid');
    expect(report.problems[0]).toMatch(/HTML/);
  });

  it('timeout es unknown y sugiere volver a crawlear', () => {
    const report = checkLlmsTxt(capture({ status: null, content: null, error: 'aborted' }), []);
    expect(report.status).toBe('unknown');
    expect(report.problems[0]).toMatch(/vuelve a crawlear/);
  });

  it('falta el H1', () => {
    const report = checkLlmsTxt(capture({ content: '## Hoteles\n- [Acapulco](/acapulco/)\n' }), []);
    expect(report).toMatchObject({ status: 'invalid', problems: ['Falta el título H1 al inicio del archivo'] });
  });

  it('sin ningún link es invalid', () => {
    expect(checkLlmsTxt(capture({ content: '# Sitio\n\n> Resumen\n' }), []).problems).toEqual(['El archivo no contiene links']);
  });

  it('lista links del mismo dominio que el crawl registró como 404', () => {
    const content = `# Las Brisas\n\n## Hoteles\n- [Spa](${origin}/acapulco/spa/): Spa\n- [Acapulco](${origin}/acapulco/)\n- [Externo](https://otro.com/spa/)\n`;
    const report = checkLlmsTxt(capture({ content }), chainPages());
    expect(report.status).toBe('ok');
    expect(report.brokenLinks).toEqual([`${origin}/acapulco/spa/`]);
  });

  it('secciones con datos y prosa son ok con una advertencia agrupada', () => {
    const content = [
      '# Las Brisas Hotels',
      '',
      '## Directorio de propiedades',
      '',
      '### Las Brisas Acapulco',
      '- Teléfono: +52 744 469 6900',
      '- Dirección: Escénica 5255',
      '- Páginas: [Inicio del hotel](https://www.lasbrisashotels.com.mx/es/acapulco/) · [Habitaciones](https://www.lasbrisashotels.com.mx/es/acapulco/habitaciones/)',
    ].join('\n');
    const report = checkLlmsTxt(capture({ content }), []);
    expect(report.status).toBe('ok');
    expect(report.problems).toEqual([]);
    expect(report.warnings).toEqual([
      '3 elementos de lista en secciones H2 no tienen la forma [título](url) (líneas 6, 7, 8)',
    ]);
    expect(validateLlmsTxtFormat(content).links).toHaveLength(2);
  });

  it('la advertencia resume cuando hay muchas líneas', () => {
    const content = ['# X', '[a](/a)', '## S', ...Array.from({ length: 12 }, (_, i) => `- dato ${i}`)].join('\n');
    expect(validateLlmsTxtFormat(content).warnings[0]).toMatch(/^12 elementos .*\(líneas 4, 5, 6, 7, 8, 9, 10, 11, 12, 13 y 2 más\)$/);
  });
});

describe('candidatePages', () => {
  it('sitio bilingüe: solo el idioma por defecto, sin 404 ni no canónicas', () => {
    const pages = chainPages();
    pages.find((p) => p.url.endsWith('/contacto/'))!.canonical = `${origin}/`;
    const urls = candidatePages(pages, brisasProfile, 'es').map((c) => c.url);
    expect(urls).toContain(`${origin}/acapulco/habitaciones/`);
    expect(urls).not.toContain(`${origin}/en/acapulco/rooms/`);
    expect(urls).not.toContain(`${origin}/acapulco/spa/`);
    expect(urls).not.toContain(`${origin}/contacto/`);
  });
});

describe('renderLlmsTxt', () => {
  it('no incluye datos factuales ausentes del perfil', async () => {
    const profile: ProfileInput = structuredClone(brisasProfile);
    profile.businessKind = 'hotel';
    profile.entities = [{ ...structuredClone(brisasProfile.entities[2]), scope: '/', parentKey: null }];
    delete profile.entities[0].facts.telephone;
    const text = await generateLlmsTxt(async () => ({ sections: [{ title: 'Hotel', ids: ['p0'] }] }), profile, chainPages());
    expect(text).not.toMatch(/Teléfono/);
    expect(text).toMatch(/^# Las Brisas Acapulco\n\n> Hotel icónico/);
    expect(text).toMatch(/Dirección: Escénica 5255/);
    expect(validateLlmsTxtFormat(text).problems).toEqual([]);
  });

  it('respeta la forma estándar de los links', () => {
    expect(
      renderLlmsTxt({ title: 'X', details: [], sections: [{ title: 'S', links: [{ title: 'A [b]', url: '/a', description: 'd' }] }] })
    ).toBe('# X\n\n## S\n\n- [A b](/a): d\n');
  });
});

describe('selectSections', () => {
  const candidates = candidatePages(chainPages(), brisasProfile, 'es');

  it('descarta ids inventados y repetidos', async () => {
    const [first, second] = candidates;
    const model = async () => ({ sections: [{ title: 'Hoteles', ids: [first.id, 'p999', first.id, second.id] }, { title: 'Vacía', ids: ['x'] }] });
    const sections = await selectSections(model, candidates, { context: 'Las Brisas', lang: 'es', maxLinks: 10 });
    expect(sections).toEqual([
      {
        title: 'Hoteles',
        links: [
          { title: first.title, url: first.url, description: first.description },
          { title: second.title, url: second.url, description: second.description },
        ],
      },
    ]);
  });
});

describe('generateLlmsTxt — cadena', () => {
  it('una sección H2 por hotel con links de su scope', async () => {
    const profile: ProfileInput = structuredClone(brisasProfile);
    for (const [key, name] of [['ixtapa', 'Las Brisas Ixtapa'], ['huatulco', 'Las Brisas Huatulco']] as const) {
      profile.entities.push({
        key,
        kind: 'internal',
        type: 'Resort',
        id: `${origin}/${key}/#hotel`,
        scope: `/${key}/`,
        parentKey: 'org',
        facts: { name: { value: name, source: 'user' } },
        texts: {},
      });
    }
    // El modelo devuelve todos los ids que recibe en el prompt
    const model = async (prompt: string) => ({ sections: [{ title: 'Páginas', ids: [...prompt.matchAll(/^(p\d+) \|/gm)].map((m) => m[1]) }] });
    const text = await generateLlmsTxt(model, profile, chainPages());

    expect([...text.matchAll(/^## (.+)$/gm)].map((m) => m[1])).toEqual([
      'Las Brisas Acapulco',
      'Las Brisas Ixtapa',
      'Las Brisas Huatulco',
      'Páginas',
    ]);
    const acapulco = text.split('## Las Brisas Acapulco')[1].split('## ')[0];
    expect(acapulco).toContain(`${origin}/acapulco/habitaciones/`);
    expect(acapulco).not.toContain('/ixtapa/');
    expect(acapulco).toContain('Teléfono: +52 744 469 6900');
    expect(validateLlmsTxtFormat(text).problems).toEqual([]);
  });
});
