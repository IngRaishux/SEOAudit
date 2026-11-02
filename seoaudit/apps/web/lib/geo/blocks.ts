import { findEntityNode, findSupertypeNode, nodesFromBlocks, typesOf, type JsonLdNode, type StoredJsonLdBlock } from './jsonld';
import { applyIdRewrites, buildEntityNode, mergeNode, type Conflict, type DiffEntry, type Resolution } from './merge';
import { locatePages, type GeoPage, type LocatedPage } from './pages';
import { internalEntities, type ProfileEntity, type ProfileInput } from './profile';
import { omit } from './object';
import { normalizeScope } from './url';

export type Destination = 'global' | 'entity' | 'page';

export interface BlockItem {
  key: string;
  destination: Destination;
  entityKey: string;
  lang: string;
  /** Página cuyo JSON-LD existente se completó; null si el bloque es nuevo. */
  basePageUrl: string | null;
  /** Página destino para bloques por página. */
  pageUrl: string | null;
  block: Record<string, unknown>;
  script: string;
  diff: DiffEntry[];
  conflicts: Conflict[];
}

export interface SitePlan {
  items: BlockItem[];
  /** @id existente -> @id del perfil, para guardar como decisión del sitio. */
  idRewrites: Record<string, string>;
}

export type ResolutionsByItem = Record<string, Record<string, Resolution>>;

const CONTEXT = 'https://schema.org';

export function renderScript(block: Record<string, unknown>): string {
  return `<script type="application/ld+json">\n${JSON.stringify(block, null, 2)}\n</script>`;
}

interface Located {
  node: JsonLdNode;
  block: StoredJsonLdBlock;
}

function locateEntityNode(page: GeoPage, entity: ProfileEntity): Located | null {
  for (const block of page.jsonLd ?? []) {
    if (block.parsed == null) continue;
    const nodes = nodesFromBlocks([block]);
    const node =
      findEntityNode(nodes, { id: entity.id, type: entity.type }) ?? findSupertypeNode(nodes, entity.type);
    if (node) return { node, block };
  }
  return null;
}

/** Sustituye el nodo dentro de su bloque original para no perder los demás nodos del bloque. */
function replaceInBlock(parsed: unknown, original: JsonLdNode, replacement: JsonLdNode): Record<string, unknown> {
  if (parsed === original) {
    const context = (original as Record<string, unknown>)['@context'] ?? CONTEXT;
    return { '@context': context, ...omit(replacement as Record<string, unknown>, '@context') };
  }
  const visit = (v: unknown): unknown => {
    if (v === original) return replacement;
    if (Array.isArray(v)) return v.map(visit);
    if (v && typeof v === 'object') {
      const obj = v as Record<string, unknown>;
      return Array.isArray(obj['@graph']) ? { ...obj, '@graph': obj['@graph'].map(visit) } : obj;
    }
    return v;
  };
  const result = visit(parsed);
  return Array.isArray(result) ? { '@context': CONTEXT, '@graph': result } : (result as Record<string, unknown>);
}

function langOf(p: LocatedPage<ProfileEntity>, profile: ProfileInput) {
  return p.lang ?? profile.defaultLanguage;
}

function websiteNode(origin: string, root: ProfileEntity, url: string, lang: string): JsonLdNode {
  return {
    '@type': 'WebSite',
    '@id': `${origin}/#website`,
    url,
    name: root.facts.name?.value,
    inLanguage: lang,
    publisher: { '@id': root.id },
  };
}

function planOnce(
  profile: ProfileInput,
  pages: GeoPage[],
  resolutions: ResolutionsByItem,
  idRewrites: Record<string, string>
): SitePlan {
  const entities = internalEntities(profile);
  const located = locatePages(pages.filter((p) => !p.statusCode || p.statusCode < 400), entities, profile.languages);
  const languages = profile.languages.length ? profile.languages : [profile.defaultLanguage];
  const origin = new URL(entities[0].id).origin;
  const items: BlockItem[] = [];
  const discoveredRewrites: Record<string, string> = { ...idRewrites };

  const buildItem = (
    key: string,
    destination: Destination,
    entity: ProfileEntity,
    lang: string,
    url: string,
    base: { page: GeoPage; found: Located } | null,
    pageUrl: string | null
  ) => {
    const existing = base ? applyIdRewrites(base.found.node, idRewrites) : null;
    const profileNode = buildEntityNode(entity, profile, lang, url);
    const itemResolutions = resolutions[key] ?? {};
    const merged = mergeNode(existing, profileNode, itemResolutions);

    const idConflict = merged.conflicts.find((c) => c.path === '@id');
    if (idConflict?.resolution === 'profile' && typeof idConflict.existing === 'string') {
      discoveredRewrites[idConflict.existing] = entity.id;
    }

    let block: Record<string, unknown>;
    if (base) {
      const rewrittenParsed = applyIdRewrites(base.found.block.parsed, idRewrites);
      const originalInRewritten = findEntityNode(nodesFromBlocks([{ ...base.found.block, parsed: rewrittenParsed }]), {
        id: typeof existing?.['@id'] === 'string' ? existing['@id'] : entity.id,
        type: typesOf(existing ?? { '@type': entity.type })[0] ?? entity.type,
      });
      block = originalInRewritten ? replaceInBlock(rewrittenParsed, originalInRewritten, merged.node) : { '@context': CONTEXT, ...merged.node };
    } else if (destination === 'global') {
      block = { '@context': CONTEXT, '@graph': [merged.node, websiteNode(origin, entity, url, lang)] };
    } else {
      block = { '@context': CONTEXT, ...merged.node };
    }
    block = applyIdRewrites(block, idRewrites);

    items.push({
      key,
      destination,
      entityKey: entity.key,
      lang,
      basePageUrl: base?.page.url ?? null,
      pageUrl,
      block,
      script: renderScript(block),
      diff: merged.diff,
      conflicts: merged.conflicts,
    });
  };

  for (const entity of entities) {
    const scope = normalizeScope(entity.scope ?? '/');
    const destination: Destination = scope === '/' ? 'global' : 'entity';
    const entityPages = located.filter((p) => p.entity?.key === entity.key);

    for (const lang of languages) {
      const inLang = entityPages.filter((p) => langOf(p, profile) === lang);
      if (inLang.length === 0) continue;
      const root = inLang.find((p) => p.path === scope);
      const url = root?.page.url ?? inLang[0].page.url;
      const rootFound = root ? locateEntityNode(root.page, entity) : null;
      buildItem(
        `${destination}:${entity.key}:${lang}`,
        destination,
        entity,
        lang,
        url,
        root && rootFound ? { page: root.page, found: rootFound } : null,
        null
      );

      // Páginas del scope que declaran su propia variante del nodo necesitan su propio bloque
      const rootCanonical = rootFound ? JSON.stringify(rootFound.node) : null;
      for (const p of inLang) {
        if (p === root) continue;
        const found = locateEntityNode(p.page, entity);
        if (!found || JSON.stringify(found.node) === rootCanonical) continue;
        buildItem(`page:${p.page.url}`, 'page', entity, lang, url, { page: p.page, found }, p.page.url);
      }
    }
  }
  return { items, idRewrites: discoveredRewrites };
}

/**
 * Bloques del sitio agrupados por destino. Si el usuario acepta un nuevo @id en un bloque,
 * se vuelve a planear para que todas las referencias del sitio usen el nuevo @id.
 */
export function planSiteBlocks(
  profile: ProfileInput,
  pages: GeoPage[],
  resolutions: ResolutionsByItem = {},
  acceptedIdRewrites: Record<string, string> = {}
): SitePlan {
  const first = planOnce(profile, pages, resolutions, acceptedIdRewrites);
  const grew = Object.keys(first.idRewrites).length > Object.keys(acceptedIdRewrites).length;
  return grew ? planOnce(profile, pages, resolutions, first.idRewrites) : first;
}
