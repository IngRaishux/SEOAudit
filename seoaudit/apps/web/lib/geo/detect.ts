import type { JsonModel } from './ai';
import type { GeoPage } from './pages';
import { BUSINESS_KINDS, type BusinessKind } from './profile';
import { LODGING_TYPES } from './rules';
import { normalizePath } from './url';

export interface UrlGroup {
  prefix: string;
  count: number;
  sampleTitles: string[];
}

export interface PropertySuggestion {
  prefix: string;
  name: string;
  type: (typeof LODGING_TYPES)[number];
}

export interface StructureSuggestion {
  businessKind: BusinessKind;
  defaultLanguage: string;
  properties: PropertySuggestion[];
}

const SAMPLE_TITLES = 3;

/** Agrupa las páginas por su primer segmento ya sin idioma. */
export function groupByFirstSegment(pages: GeoPage[], languages: string[]): UrlGroup[] {
  const groups = new Map<string, UrlGroup>();
  for (const page of pages) {
    if (page.statusCode && page.statusCode >= 400) continue;
    const segment = normalizePath(page.url, languages).path.split('/').filter(Boolean)[0];
    if (!segment) continue;
    const prefix = `/${segment}/`;
    const group = groups.get(prefix) ?? { prefix, count: 0, sampleTitles: [] };
    group.count++;
    if (page.title && group.sampleTitles.length < SAMPLE_TITLES && !group.sampleTitles.includes(page.title)) {
      group.sampleTitles.push(page.title);
    }
    groups.set(prefix, group);
  }
  return [...groups.values()].sort((a, b) => b.count - a.count);
}

/**
 * La IA clasifica; el código descarta cualquier prefijo que no venga de los grupos reales
 * y cualquier tipo fuera del catálogo.
 */
export async function suggestStructure(
  model: JsonModel,
  input: { origin: string; homeTitle: string; homeText: string; groups: UrlGroup[] }
): Promise<StructureSuggestion> {
  const prompt = `Clasifica el sitio ${input.origin}.
Título de la home: ${input.homeTitle}
Texto de la home (extracto): ${input.homeText.slice(0, 3000)}

Grupos de URL (prefijo, número de páginas, títulos de muestra):
${input.groups.map((g) => `- ${g.prefix} (${g.count}): ${g.sampleTitles.join(' | ')}`).join('\n')}

0. "defaultLanguage": código ISO 639-1 del idioma del texto de la home (p. ej. "es").
1. "businessKind": uno de ${BUSINESS_KINDS.map((k) => `"${k}"`).join(', ')}.
   "hotel-chain" solo si el sitio agrupa varias propiedades de hospedaje con su propia sección.
2. "properties": solo si es "hotel-chain", los grupos que son una propiedad de hospedaje (no blogs, contacto, ofertas ni destinos genéricos).
   Usa exactamente el prefijo dado. "type" es uno de ${LODGING_TYPES.join(', ')}.

Responde solo JSON: {"defaultLanguage": "", "businessKind": "", "properties": [{"prefix": "", "name": "", "type": ""}]}`;

  const response = (await model(prompt)) as {
    defaultLanguage?: unknown;
    businessKind?: unknown;
    properties?: unknown;
  } | null;

  const lang = typeof response?.defaultLanguage === 'string' ? response.defaultLanguage.trim().toLowerCase() : '';
  const defaultLanguage = /^[a-z]{2}$/.test(lang) ? lang : 'es';

  const businessKind = BUSINESS_KINDS.includes(response?.businessKind as BusinessKind)
    ? (response!.businessKind as BusinessKind)
    : 'organization';

  const known = new Set(input.groups.map((g) => g.prefix));
  const seen = new Set<string>();
  const properties: PropertySuggestion[] = [];
  if (businessKind === 'hotel-chain' && Array.isArray(response?.properties)) {
    for (const raw of response.properties as Array<Record<string, unknown>>) {
      const prefix = typeof raw?.prefix === 'string' ? raw.prefix : '';
      if (!known.has(prefix) || seen.has(prefix)) continue;
      seen.add(prefix);
      const type = (LODGING_TYPES as readonly string[]).includes(raw.type as string)
        ? (raw.type as PropertySuggestion['type'])
        : 'Hotel';
      const name = typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim() : prefix;
      properties.push({ prefix, name, type });
    }
  }

  return { businessKind, defaultLanguage, properties };
}
