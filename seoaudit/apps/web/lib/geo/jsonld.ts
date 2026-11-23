import { familyOf, isCompatibleType } from './rules';

export type JsonLdNode = Record<string, unknown> & { '@type'?: string | string[]; '@id'?: string };

export interface StoredJsonLdBlock {
  raw: string;
  parsed: unknown | null;
  parseError: string | null;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function typesOf(node: JsonLdNode): string[] {
  const type = node['@type'];
  if (Array.isArray(type)) return type.filter((t): t is string => typeof t === 'string');
  return typeof type === 'string' ? [type] : [];
}

/** ¿El bloque declara un contexto de schema.org y al menos un nodo con @type? */
export function isValidSchemaBlock(parsed: unknown): boolean {
  const roots = Array.isArray(parsed) ? parsed : [parsed];
  return roots.some((root) => {
    if (!isObject(root)) return false;
    const context = root['@context'];
    const contexts = Array.isArray(context) ? context : [context];
    const hasSchemaContext = contexts.some((c) => typeof c === 'string' && /schema\.org/i.test(c));
    return hasSchemaContext && flattenNodes([root]).length > 0;
  });
}

/**
 * Nodos de primer nivel y de @graph. No desciende en propiedades: un nodo anidado
 * (p. ej. parentOrganization externo) no es una entidad declarada por la página.
 */
export function flattenNodes(roots: unknown[]): JsonLdNode[] {
  const nodes: JsonLdNode[] = [];
  const visit = (value: unknown) => {
    if (Array.isArray(value)) return value.forEach(visit);
    if (!isObject(value)) return;
    if (Array.isArray(value['@graph'])) value['@graph'].forEach(visit);
    if (value['@type'] !== undefined) nodes.push(value as JsonLdNode);
  };
  roots.forEach(visit);
  return nodes;
}

export function nodesFromBlocks(blocks: StoredJsonLdBlock[]): JsonLdNode[] {
  return flattenNodes(blocks.filter((b) => b.parsed != null).map((b) => b.parsed));
}

/** Localiza la entidad por @id y, si ningún nodo lo declara, por tipo compatible. */
export function findEntityNode(
  nodes: JsonLdNode[],
  expected: { id?: string; type: string }
): JsonLdNode | null {
  if (expected.id) {
    const byId = nodes.find((n) => n['@id'] === expected.id);
    if (byId) return byId;
  }
  // Por tipo gana el más cercano: un Resort es subtipo de Organization, pero no es "la" organización
  const rank = (node: JsonLdNode) => {
    const types = typesOf(node);
    if (types.includes(expected.type)) return 0;
    if (types.some((t) => familyOf(t) === familyOf(expected.type) && isCompatibleType(t, expected.type))) return 1;
    // Una organización esperada nunca se satisface con un hotel o negocio: en cadenas son entidades distintas
    if (familyOf(expected.type) !== 'Organization' && types.some((t) => isCompatibleType(t, expected.type))) return 2;
    return Infinity;
  };
  const candidates = nodes.map((node) => ({ node, r: rank(node) })).filter((c) => c.r !== Infinity);
  candidates.sort((a, b) => a.r - b.r);
  return candidates[0]?.node ?? null;
}

/** Nodo que comparte familia con lo esperado pero no es compatible (p. ej. LocalBusiness cuando se espera Hotel). */
export function findSupertypeNode(nodes: JsonLdNode[], expectedType: string): JsonLdNode | null {
  return (
    nodes.find((n) => typesOf(n).some((t) => t !== expectedType && isCompatibleType(expectedType, t) && t !== 'Organization')) ??
    null
  );
}
