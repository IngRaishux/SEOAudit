import { normalizeForMatch } from './ai';
import { findEntityNode, isValidSchemaBlock, nodesFromBlocks, typesOf, type JsonLdNode } from './jsonld';
import type { GeoPage, LocatedPage } from './pages';
import type { ProfileEntity, ProfileInput } from './profile';
import { familyOf, isCompatibleType, rulesFor } from './rules';
import { normalizePath } from './url';

export const AUDIT_STATUSES = ['missing', 'invalid', 'wrong-type', 'incomplete', 'inconsistent', 'ok'] as const;
export type AuditStatus = (typeof AUDIT_STATUSES)[number];

export interface Inconsistency {
  field: string;
  page: unknown;
  profile: unknown;
}

export interface PageAudit {
  url: string;
  status: AuditStatus;
  lang: string | null;
  entityKey: string | null;
  expectedType: string | null;
  node: JsonLdNode | null;
  invalidBlocks: number;
  missingRequired: string[];
  missingRecommended: string[];
  suggestions: string[];
  inconsistencies: Inconsistency[];
  /** Sin perfil no se evalúan tipo esperado ni consistencia. */
  profileChecksSkipped: boolean;
  completeness: { required: [number, number]; recommended: [number, number] } | null;
  notes: string[];
}

const FAMILY_PRIORITY = ['LodgingBusiness', 'LocalBusiness', 'Organization'];

function hasValue(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value as object).length > 0;
  return true;
}

/** Nodo más específico de un tipo soportado, para revisar sin perfil. */
function mostSpecificSupportedNode(nodes: JsonLdNode[]): JsonLdNode | null {
  for (const family of FAMILY_PRIORITY) {
    const node = nodes.find((n) => typesOf(n).some((t) => familyOf(t) === family));
    if (node) return node;
  }
  return null;
}

export function auditPage(located: LocatedPage<ProfileEntity>, profile: ProfileInput | null): PageAudit {
  const { page, lang, entity } = located;
  const blocks = page.jsonLd ?? [];
  const validBlocks = blocks.filter((b) => b.parsed != null && isValidSchemaBlock(b.parsed));
  const base: PageAudit = {
    url: page.url,
    status: 'ok',
    lang,
    entityKey: entity?.key ?? null,
    expectedType: profile && entity ? entity.type : null,
    node: null,
    invalidBlocks: blocks.length - validBlocks.length,
    missingRequired: [],
    missingRecommended: [],
    suggestions: [],
    inconsistencies: [],
    profileChecksSkipped: !profile,
    completeness: null,
    notes: [],
  };

  if (blocks.length === 0) return { ...base, status: 'missing' };
  if (validBlocks.length === 0) return { ...base, status: 'invalid' };

  const nodes = nodesFromBlocks(validBlocks);
  let node: JsonLdNode | null;
  let evaluatedType: string;

  if (profile && entity) {
    node = findEntityNode(nodes, { id: entity.id, type: entity.type });
    if (!node || !typesOf(node).some((t) => isCompatibleType(t, entity.type))) {
      const declared = node ? typesOf(node).join(', ') : nodes.flatMap(typesOf).join(', ') || 'ninguno';
      return {
        ...base,
        node,
        status: 'wrong-type',
        notes: [`Se espera ${entity.type} (${entity.id}); la página declara: ${declared}`],
      };
    }
    evaluatedType = entity.type;
  } else {
    node = mostSpecificSupportedNode(nodes);
    if (!node) {
      return { ...base, notes: ['La página no declara tipos que esta herramienta evalúe'] };
    }
    evaluatedType = typesOf(node).find((t) => familyOf(t)) ?? typesOf(node)[0];
  }

  const rules = rulesFor(evaluatedType)!;
  const missingRequired = rules.req.filter((p) => !hasValue(node![p]));
  const missingRecommended = rules.rec.filter((p) => !hasValue(node![p]));
  const suggestions = rules.extra.filter((p) => !hasValue(node![p]));
  const completeness = {
    required: [rules.req.length - missingRequired.length, rules.req.length] as [number, number],
    recommended: [rules.rec.length - missingRecommended.length, rules.rec.length] as [number, number],
  };
  const result = { ...base, node, missingRequired, missingRecommended, suggestions, completeness };

  if (missingRequired.length || missingRecommended.length) return { ...result, status: 'incomplete' };
  if (!profile || !entity) return result;

  const inconsistencies = compareWithProfile(node, entity);
  return inconsistencies.length ? { ...result, status: 'inconsistent', inconsistencies } : result;
}

const digits = (v: string) => v.replace(/\D/g, '');

/** Diferencias en datos factuales, ignorando formato (espacios en teléfonos, mayúsculas en email). */
export function compareWithProfile(node: JsonLdNode, entity: ProfileEntity): Inconsistency[] {
  const out: Inconsistency[] = [];
  const f = entity.facts;
  const str = (v: unknown) => (typeof v === 'string' ? v : undefined);

  const check = (field: string, pageValue: unknown, profileValue: unknown, same: (a: string, b: string) => boolean) => {
    const a = str(pageValue);
    const b = str(profileValue);
    if (a && b && !same(a, b)) out.push({ field, page: a, profile: b });
  };

  check('name', node.name, f.name?.value, (a, b) => normalizeForMatch(a) === normalizeForMatch(b));
  check('telephone', node.telephone, f.telephone?.value, (a, b) => digits(a) === digits(b));
  check('email', node.email, f.email?.value, (a, b) => a.replace(/^mailto:/i, '').toLowerCase() === b.toLowerCase());
  check('priceRange', node.priceRange, f.priceRange?.value, (a, b) => a.trim() === b.trim());

  const address = node.address as Record<string, unknown> | undefined;
  if (address && typeof address === 'object' && f.address) {
    for (const [key, value] of Object.entries(f.address.value)) {
      check(`address.${key}`, address[key], value, (a, b) => normalizeForMatch(a) === normalizeForMatch(b));
    }
  }

  const geo = node.geo as Record<string, unknown> | undefined;
  if (geo && f.geo) {
    const lat = Number(geo.latitude);
    const lng = Number(geo.longitude);
    // ~10 m de tolerancia
    const close = (x: number, y: number) => Math.abs(x - y) < 0.0001;
    if (Number.isFinite(lat) && Number.isFinite(lng) && !(close(lat, f.geo.value.latitude) && close(lng, f.geo.value.longitude))) {
      out.push({ field: 'geo', page: { latitude: lat, longitude: lng }, profile: f.geo.value });
    }
  }
  return out;
}

export interface LanguageIdFinding {
  name: string;
  ids: string[];
  recommendedId: string;
  entityKey: string | null;
}

/** Misma entidad declarada con @id distintos por idioma (p. ej. /es/acapulco/#hotel y /en/acapulco/#hotel). */
export function findLanguageSpecificIds(
  pages: GeoPage[],
  languages: string[],
  profile: ProfileInput | null
): LanguageIdFinding[] {
  const groups = new Map<string, { name: string; ids: Set<string> }>();
  for (const page of pages) {
    for (const node of nodesFromBlocks(page.jsonLd ?? [])) {
      const id = node['@id'];
      const family = typesOf(node).map(familyOf).find(Boolean);
      if (typeof id !== 'string' || !family) continue;
      const withoutLang = stripLanguage(id, languages);
      const group = groups.get(withoutLang) ?? { name: String(node.name ?? withoutLang), ids: new Set<string>() };
      group.ids.add(id);
      groups.set(withoutLang, group);
    }
  }

  const findings: LanguageIdFinding[] = [];
  for (const [withoutLang, group] of groups) {
    const languageIds = [...group.ids].filter((id) => languageOf(id, languages) !== null);
    if (languageIds.length === 0) continue;
    const entity = profile?.entities.find((e) => stripLanguage(e.id, languages) === withoutLang) ?? null;
    findings.push({
      name: group.name,
      ids: [...group.ids].sort(),
      recommendedId: entity?.id ?? withoutLang,
      entityKey: entity?.key ?? null,
    });
  }
  return findings;
}

function stripLanguage(id: string, languages: string[]): string {
  try {
    const url = new URL(id);
    return `${url.origin}${normalizePath(url.pathname, languages).path}${url.hash}`;
  } catch {
    return id;
  }
}

function languageOf(id: string, languages: string[]): string | null {
  try {
    return normalizePath(new URL(id).pathname, languages).lang;
  } catch {
    return null;
  }
}
