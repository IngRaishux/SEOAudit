import { auditPage, findLanguageSpecificIds, type PageAudit } from '@/lib/geo/audit';
import { planSiteBlocks, type ResolutionsByItem, type SitePlan } from '@/lib/geo/blocks';
import { hasGeoSignals, locatePages } from '@/lib/geo/pages';
import { internalEntities, type ProfileInput } from '@/lib/geo/profile';
import { omit } from '@/lib/geo/object';
import { detectSiteLanguages } from '@/lib/geo/url';
import type { GeoContext } from './access';

export interface StructuredDataReport {
  hasProfile: boolean;
  needsRecrawl: boolean;
  summary: Record<PageAudit['status'], number>;
  pages: Array<Omit<PageAudit, 'node'>>;
  languageIdFindings: ReturnType<typeof findLanguageSpecificIds>;
  plan: SitePlan | null;
}

export function buildStructuredDataReport(
  context: GeoContext,
  resolutions: ResolutionsByItem = {},
  acceptedIdRewrites?: Record<string, string>
): StructuredDataReport {
  const pages = context.pages.filter((p) => !p.statusCode || p.statusCode < 400);
  const profile: ProfileInput | null = context.profile;
  const languages = profile?.languages.length ? profile.languages : detectSiteLanguages(pages.map((p) => p.url));
  const located = locatePages(pages, profile ? internalEntities(profile) : [], languages);

  const audits = located.map((l) => omit(auditPage(l, profile), 'node'));
  const summary = { missing: 0, invalid: 0, 'wrong-type': 0, incomplete: 0, inconsistent: 0, ok: 0 };
  for (const a of audits) summary[a.status]++;

  return {
    hasProfile: !!profile,
    needsRecrawl: pages.length > 0 && !pages.some(hasGeoSignals),
    summary,
    pages: audits,
    languageIdFindings: findLanguageSpecificIds(pages, languages, profile),
    plan: profile
      ? planSiteBlocks(profile, pages, resolutions, acceptedIdRewrites ?? context.profile?.acceptedIdRewrites ?? {})
      : null,
  };
}
