import type { JsonModel } from './ai';
import { locatePages, type GeoPage, type LocatedPage } from './pages';
import { internalEntities, textIn, type ProfileEntity, type ProfileInput } from './profile';
import { familyOf } from './rules';
import { normalizeScope } from './url';

export type LlmsTxtStatus = 'missing' | 'invalid' | 'ok' | 'unknown';

export interface LlmsTxtCaptureLike {
  url: string;
  status: number | null;
  contentType: string | null;
  content: string | null;
  error: string | null;
}

export interface LlmsTxtReport {
  status: LlmsTxtStatus;
  url: string | null;
  problems: string[];
  warnings: string[];
  brokenLinks: string[];
}

const LINK_ITEM = /^\s*[-*]\s+\[([^\]]+)\]\((\S+?)\)(?::\s*(.*))?\s*$/;
const LIST_ITEM = /^\s*[-*]\s+/;
const INLINE_LINK = /\[[^\]]+\]\((\S+?)\)/g;
const MAX_LINES_LISTED = 10;

const withoutTrailingSlash = (url: string) => url.replace(/\/$/, '');

export function checkLlmsTxt(capture: LlmsTxtCaptureLike | null, pages: GeoPage[]): LlmsTxtReport {
  if (!capture) {
    return {
      status: 'unknown',
      url: null,
      problems: ['El crawl no registró /llms.txt; vuelve a crawlear el sitio'],
      warnings: [],
      brokenLinks: [],
    };
  }
  if (capture.error || capture.status === null) {
    return {
      status: 'unknown',
      url: capture.url,
      problems: [`No se pudo consultar /llms.txt (${capture.error ?? 'sin respuesta'}); vuelve a crawlear el sitio`],
      warnings: [],
      brokenLinks: [],
    };
  }
  if (capture.status < 200 || capture.status >= 300 || capture.content === null) {
    return { status: 'missing', url: capture.url, problems: [], warnings: [], brokenLinks: [] };
  }

  const content = capture.content;
  if (/text\/html/i.test(capture.contentType ?? '') || /^\s*<(!doctype|html)/i.test(content)) {
    return {
      status: 'invalid',
      url: capture.url,
      problems: ['El contenido no es un llms.txt: el servidor respondió con una página HTML'],
      warnings: [],
      brokenLinks: [],
    };
  }

  const { problems, warnings, links } = validateLlmsTxtFormat(content);
  return {
    status: problems.length ? 'invalid' : 'ok',
    url: capture.url,
    problems,
    warnings,
    brokenLinks: brokenLinks(links, capture.url, pages),
  };
}

/**
 * Invalidan el archivo: falta de H1 al inicio, más de un H1 o ningún link. Las secciones con
 * datos o prosa son comunes en archivos hechos a mano, así que solo generan una advertencia.
 */
export function validateLlmsTxtFormat(content: string): { problems: string[]; warnings: string[]; links: string[] } {
  const problems: string[] = [];
  const links: string[] = [];
  const nonLinkItems: number[] = [];
  const lines = content.split(/\r?\n/);
  const firstIndex = lines.findIndex((l) => l.trim() !== '');

  if (firstIndex === -1 || !/^#\s+\S/.test(lines[firstIndex])) problems.push('Falta el título H1 al inicio del archivo');

  let inSection = false;
  lines.forEach((line, index) => {
    if (/^##\s+/.test(line)) inSection = true;
    else if (/^#\s+/.test(line) && index !== firstIndex) problems.push(`Línea ${index + 1}: solo debe haber un título H1`);
    for (const match of line.matchAll(INLINE_LINK)) links.push(match[1]);
    if (inSection && LIST_ITEM.test(line) && !LINK_ITEM.test(line)) nonLinkItems.push(index + 1);
  });

  if (links.length === 0) problems.push('El archivo no contiene links');

  const warnings: string[] = [];
  if (nonLinkItems.length) {
    const shown = nonLinkItems.slice(0, MAX_LINES_LISTED).join(', ');
    const rest = nonLinkItems.length > MAX_LINES_LISTED ? ` y ${nonLinkItems.length - MAX_LINES_LISTED} más` : '';
    warnings.push(
      `${nonLinkItems.length} elementos de lista en secciones H2 no tienen la forma [título](url) (líneas ${shown}${rest})`
    );
  }
  return { problems, warnings, links };
}

function brokenLinks(links: string[], llmsTxtUrl: string, pages: GeoPage[]): string[] {
  const host = new URL(llmsTxtUrl).host;
  const notFound = new Set(pages.filter((p) => p.statusCode === 404).map((p) => withoutTrailingSlash(p.url)));
  return links.filter((link) => {
    try {
      const url = new URL(link, llmsTxtUrl);
      return url.host === host && notFound.has(withoutTrailingSlash(url.href));
    } catch {
      return false;
    }
  });
}

export interface LlmsLink {
  title: string;
  url: string;
  description?: string;
}

export interface LlmsSection {
  title: string;
  intro?: string;
  links: LlmsLink[];
}

export interface LlmsDocument {
  title: string;
  summary?: string;
  details: string[];
  sections: LlmsSection[];
}

export function renderLlmsTxt(doc: LlmsDocument): string {
  const out = [`# ${doc.title}`, ''];
  if (doc.summary) out.push(`> ${doc.summary.replace(/\s*\n\s*/g, ' ')}`, '');
  if (doc.details.length) out.push(...doc.details, '');
  for (const section of doc.sections) {
    if (section.links.length === 0) continue;
    out.push(`## ${section.title}`, '');
    if (section.intro) out.push(section.intro, '');
    for (const link of section.links) {
      out.push(`- [${link.title.replace(/[[\]]/g, '')}](${link.url})${link.description ? `: ${link.description}` : ''}`);
    }
    out.push('');
  }
  return `${out.join('\n').trim()}\n`;
}

export interface Candidate {
  id: string;
  url: string;
  path: string;
  title: string;
  description?: string;
  entityKey: string | null;
}

/** Páginas que pueden aparecer: 200, canónicas y en un solo idioma. */
export function candidatePages(pages: GeoPage[], profile: ProfileInput, lang: string): Candidate[] {
  const located = locatePages(pages, internalEntities(profile), profile.languages);
  const seen = new Set<string>();
  const out: Candidate[] = [];
  located.forEach((p: LocatedPage<ProfileEntity>, index) => {
    const { page } = p;
    if (page.statusCode !== undefined && page.statusCode !== null && page.statusCode !== 200) return;
    if ((p.lang ?? profile.defaultLanguage) !== lang) return;
    if (page.canonical && withoutTrailingSlash(page.canonical) !== withoutTrailingSlash(page.url)) return;
    const key = withoutTrailingSlash(page.url);
    if (seen.has(key)) return;
    seen.add(key);
    out.push({
      id: `p${index}`,
      url: page.url,
      path: p.path,
      title: page.title?.trim() || p.path,
      description: page.description?.trim() || undefined,
      entityKey: p.entity?.key ?? null,
    });
  });
  return out;
}

function contactLines(entity: ProfileEntity, english: boolean): string[] {
  const f = entity.facts;
  const lines: string[] = [];
  if (f.address) {
    const a = f.address.value;
    const parts = [a.streetAddress, a.addressLocality, a.addressRegion, a.postalCode, a.addressCountry].filter(Boolean);
    if (parts.length) lines.push(`- ${english ? 'Address' : 'Dirección'}: ${parts.join(', ')}`);
  }
  if (f.telephone) lines.push(`- ${english ? 'Phone' : 'Teléfono'}: ${f.telephone.value}`);
  if (f.email) lines.push(`- Email: ${f.email.value}`);
  return lines;
}

interface ModelSection {
  title?: unknown;
  ids?: unknown;
}

/** La IA solo elige y agrupa ids de la lista; ids desconocidos o repetidos se descartan. */
export async function selectSections(
  model: JsonModel,
  candidates: Candidate[],
  input: { context: string; lang: string; maxLinks: number; single?: boolean }
): Promise<Array<{ title: string; links: LlmsLink[] }>> {
  if (candidates.length === 0) return [];
  const prompt = `Prepara un llms.txt para ${input.context}.
Elige las páginas más útiles para que un asistente de IA entienda y recomiende el negocio (máximo ${input.maxLinks}).
Omite páginas legales, de error, de login o duplicadas.
${input.single ? 'Devuelve una sola sección.' : `Agrúpalas en secciones con títulos cortos en el idioma "${input.lang}".`}
Usa solo los ids de la lista.

Páginas (id | ruta | título | descripción):
${candidates.map((c) => `${c.id} | ${c.path} | ${c.title} | ${c.description ?? ''}`).join('\n')}

Responde solo JSON: {"sections": [{"title": "", "ids": [""]}]}`;

  const response = (await model(prompt)) as { sections?: ModelSection[] } | null;
  const byId = new Map(candidates.map((c) => [c.id, c]));
  const used = new Set<string>();
  const sections: Array<{ title: string; links: LlmsLink[] }> = [];
  let total = 0;

  for (const raw of Array.isArray(response?.sections) ? response!.sections : []) {
    const ids = Array.isArray(raw?.ids) ? raw.ids : [];
    const links: LlmsLink[] = [];
    for (const id of ids) {
      const c = typeof id === 'string' ? byId.get(id) : undefined;
      if (!c || used.has(c.id) || total >= input.maxLinks) continue;
      used.add(c.id);
      total++;
      links.push({ title: c.title, url: c.url, description: c.description });
    }
    const title = typeof raw?.title === 'string' && raw.title.trim() ? raw.title.trim() : input.context;
    if (links.length) sections.push({ title, links });
  }
  return sections;
}

const MAX_LINKS_SITE = 40;
const MAX_LINKS_PER_PROPERTY = 12;

export async function generateLlmsTxt(
  model: JsonModel,
  profile: ProfileInput,
  pages: GeoPage[],
  lang: string = profile.defaultLanguage
): Promise<string> {
  const entities = internalEntities(profile);
  const root = entities.find((e) => normalizeScope(e.scope ?? '/') === '/') ?? entities[0];
  const english = lang.startsWith('en');
  const candidates = candidatePages(pages, profile, lang);
  const name = root.facts.name?.value ?? new URL(root.id).host;
  const properties = entities.filter((e) => e !== root && familyOf(e.type) === 'LodgingBusiness');

  const summary = textIn(root, 'description', lang, profile.defaultLanguage);
  const details = contactLines(root, english);
  let sections: LlmsSection[];

  if (properties.length > 0) {
    const orgPages = candidates.filter((c) => c.entityKey === root.key);
    const orgSections = await selectSections(model, orgPages, { context: name, lang, maxLinks: 10 });
    const propertySections = await Promise.all(
      properties.map(async (property) => {
        const propertyName = property.facts.name?.value ?? property.key;
        const selected = await selectSections(
          model,
          candidates.filter((c) => c.entityKey === property.key),
          { context: `${propertyName} (${name})`, lang, maxLinks: MAX_LINKS_PER_PROPERTY, single: true }
        );
        const description = textIn(property, 'description', lang, profile.defaultLanguage);
        const contact = contactLines(property, english).map((l) => l.replace(/^- /, ''));
        return {
          title: propertyName,
          intro: [description, contact.join(' · ')].filter(Boolean).join('\n\n') || undefined,
          links: selected.flatMap((s) => s.links),
        };
      })
    );
    sections = [...propertySections, ...orgSections];
  } else {
    sections = await selectSections(model, candidates, { context: name, lang, maxLinks: MAX_LINKS_SITE });
  }

  return renderLlmsTxt({ title: name, summary, details, sections });
}
