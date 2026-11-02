'use client';

import { useState } from 'react';
import { LlmsTxtSection } from './LlmsTxtSection';
import { ProfileSection } from './ProfileSection';
import { StructuredDataSection } from './StructuredDataSection';
import type { Translate } from './shared';

type Section = 'profile' | 'structuredData' | 'llmsTxt';

const SECTIONS: Section[] = ['profile', 'structuredData', 'llmsTxt'];

export function GeoTab({ siteId, t }: { siteId: string; t: Translate }) {
  const [section, setSection] = useState<Section>('profile');
  // Guardar el perfil cambia los reportes de las otras secciones
  const [reloadKey, setReloadKey] = useState(0);

  return (
    <div className="space-y-4">
      <div role="tablist" className="tabs tabs-boxed w-fit">
        {SECTIONS.map((s) => (
          <button key={s} type="button" role="tab" className={`tab ${section === s ? 'tab-active' : ''}`} onClick={() => setSection(s)}>
            {t(`geo.sections.${s}`)}
          </button>
        ))}
      </div>
      {section === 'profile' && <ProfileSection siteId={siteId} t={t} onSaved={() => setReloadKey((k) => k + 1)} />}
      {section === 'structuredData' && <StructuredDataSection siteId={siteId} t={t} reloadKey={reloadKey} />}
      {section === 'llmsTxt' && <LlmsTxtSection siteId={siteId} t={t} reloadKey={reloadKey} />}
    </div>
  );
}
