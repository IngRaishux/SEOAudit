import { z } from 'zod';
import { SUPPORTED_TYPES } from './rules';
import { normalizeScope } from './url';

export const SOURCES = ['user', 'existing-jsonld', 'extracted', 'generated'] as const;
export type Source = (typeof SOURCES)[number];

export const BUSINESS_KINDS = ['hotel', 'hotel-chain', 'local-business', 'organization'] as const;
export type BusinessKind = (typeof BUSINESS_KINDS)[number];

const sourced = <T extends z.ZodTypeAny>(value: T) => z.object({ value, source: z.enum(SOURCES) });

const addressSchema = z.object({
  streetAddress: z.string().optional(),
  addressLocality: z.string().optional(),
  addressRegion: z.string().optional(),
  postalCode: z.string().optional(),
  addressCountry: z.string().optional(),
});

const geoSchema = z.object({ latitude: z.number(), longitude: z.number() });

export const factsSchema = z
  .object({
    name: sourced(z.string()),
    url: sourced(z.string().url()),
    telephone: sourced(z.string()),
    email: sourced(z.string()),
    address: sourced(addressSchema),
    geo: sourced(geoSchema),
    logo: sourced(z.string()),
    image: sourced(z.string()),
    sameAs: sourced(z.array(z.string())),
    openingHours: sourced(z.string()),
    checkinTime: sourced(z.string()),
    checkoutTime: sourced(z.string()),
    priceRange: sourced(z.string()),
    starRating: sourced(z.number()),
    numberOfRooms: sourced(z.number()),
    petsAllowed: sourced(z.boolean()),
  })
  .partial();

const perLanguage = <T extends z.ZodTypeAny>(value: T) => z.record(z.string(), sourced(value));

export const textsSchema = z
  .object({
    description: perLanguage(z.string()),
    alternateName: perLanguage(z.array(z.string())),
    amenities: perLanguage(z.array(z.string())),
  })
  .partial();

export const entitySchema = z.object({
  key: z.string().min(1),
  kind: z.enum(['internal', 'external']),
  type: z.enum(SUPPORTED_TYPES),
  id: z.string().url(),
  scope: z.string().nullable().optional(),
  parentKey: z.string().nullable().optional(),
  facts: factsSchema.default({}),
  texts: textsSchema.default({}),
});

export const profileInputSchema = z.object({
  defaultLanguage: z.string().min(2),
  languages: z.array(z.string()).default([]),
  businessKind: z.enum(BUSINESS_KINDS),
  entities: z.array(entitySchema).min(1),
});

export type Facts = z.infer<typeof factsSchema>;
export type Texts = z.infer<typeof textsSchema>;
export type ProfileEntity = z.infer<typeof entitySchema>;
export type ProfileInput = z.infer<typeof profileInputSchema>;
export type FactKey = keyof Facts;
export type TextKey = keyof Texts;
export type Sourced<T> = { value: T; source: Source };

export interface BusinessProfileData extends ProfileInput {
  organizationId: string;
  origin: string;
}

export type ProfileValidation = { ok: true; profile: ProfileInput } | { ok: false; errors: string[] };

/** Valida forma (zod) y coherencia del grafo: padres existentes, scopes únicos, externas sin scope. */
export function validateProfile(input: unknown): ProfileValidation {
  const parsed = profileInputSchema.safeParse(input);
  if (!parsed.success) {
    const errors = parsed.error.issues.map((issue) => {
      if (issue.code === 'invalid_enum_value' && issue.path.at(-1) === 'type') {
        return `${issue.path.join('.')}: tipo no soportado; permitidos: ${SUPPORTED_TYPES.join(', ')}`;
      }
      return `${issue.path.join('.')}: ${issue.message}`;
    });
    return { ok: false, errors };
  }

  const profile = parsed.data;
  const errors: string[] = [];
  const keys = new Set<string>();
  const scopes = new Set<string>();

  for (const entity of profile.entities) {
    if (keys.has(entity.key)) errors.push(`entidad ${entity.key}: key duplicada`);
    keys.add(entity.key);

    if (entity.kind === 'external') {
      if (entity.scope) errors.push(`entidad ${entity.key}: una entidad externa no tiene scope`);
      continue;
    }
    if (!entity.scope) {
      errors.push(`entidad ${entity.key}: una entidad interna requiere scope`);
      continue;
    }
    const scope = normalizeScope(entity.scope);
    if (scopes.has(scope)) errors.push(`entidad ${entity.key}: scope ${scope} repetido`);
    scopes.add(scope);
  }

  for (const entity of profile.entities) {
    if (entity.parentKey && !keys.has(entity.parentKey)) {
      errors.push(`entidad ${entity.key}: parentKey ${entity.parentKey} no existe`);
    }
    if (entity.parentKey === entity.key) errors.push(`entidad ${entity.key}: no puede ser su propio padre`);
  }

  return errors.length ? { ok: false, errors } : { ok: true, profile };
}

export function internalEntities(profile: Pick<ProfileInput, 'entities'>): ProfileEntity[] {
  return profile.entities.filter((e) => e.kind === 'internal');
}

/** Texto en el idioma pedido, con respaldo al idioma por defecto. */
export function textIn<K extends TextKey>(
  entity: ProfileEntity,
  key: K,
  lang: string,
  defaultLanguage: string
): NonNullable<Texts[K]>[string]['value'] | undefined {
  const byLang = entity.texts[key] as Record<string, Sourced<unknown>> | undefined;
  return (byLang?.[lang] ?? byLang?.[defaultLanguage])?.value as NonNullable<Texts[K]>[string]['value'] | undefined;
}

function sameValue(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Todo valor que el usuario cambió respecto a lo guardado queda con fuente `user`,
 * sin depender de que el cliente lo marque. Los valores nuevos conservan la fuente enviada
 * (la sugerencia trae `extracted`/`generated`; confirmar en la UI la cambia a `user`).
 */
export function markUserEdits(previous: ProfileInput | null, next: ProfileInput): ProfileInput {
  const before = new Map((previous?.entities ?? []).map((e) => [e.key, e]));
  return {
    ...next,
    entities: next.entities.map((entity) => {
      const prev = before.get(entity.key);
      const facts = Object.fromEntries(
        Object.entries(entity.facts).map(([key, fact]) => {
          const old = (prev?.facts as Record<string, Sourced<unknown>> | undefined)?.[key];
          const edited = !!old && !sameValue(old.value, fact!.value);
          return [key, edited && fact!.source !== 'user' ? { ...fact!, source: 'user' as const } : fact];
        })
      ) as Facts;
      const texts = Object.fromEntries(
        Object.entries(entity.texts).map(([key, byLang]) => [
          key,
          Object.fromEntries(
            Object.entries(byLang ?? {}).map(([lang, text]) => {
              const old = (prev?.texts as Record<string, Record<string, Sourced<unknown>>> | undefined)?.[key]?.[lang];
              const edited = !!old && !sameValue(old.value, text.value);
              return [lang, edited && text.source !== 'user' ? { ...text, source: 'user' as const } : text];
            })
          ),
        ])
      ) as Texts;
      return { ...entity, facts, texts };
    }),
  };
}
