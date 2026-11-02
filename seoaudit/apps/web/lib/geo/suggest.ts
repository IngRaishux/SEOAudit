import type { JsonModel } from './ai';
import { groupByFirstSegment, suggestStructure, type StructureSuggestion } from './detect';
import { extractLiteralFields } from './extract';
import { generateChainDescription, generateEntityDescription } from './generate';
import { locatePages, type GeoPage, type LocatedPage } from './pages';
import { mergeMissing, prefillEntity } from './prefill';
import type { ProfileEntity, ProfileInput, Texts } from './profile';
import type { SupportedType } from './rules';
import { detectSiteLanguages, entityId, normalizePath, normalizeScope } from './url';

interface DraftEntity {
  key: string;
  type: SupportedType;
  scope: string;
  parentKey: string | null;
  suggestedName?: string;
}

export interface ProfileSuggestion {
  profile: ProfileInput;
  structure: StructureSuggestion;
}

// Texto suficiente para extraer contacto y amenidades sin mandar todo el sitio al modelo
const EXTRACTION_PAGES = 3;

function draftEntities(structure: StructureSuggestion): DraftEntity[] {
  switch (structure.businessKind) {
    case 'hotel':
      return [{ key: 'main', type: 'Hotel', scope: '/', parentKey: null }];
    case 'hotel-chain':
      return [
        { key: 'org', type: 'Organization', scope: '/', parentKey: null },
        ...structure.properties.map((p) => ({
          key: p.prefix.replace(/\//g, '') || p.prefix,
          type: p.type,
          scope: p.prefix,
          parentKey: 'org',
          suggestedName: p.name,
        })),
      ];
    case 'local-business':
      return [{ key: 'main', type: 'LocalBusiness', scope: '/', parentKey: null }];
    default:
      return [{ key: 'main', type: 'Organization', scope: '/', parentKey: null }];
  }
}

function extractionText(pages: LocatedPage<DraftEntity>[], scope: string): string {
  const root = pages.filter((p) => p.path === normalizeScope(scope));
  const contact = pages.filter((p) => /contact|ubicaci|location/i.test(p.path));
  const chosen = [...new Set([...root, ...contact, ...pages])].slice(0, EXTRACTION_PAGES);
  const footers = [...new Set(chosen.map((p) => p.page.footerText ?? '').filter(Boolean))];
  return [...chosen.map((p) => p.page.bodyText ?? ''), ...footers].join('\n\n');
}

function mergeTexts(target: Texts, extra: Texts) {
  for (const [key, byLang] of Object.entries(extra) as [keyof Texts, Record<string, unknown>][]) {
    const current = ((target[key] as Record<string, unknown> | undefined) ?? {}) as Record<string, unknown>;
    for (const [lang, value] of Object.entries(byLang ?? {})) if (!current[lang]) current[lang] = value;
    (target as Record<string, unknown>)[key] = current;
  }
}

/** Arma un perfil borrador para que el usuario lo confirme; no se guarda aquí. */
export async function suggestProfile(model: JsonModel, origin: string, pages: GeoPage[]): Promise<ProfileSuggestion> {
  const okPages = pages.filter((p) => !p.statusCode || p.statusCode < 400);
  const languages = detectSiteLanguages(okPages.map((p) => p.url));
  const home =
    okPages.find((p) => normalizePath(p.url, languages).path === '/' && normalizePath(p.url, languages).lang === null) ??
    okPages.find((p) => normalizePath(p.url, languages).path === '/') ??
    okPages[0];

  const structure = await suggestStructure(model, {
    origin,
    homeTitle: home?.title ?? '',
    homeText: home?.bodyText ?? '',
    groups: groupByFirstSegment(okPages, languages),
  });
  const { defaultLanguage } = structure;
  const drafts = draftEntities(structure);
  const located = locatePages(okPages, drafts, languages);

  const entities: ProfileEntity[] = await Promise.all(
    drafts.map(async (draft) => {
      const entityPages = located.filter((p) => p.entity?.key === draft.key);
      const id = entityId(origin, draft.scope, draft.type);
      const { facts, texts } = prefillEntity(entityPages, { id, type: draft.type, scope: draft.scope }, defaultLanguage);
      const name = facts.name?.value ?? draft.suggestedName ?? home?.title ?? origin;

      const extracted = await extractLiteralFields(model, {
        entityName: name,
        type: draft.type,
        lang: defaultLanguage,
        text: extractionText(entityPages, draft.scope),
      });
      mergeMissing(facts, extracted.facts);
      mergeTexts(texts, extracted.texts);
      if (!facts.name && draft.suggestedName) facts.name = { value: draft.suggestedName, source: 'extracted' };

      return {
        key: draft.key,
        kind: 'internal' as const,
        type: draft.type,
        id,
        scope: draft.scope,
        parentKey: draft.parentKey,
        facts,
        texts,
      };
    })
  );

  await Promise.all(
    entities.map(async (entity) => {
      if (entity.texts.description?.[defaultLanguage]) return;
      const name = entity.facts.name?.value ?? origin;
      const description =
        structure.businessKind === 'hotel-chain' && entity.key === 'org'
          ? await generateChainDescription(model, {
              organizationName: name,
              lang: defaultLanguage,
              properties: entities.filter((e) => e.parentKey === 'org').map((e) => e.facts.name?.value ?? e.key),
            })
          : await generateEntityDescription(model, {
              name,
              type: entity.type,
              lang: defaultLanguage,
              sourceText: extractionText(
                located.filter((p) => p.entity?.key === entity.key),
                entity.scope ?? '/'
              ),
            });
      if (description) entity.texts.description = { ...entity.texts.description, [defaultLanguage]: description };
    })
  );

  return {
    profile: { defaultLanguage, languages: [...new Set([...languages, defaultLanguage])].sort(), businessKind: structure.businessKind, entities },
    structure,
  };
}
