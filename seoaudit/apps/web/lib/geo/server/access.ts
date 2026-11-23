import { NextResponse } from 'next/server';
import { requireSiteAccess } from '@/lib/auth/orgAccess';
import type { OrgAction } from '@/lib/auth/permissions';
import * as siteRepository from '@/lib/repositories/siteRepository';
import * as pageRepository from '@/lib/repositories/pageRepository';
import * as businessProfileRepository from '@/lib/repositories/businessProfileRepository';
import type { GeoPage } from '@/lib/geo/pages';
import { ModelUnavailableError } from '@/lib/geo/ai';
import type { LlmsTxtCapture } from '@seo-optimizer/crawler';

export interface GeoContext {
  organizationId: string;
  origin: string;
  /** Site del crawl más reciente del origen; puede no ser el siteId de la URL. */
  siteId: string;
  llmsTxt: LlmsTxtCapture | null;
  pages: GeoPage[];
  profile: businessProfileRepository.StoredBusinessProfile | null;
}

type Access = { ok: true; context: GeoContext } | { ok: false; response: NextResponse };

const deny = (error: string, status: number): Access => ({ ok: false, response: NextResponse.json({ error }, { status }) });

/** Valida sesión y el permiso `action` en la organización del sitio, y resuelve perfil + páginas por su origen. */
export async function resolveGeoContext(siteId: string, action: OrgAction): Promise<Access> {
  const access = await requireSiteAccess(siteId, action);
  if (!access.ok) return access;

  const organizationId = access.organizationId;
  const site = (await siteRepository.getSiteById(siteId)) as { _id: unknown; url: string } | null;
  if (!site) return deny('Site not found', 404);

  const origin = new URL(site.url).origin;
  const latest = (await siteRepository.getLatestCompletedSiteForOrigin(organizationId, origin)) as {
    _id: unknown;
    llmsTxt?: LlmsTxtCapture;
  } | null;
  const effectiveSiteId = String(latest?._id ?? site._id);

  const [pages, profile] = await Promise.all([
    pageRepository.listGeoPagesBySite(effectiveSiteId),
    businessProfileRepository.getProfile(organizationId, origin),
  ]);

  return {
    ok: true,
    context: {
      organizationId,
      origin,
      siteId: effectiveSiteId,
      llmsTxt: latest?.llmsTxt ?? null,
      pages: (pages as unknown as GeoPage[]).map((p) => ({ ...p, _id: String(p._id) })),
      profile,
    },
  };
}

export function serverError(error: unknown, label: string) {
  if (error instanceof ModelUnavailableError) {
    return NextResponse.json({ error: error.message, reason: error.reason }, { status: 503 });
  }
  console.error(`${label} error:`, error);
  return NextResponse.json(
    { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
    { status: 500 }
  );
}
