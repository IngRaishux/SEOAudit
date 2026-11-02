import { normalizeForMatch } from './ai';
import { typesOf, type JsonLdNode } from './jsonld';
import { textIn, type ProfileEntity, type ProfileInput } from './profile';
import { familyOf } from './rules';

export type Resolution = 'keep' | 'profile';

export interface Conflict {
  path: string;
  existing: unknown;
  profile: unknown;
  resolution: Resolution;
}

export type DiffKind = 'added' | 'kept' | 'conflict' | 'preserved';

export interface DiffEntry {
  path: string;
  kind: DiffKind;
  resolution?: Resolution;
}

export interface MergeResult {
  node: JsonLdNode;
  diff: DiffEntry[];
  conflicts: Conflict[];
}

/** Nodo de la entidad construido solo con valores del perfil; un campo vacío se omite. */
export function buildEntityNode(
  entity: ProfileEntity,
  profile: ProfileInput,
  lang: string,
  url: string
): JsonLdNode {
  const f = entity.facts;
  const family = familyOf(entity.type);
  const lodging = family === 'LodgingBusiness';
  const local = lodging || family === 'LocalBusiness';
  const node: JsonLdNode = { '@type': entity.type, '@id': entity.id };
  const set = (key: string, value: unknown) => {
    if (value !== undefined && value !== null && !(Array.isArray(value) && value.length === 0)) node[key] = value;
  };

  set('name', f.name?.value);
  set('alternateName', textIn(entity, 'alternateName', lang, profile.defaultLanguage));
  set('description', textIn(entity, 'description', lang, profile.defaultLanguage));
  set('url', url);
  set('logo', f.logo?.value);
  set('image', f.image?.value);
  set('email', f.email?.value);
  set('telephone', f.telephone?.value);
  if (f.address) set('address', { '@type': 'PostalAddress', ...f.address.value });
  if (f.geo) set('geo', { '@type': 'GeoCoordinates', ...f.geo.value });
  if (local) {
    set('openingHours', f.openingHours?.value);
    set('priceRange', f.priceRange?.value);
  }
  if (lodging) {
    const amenities = textIn(entity, 'amenities', lang, profile.defaultLanguage);
    set(
      'amenityFeature',
      amenities?.map((name) => ({ '@type': 'LocationFeatureSpecification', name, value: true }))
    );
    set('checkinTime', f.checkinTime?.value);
    set('checkoutTime', f.checkoutTime?.value);
    if (f.starRating) set('starRating', { '@type': 'Rating', ratingValue: f.starRating.value });
    set('numberOfRooms', f.numberOfRooms?.value);
    set('petsAllowed', f.petsAllowed?.value);
  }
  set('sameAs', f.sameAs?.value);

  const parent = entity.parentKey ? profile.entities.find((e) => e.key === entity.parentKey) : null;
  if (parent) {
    // Una entidad externa no se declara en el sitio: se describe en línea como en un schema hecho a mano
    set(
      'parentOrganization',
      parent.kind === 'external'
        ? { '@type': parent.type, '@id': parent.id, name: parent.facts.name?.value, url: parent.facts.url?.value }
        : { '@id': parent.id }
    );
  }
  return node;
}

const digits = (v: string) => v.replace(/\D/g, '');

function isEmpty(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value as object).length === 0;
  return false;
}

function canonical(value: unknown): string {
  return JSON.stringify(value, (_k, v) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b)))
      : v
  );
}

/** Igualdad tolerante al formato para no levantar conflictos falsos. */
function equivalent(path: string, a: unknown, b: unknown): boolean {
  if (path === '@type') return typesOf({ '@type': a as string }).includes(b as string);
  if (typeof a === 'string' && typeof b === 'string') {
    if (path === 'telephone') return digits(a) === digits(b);
    if (path === 'email') return a.replace(/^mailto:/i, '').toLowerCase() === b.toLowerCase();
    if (path === 'url' || path === '@id' || path === 'logo' || path === 'image') return a.replace(/\/$/, '') === b.replace(/\/$/, '');
    const [x, y] = [normalizeForMatch(a), normalizeForMatch(b)];
    // Valores solo con símbolos (p. ej. priceRange "$$") se comparan tal cual
    return x || y ? x === y : a.trim() === b.trim();
  }
  if (path === 'geo' && a && b && typeof a === 'object' && typeof b === 'object') {
    const x = a as Record<string, unknown>;
    const y = b as Record<string, unknown>;
    return Math.abs(Number(x.latitude) - Number(y.latitude)) < 0.0001 && Math.abs(Number(x.longitude) - Number(y.longitude)) < 0.0001;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    // El existente cubre al perfil: no hay nada que agregar
    const have = new Set(a.map(canonical));
    return b.every((item) => have.has(canonical(item)));
  }
  if (path === 'parentOrganization' && a && b && typeof a === 'object' && typeof b === 'object') {
    return (a as JsonLdNode)['@id'] === (b as JsonLdNode)['@id'];
  }
  return canonical(a) === canonical(b);
}

// Propiedades objeto que se completan campo por campo en lugar de como un todo
const MERGE_BY_FIELD = new Set(['address']);

/**
 * Completa `existing` con lo que falta de `profileNode`. Nunca borra: las propiedades que el
 * perfil no modela se conservan y un valor distinto solo cambia si el usuario elige 'profile'.
 */
export function mergeNode(
  existing: JsonLdNode | null,
  profileNode: JsonLdNode,
  resolutions: Record<string, Resolution> = {}
): MergeResult {
  if (!existing) {
    return {
      node: structuredClone(profileNode),
      diff: Object.keys(profileNode).map((path) => ({ path, kind: 'added' as const })),
      conflicts: [],
    };
  }

  const node: JsonLdNode = structuredClone(existing);
  const diff: DiffEntry[] = [];
  const conflicts: Conflict[] = [];

  const resolve = (path: string, current: unknown, proposed: unknown, assign: (value: unknown) => void) => {
    if (isEmpty(current)) {
      assign(proposed);
      diff.push({ path, kind: 'added' });
      return;
    }
    if (equivalent(path, current, proposed)) {
      diff.push({ path, kind: 'kept' });
      return;
    }
    const resolution = resolutions[path] ?? 'keep';
    conflicts.push({ path, existing: current, profile: proposed, resolution });
    diff.push({ path, kind: 'conflict', resolution });
    if (resolution === 'profile') {
      // En listas se agrega lo que falta sin quitar lo que el sitio ya declara
      assign(Array.isArray(current) && Array.isArray(proposed) ? union(current, proposed) : proposed);
    }
  };

  for (const [key, proposed] of Object.entries(profileNode)) {
    const current = node[key];
    if (MERGE_BY_FIELD.has(key) && current && typeof current === 'object' && !Array.isArray(current) && proposed && typeof proposed === 'object') {
      const target = current as Record<string, unknown>;
      for (const [field, value] of Object.entries(proposed as Record<string, unknown>)) {
        if (field === '@type') continue;
        resolve(`${key}.${field}`, target[field], value, (v) => (target[field] = v));
      }
      continue;
    }
    resolve(key, current, proposed, (v) => (node[key] = v));
  }

  for (const key of Object.keys(existing)) {
    if (!(key in profileNode) && key !== '@context') diff.push({ path: key, kind: 'preserved' });
  }
  return { node, diff, conflicts };
}

function union(current: unknown[], proposed: unknown[]): unknown[] {
  const have = new Set(current.map(canonical));
  return [...current, ...proposed.filter((item) => !have.has(canonical(item)))];
}

/** Reemplaza cada `@id` aceptado en todo el bloque, incluidas referencias anidadas. */
export function applyIdRewrites<T>(value: T, rewrites: Record<string, string>): T {
  if (Object.keys(rewrites).length === 0) return value;
  const visit = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(visit);
    if (v && typeof v === 'object') {
      return Object.fromEntries(
        Object.entries(v).map(([k, inner]) => [
          k,
          k === '@id' && typeof inner === 'string' && rewrites[inner] ? rewrites[inner] : visit(inner),
        ])
      );
    }
    return v;
  };
  return visit(value) as T;
}
