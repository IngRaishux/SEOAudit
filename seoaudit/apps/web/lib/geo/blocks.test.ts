import { describe, expect, it } from 'vitest';
import { planSiteBlocks } from './blocks';
import type { GeoPage } from './pages';
import { brisasOrganization, brisasResort } from './__fixtures__/brisas';
import { brisasProfile } from './__fixtures__/profile';

const origin = 'https://www.lasbrisashotels.com.mx';
const block = (parsed: unknown) => ({ raw: JSON.stringify(parsed), parsed, parseError: null });
const page = (path: string, jsonLd: GeoPage['jsonLd'] = []): GeoPage => ({
  url: `${origin}${path}`,
  statusCode: 200,
  jsonLd,
  bodyText: '',
});

const byKey = (plan: ReturnType<typeof planSiteBlocks>) => Object.fromEntries(plan.items.map((i) => [i.key, i]));

describe('planSiteBlocks', () => {
  it('genera el bloque de /en/acapulco/ sin JSON-LD previo', () => {
    const plan = planSiteBlocks(brisasProfile, [page('/en/'), page('/en/acapulco/'), page('/en/acapulco/rooms/')]);
    const item = byKey(plan)['entity:acapulco:en'];
    expect(item.destination).toBe('entity');
    expect(item.basePageUrl).toBeNull();
    expect(item.block).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'Resort',
      '@id': `${origin}/acapulco/#hotel`,
      url: `${origin}/en/acapulco/`,
      description: 'Iconic hotel overlooking the bay.',
      parentOrganization: { '@id': `${origin}/#organization` },
    });
    expect(item.script.startsWith('<script type="application/ld+json">')).toBe(true);
  });

  it('el bloque global nuevo incluye Organization y WebSite', () => {
    const item = byKey(planSiteBlocks(brisasProfile, [page('/es/')]))['global:org:es'];
    expect(item.destination).toBe('global');
    const graph = item.block['@graph'] as Array<Record<string, unknown>>;
    expect(graph.map((n) => n['@type'])).toEqual(['Organization', 'WebSite']);
    expect(graph[1]).toMatchObject({ publisher: { '@id': `${origin}/#organization` }, inLanguage: 'es' });
  });

  it('al completar conserva los demás nodos del bloque original', () => {
    const itemList = { '@type': 'ItemList', name: 'Hoteles' };
    const graphBlock = { '@context': 'https://schema.org', '@graph': [itemList, { ...brisasOrganization, '@context': undefined }] };
    const item = byKey(planSiteBlocks(brisasProfile, [page('/es/', [block(graphBlock)])]))['global:org:es'];
    const graph = item.block['@graph'] as Array<Record<string, unknown>>;
    expect(graph[0]).toEqual(itemList);
    expect(graph[1]['@type']).toBe('Organization');
    expect(item.basePageUrl).toBe(`${origin}/es/`);
  });

  it('una página con su propia variante del nodo recibe su bloque', () => {
    const variant = { ...brisasResort, telephone: '+52 744 000 0000' };
    const plan = planSiteBlocks(brisasProfile, [
      page('/es/acapulco/', [block(brisasResort)]),
      page('/es/acapulco/habitaciones/', [block(variant)]),
      page('/es/acapulco/spa/', [block(brisasResort)]),
    ]);
    expect(plan.items.filter((i) => i.destination === 'page').map((i) => i.pageUrl)).toEqual([
      `${origin}/es/acapulco/habitaciones/`,
    ]);
  });

  it('aceptar un @id nuevo reescribe las referencias en todo el sitio', () => {
    const oldOrgId = `${origin}/es/#organization`;
    const org = { ...brisasOrganization, '@id': oldOrgId };
    const resort = { ...brisasResort, '@id': `${origin}/acapulco/#hotel`, parentOrganization: { '@id': oldOrgId } };
    const pages = [page('/es/', [block(org)]), page('/es/acapulco/', [block(resort)])];

    const before = byKey(planSiteBlocks(brisasProfile, pages));
    expect(before['entity:acapulco:es'].conflicts.map((c) => c.path)).toContain('parentOrganization');

    const plan = planSiteBlocks(brisasProfile, pages, { 'global:org:es': { '@id': 'profile' } });
    expect(plan.idRewrites).toEqual({ [oldOrgId]: `${origin}/#organization` });
    const items = byKey(plan);
    expect(items['global:org:es'].block['@id']).toBe(`${origin}/#organization`);
    expect(items['entity:acapulco:es'].block.parentOrganization).toEqual({ '@id': `${origin}/#organization` });
    expect(items['entity:acapulco:es'].conflicts.map((c) => c.path)).not.toContain('parentOrganization');
  });
});
