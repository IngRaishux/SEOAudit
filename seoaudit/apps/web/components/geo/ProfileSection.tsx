'use client';

import { useEffect, useState } from 'react';
import type { BusinessKind, Facts, ProfileEntity, ProfileInput, Source, Texts } from '@/lib/geo/profile';
import { BUSINESS_KINDS } from '@/lib/geo/profile';
import { SUPPORTED_TYPES, familyOf } from '@/lib/geo/rules';
import { entityId } from '@/lib/geo/url';
import { toastError, toastSuccess } from '@/lib/toast';
import { Alert, requestJson, type Translate } from './shared';

interface ProfileResponse {
  origin: string;
  profile: (ProfileInput & { _id: string }) | null;
  needsRecrawl: boolean;
}

type FactKey = keyof Facts;
type SimpleFact = 'name' | 'url' | 'telephone' | 'email' | 'logo' | 'image' | 'openingHours' | 'priceRange' | 'checkinTime' | 'checkoutTime';

const SOURCE_BADGE: Record<Source, string> = {
  user: 'badge-success',
  'existing-jsonld': 'badge-info',
  extracted: 'badge-warning',
  generated: 'badge-warning',
};

const ADDRESS_FIELDS = ['streetAddress', 'addressLocality', 'addressRegion', 'postalCode', 'addressCountry'] as const;

function toProfileInput(profile: ProfileInput): ProfileInput {
  return {
    defaultLanguage: profile.defaultLanguage,
    languages: profile.languages,
    businessKind: profile.businessKind,
    entities: profile.entities,
  };
}

export function ProfileSection({ siteId, t, onSaved }: { siteId: string; t: Translate; onSaved: () => void }) {
  const [origin, setOrigin] = useState('');
  const [profile, setProfile] = useState<ProfileInput | null>(null);
  const [isDraft, setIsDraft] = useState(false);
  const [needsRecrawl, setNeedsRecrawl] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<'suggest' | 'save' | null>(null);

  useEffect(() => {
    requestJson<ProfileResponse>(`/api/sites/${siteId}/profile`)
      .then((data) => {
        setOrigin(data.origin);
        setNeedsRecrawl(data.needsRecrawl);
        setProfile(data.profile ? toProfileInput(data.profile) : null);
      })
      .catch((error) => toastError(error.message, t('geo.loadError')))
      .finally(() => setLoading(false));
  }, [siteId, t]);

  const suggest = async () => {
    setBusy('suggest');
    try {
      const data = await requestJson<{ profile: ProfileInput }>(`/api/sites/${siteId}/profile/suggest`, { method: 'POST' });
      setProfile(data.profile);
      setIsDraft(true);
    } catch (error) {
      toastError(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(null);
    }
  };

  const save = async () => {
    if (!profile) return;
    setBusy('save');
    try {
      const data = await requestJson<{ profile: ProfileInput }>(`/api/sites/${siteId}/profile`, {
        method: 'PUT',
        body: JSON.stringify(profile),
      });
      setProfile(toProfileInput(data.profile));
      setIsDraft(false);
      toastSuccess(t('geo.saved'));
      onSaved();
    } catch (error) {
      toastError(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(null);
    }
  };

  const updateEntity = (index: number, update: (entity: ProfileEntity) => ProfileEntity) => {
    setProfile((p) => (p ? { ...p, entities: p.entities.map((e, i) => (i === index ? update(e) : e)) } : p));
  };

  const removeEntity = (index: number) => {
    setProfile((p) => {
      if (!p) return p;
      const removed = p.entities[index];
      const entities = p.entities
        .filter((_, i) => i !== index)
        .map((e) => (e.parentKey === removed.key ? { ...e, parentKey: null } : e));
      return { ...p, entities };
    });
  };

  const addEntity = (kind: 'internal' | 'external') => {
    setProfile((p) => {
      if (!p) return p;
      const key = `${kind === 'external' ? 'ext' : 'prop'}-${p.entities.length + 1}`;
      const root = p.entities.find((e) => e.kind === 'internal' && (e.scope ?? '/') === '/');
      const entity: ProfileEntity =
        kind === 'external'
          ? { key, kind, type: 'Organization', id: 'https://', scope: null, parentKey: null, facts: {}, texts: {} }
          : {
              key,
              kind,
              type: 'Hotel',
              id: entityId(origin, `/${key}/`, 'Hotel'),
              scope: `/${key}/`,
              parentKey: root?.key ?? null,
              facts: {},
              texts: {},
            };
      return { ...p, entities: [...p.entities, entity] };
    });
  };

  const confirmAll = () => {
    setProfile((p) =>
      p
        ? {
            ...p,
            entities: p.entities.map((e) => ({
              ...e,
              facts: Object.fromEntries(Object.entries(e.facts).map(([k, f]) => [k, { ...f!, source: 'user' }])) as Facts,
              texts: Object.fromEntries(
                Object.entries(e.texts).map(([k, byLang]) => [
                  k,
                  Object.fromEntries(Object.entries(byLang ?? {}).map(([l, v]) => [l, { ...v, source: 'user' }])),
                ])
              ) as Texts,
            })),
          }
        : p
    );
  };

  if (loading) return <span className="loading loading-spinner loading-lg text-primary" />;

  return (
    <div className="space-y-4">
      {needsRecrawl && <Alert kind="warning">{t('geo.recrawl')}</Alert>}
      <p className="text-sm text-base-content/70">{t('geo.profile.intro')}</p>

      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-primary btn-sm" onClick={suggest} disabled={busy !== null || needsRecrawl}>
          {busy === 'suggest' && <span className="loading loading-spinner loading-sm" />}
          {busy === 'suggest' ? t('geo.profile.suggesting') : profile ? t('geo.profile.resuggest') : t('geo.profile.suggest')}
        </button>
        {profile && (
          <>
            <button type="button" className="btn btn-ghost btn-sm" onClick={confirmAll}>
              {t('geo.profile.confirmAll')}
            </button>
            <button type="button" className="btn btn-success btn-sm" onClick={save} disabled={busy !== null}>
              {busy === 'save' && <span className="loading loading-spinner loading-sm" />}
              {t('geo.save')}
            </button>
          </>
        )}
      </div>

      {isDraft && <Alert kind="info">{t('geo.profile.draft')}</Alert>}

      {profile && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="form-control">
              <span className="label-text mb-1">{t('geo.profile.businessKind')}</span>
              <select
                className="select select-bordered select-sm"
                value={profile.businessKind}
                onChange={(e) => setProfile({ ...profile, businessKind: e.target.value as BusinessKind })}
              >
                {BUSINESS_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {t(`geo.profile.kinds.${k}`)}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-control">
              <span className="label-text mb-1">{t('geo.profile.defaultLanguage')}</span>
              <input
                className="input input-bordered input-sm"
                value={profile.defaultLanguage}
                onChange={(e) => setProfile({ ...profile, defaultLanguage: e.target.value.trim() })}
              />
            </label>
            <label className="form-control">
              <span className="label-text mb-1">{t('geo.profile.languages')}</span>
              <input
                className="input input-bordered input-sm"
                defaultValue={profile.languages.join(', ')}
                onBlur={(e) =>
                  setProfile({ ...profile, languages: e.target.value.split(',').map((l) => l.trim().toLowerCase()).filter(Boolean) })
                }
              />
            </label>
          </div>

          <h3 className="font-semibold">{t('geo.profile.entities')}</h3>
          <div className="space-y-4">
            {profile.entities.map((entity, index) => (
              <EntityCard
                key={entity.key}
                entity={entity}
                profile={profile}
                origin={origin}
                t={t}
                onChange={(update) => updateEntity(index, update)}
                onRemove={() => removeEntity(index)}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => addEntity('internal')}>
              + {t('geo.profile.addProperty')}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => addEntity('external')}>
              + {t('geo.profile.addExternal')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function SourceBadge({ source, t, onConfirm }: { source: Source; t: Translate; onConfirm: () => void }) {
  return (
    <span className="flex items-center gap-1">
      <span className={`badge badge-sm ${SOURCE_BADGE[source]}`}>{t(`geo.profile.sources.${source}`)}</span>
      {source !== 'user' && (
        <button type="button" className="btn btn-ghost btn-xs" onClick={onConfirm}>
          {t('geo.profile.confirm')}
        </button>
      )}
    </span>
  );
}

function EntityCard({
  entity,
  profile,
  origin,
  t,
  onChange,
  onRemove,
}: {
  entity: ProfileEntity;
  profile: ProfileInput;
  origin: string;
  t: Translate;
  onChange: (update: (e: ProfileEntity) => ProfileEntity) => void;
  onRemove: () => void;
}) {
  const [lang, setLang] = useState(profile.defaultLanguage);
  const family = familyOf(entity.type);
  const lodging = family === 'LodgingBusiness';
  const local = lodging || family === 'LocalBusiness';
  const external = entity.kind === 'external';
  const languages = profile.languages.length ? profile.languages : [profile.defaultLanguage];

  const setFact = (key: FactKey, value: unknown) =>
    onChange((e) => {
      const facts = { ...e.facts } as Record<string, unknown>;
      const empty = value === '' || value === undefined || value === null || (Array.isArray(value) && value.length === 0);
      if (empty) delete facts[key];
      else facts[key] = { value, source: 'user' };
      return { ...e, facts: facts as Facts };
    });

  const confirmFact = (key: FactKey) =>
    onChange((e) => ({ ...e, facts: { ...e.facts, [key]: { ...e.facts[key]!, source: 'user' } } }));

  const setText = (key: keyof Texts, value: unknown) =>
    onChange((e) => {
      const byLang = { ...((e.texts[key] as Record<string, unknown>) ?? {}) };
      const empty = value === '' || (Array.isArray(value) && value.length === 0);
      if (empty) delete byLang[lang];
      else byLang[lang] = { value, source: 'user' };
      return { ...e, texts: { ...e.texts, [key]: byLang } };
    });

  const confirmText = (key: keyof Texts) =>
    onChange((e) => {
      const byLang = { ...((e.texts[key] as Record<string, { value: unknown; source: Source }>) ?? {}) };
      if (byLang[lang]) byLang[lang] = { ...byLang[lang], source: 'user' };
      return { ...e, texts: { ...e.texts, [key]: byLang } };
    });

  // En entidades internas el @id se deriva del scope y del tipo
  const setStructure = (patch: Partial<Pick<ProfileEntity, 'type' | 'scope'>>) =>
    onChange((e) => {
      const next = { ...e, ...patch };
      return external ? next : { ...next, id: entityId(origin, next.scope ?? '/', next.type) };
    });

  const simple = (key: SimpleFact) => {
    const fact = entity.facts[key];
    return (
      <div key={key} className="form-control">
        <span className="label-text mb-1 flex justify-between gap-2">
          {t(`geo.profile.fields.${key}`)}
          {fact && <SourceBadge source={fact.source} t={t} onConfirm={() => confirmFact(key)} />}
        </span>
        <input
          aria-label={t(`geo.profile.fields.${key}`)}
          className={`input input-bordered input-sm ${fact && fact.source !== 'user' ? 'input-warning' : ''}`}
          value={(fact?.value as string | undefined) ?? ''}
          onChange={(e) => setFact(key, e.target.value)}
        />
      </div>
    );
  };

  const address = entity.facts.address;
  const geo = entity.facts.geo;
  const parents = profile.entities.filter((e) => e.key !== entity.key && familyOf(e.type) === 'Organization' && e.type === 'Organization');
  const text = <K extends keyof Texts>(key: K) =>
    (entity.texts[key] as Record<string, { value: unknown; source: Source }> | undefined)?.[lang];

  return (
    <div className="card bg-base-100 border border-base-300">
      <div className="card-body p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{entity.facts.name?.value ?? entity.key}</span>
            {external && <span className="badge badge-ghost badge-sm">{t('geo.profile.external')}</span>}
            <code className="text-xs text-base-content/60 break-all">{entity.id}</code>
          </div>
          <button type="button" className="btn btn-ghost btn-xs text-error" onClick={onRemove}>
            {t('geo.profile.remove')}
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <label className="form-control">
            <span className="label-text mb-1">{t('geo.profile.type')}</span>
            <select
              className="select select-bordered select-sm"
              value={entity.type}
              onChange={(e) => setStructure({ type: e.target.value as ProfileEntity['type'] })}
            >
              {SUPPORTED_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          {external ? (
            <label className="form-control">
              <span className="label-text mb-1">@id</span>
              <input
                className="input input-bordered input-sm"
                value={entity.id}
                onChange={(e) => onChange((x) => ({ ...x, id: e.target.value.trim() }))}
              />
            </label>
          ) : (
            <label className="form-control">
              <span className="label-text mb-1">{t('geo.profile.scope')}</span>
              <input
                className="input input-bordered input-sm"
                value={entity.scope ?? '/'}
                onChange={(e) => setStructure({ scope: e.target.value })}
              />
            </label>
          )}
          <label className="form-control">
            <span className="label-text mb-1">{t('geo.profile.parent')}</span>
            <select
              className="select select-bordered select-sm"
              value={entity.parentKey ?? ''}
              onChange={(e) => onChange((x) => ({ ...x, parentKey: e.target.value || null }))}
            >
              <option value="">{t('geo.profile.none')}</option>
              {parents.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.facts.name?.value ?? p.key}
                </option>
              ))}
            </select>
          </label>
        </div>

        <h4 className="text-sm font-semibold pt-2">{t('geo.profile.facts')}</h4>
        <div className="grid gap-3 md:grid-cols-2">
          {simple('name')}
          {simple('url')}
          {!external && (
            <>
              {simple('telephone')}
              {simple('email')}
              {simple('logo')}
              {simple('image')}
              {local && simple('openingHours')}
              {local && simple('priceRange')}
              {lodging && simple('checkinTime')}
              {lodging && simple('checkoutTime')}
            </>
          )}
        </div>

        {!external && (
          <>
            <div className="grid gap-3 md:grid-cols-5">
              {ADDRESS_FIELDS.map((field) => (
                <label key={field} className="form-control">
                  <span className="label-text mb-1">{t(`geo.profile.fields.${field}`)}</span>
                  <input
                    className={`input input-bordered input-sm ${address && address.source !== 'user' ? 'input-warning' : ''}`}
                    value={address?.value[field] ?? ''}
                    onChange={(e) => {
                      const value = { ...(address?.value ?? {}), [field]: e.target.value || undefined };
                      setFact('address', Object.values(value).some(Boolean) ? value : undefined);
                    }}
                  />
                </label>
              ))}
            </div>
            {address && <SourceBadge source={address.source} t={t} onConfirm={() => confirmFact('address')} />}

            <div className="grid gap-3 md:grid-cols-4 items-end">
              <CoordinateInput
                key={`lat-${geo?.value.latitude}`}
                label={t('geo.profile.fields.latitude')}
                value={geo?.value.latitude}
                onChange={(latitude) =>
                  setFact('geo', latitude === undefined ? undefined : { latitude, longitude: geo?.value.longitude ?? 0 })
                }
              />
              <CoordinateInput
                key={`lng-${geo?.value.longitude}`}
                label={t('geo.profile.fields.longitude')}
                value={geo?.value.longitude}
                onChange={(longitude) =>
                  setFact('geo', longitude === undefined ? undefined : { latitude: geo?.value.latitude ?? 0, longitude })
                }
              />
              {lodging && (
                <>
                  <NumberInput label={t('geo.profile.fields.starRating')} value={entity.facts.starRating?.value} onChange={(v) => setFact('starRating', v)} />
                  <NumberInput label={t('geo.profile.fields.numberOfRooms')} value={entity.facts.numberOfRooms?.value} onChange={(v) => setFact('numberOfRooms', v)} />
                </>
              )}
            </div>
            {geo && <SourceBadge source={geo.source} t={t} onConfirm={() => confirmFact('geo')} />}

            <div className="form-control">
              <span className="label-text mb-1 flex justify-between gap-2">
                {t('geo.profile.fields.sameAs')}
                {entity.facts.sameAs && <SourceBadge source={entity.facts.sameAs.source} t={t} onConfirm={() => confirmFact('sameAs')} />}
              </span>
              <textarea
                aria-label={t('geo.profile.fields.sameAs')}
                className="textarea textarea-bordered textarea-sm"
                rows={3}
                value={entity.facts.sameAs?.value.join('\n') ?? ''}
                onChange={(e) => setFact('sameAs', e.target.value.split('\n').map((l) => l.trim()).filter(Boolean))}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <h4 className="text-sm font-semibold mr-2">{t('geo.profile.texts')}</h4>
              <div role="tablist" className="tabs tabs-boxed tabs-sm">
                {languages.map((l) => (
                  <button key={l} type="button" role="tab" className={`tab ${l === lang ? 'tab-active' : ''}`} onClick={() => setLang(l)}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-control">
              <span className="label-text mb-1 flex justify-between gap-2">
                {t('geo.profile.fields.description')}
                {text('description') && <SourceBadge source={text('description')!.source} t={t} onConfirm={() => confirmText('description')} />}
              </span>
              <textarea
                aria-label={t('geo.profile.fields.description')}
                className={`textarea textarea-bordered textarea-sm ${text('description') && text('description')!.source !== 'user' ? 'textarea-warning' : ''}`}
                rows={2}
                value={(text('description')?.value as string | undefined) ?? ''}
                onChange={(e) => setText('description', e.target.value)}
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="form-control">
                <span className="label-text mb-1 flex justify-between gap-2">
                  {t('geo.profile.fields.alternateName')}
                  {text('alternateName') && <SourceBadge source={text('alternateName')!.source} t={t} onConfirm={() => confirmText('alternateName')} />}
                </span>
                <input
                  aria-label={t('geo.profile.fields.alternateName')}
                  className="input input-bordered input-sm"
                  value={((text('alternateName')?.value as string[] | undefined) ?? []).join(', ')}
                  onChange={(e) => setText('alternateName', e.target.value.split(',').map((v) => v.trim()).filter(Boolean))}
                />
              </div>
              {lodging && (
                <div className="form-control">
                  <span className="label-text mb-1 flex justify-between gap-2">
                    {t('geo.profile.fields.amenities')}
                    {text('amenities') && <SourceBadge source={text('amenities')!.source} t={t} onConfirm={() => confirmText('amenities')} />}
                  </span>
                  <textarea
                    aria-label={t('geo.profile.fields.amenities')}
                    className="textarea textarea-bordered textarea-sm"
                    rows={4}
                    value={((text('amenities')?.value as string[] | undefined) ?? []).join('\n')}
                    onChange={(e) => setText('amenities', e.target.value.split('\n').map((v) => v.trim()).filter(Boolean))}
                  />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CoordinateInput({ label, value, onChange }: { label: string; value?: number; onChange: (v: number | undefined) => void }) {
  const [raw, setRaw] = useState(value?.toString() ?? '');
  return (
    <label className="form-control">
      <span className="label-text mb-1">{label}</span>
      <input
        className="input input-bordered input-sm"
        inputMode="decimal"
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        onBlur={() => {
          const n = parseFloat(raw);
          onChange(raw.trim() === '' || !Number.isFinite(n) ? undefined : n);
        }}
      />
    </label>
  );
}

function NumberInput({ label, value, onChange }: { label: string; value?: number; onChange: (v: number | undefined) => void }) {
  return (
    <label className="form-control">
      <span className="label-text mb-1">{label}</span>
      <input
        type="number"
        className="input input-bordered input-sm"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
      />
    </label>
  );
}
