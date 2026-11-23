import { NextResponse } from 'next/server';
import { resolveGeoContext, serverError } from '@/lib/geo/server/access';
import { hasGeoSignals } from '@/lib/geo/pages';
import { markUserEdits, validateProfile } from '@/lib/geo/profile';
import * as businessProfileRepository from '@/lib/repositories/businessProfileRepository';

export const runtime = 'nodejs';

type Params = { params: Promise<{ siteId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { siteId } = await params;
  try {
    const access = await resolveGeoContext(siteId);
    if (!access.ok) return access.response;
    const { profile, pages, origin } = access.context;
    return NextResponse.json({
      origin,
      profile,
      needsRecrawl: pages.length > 0 && !pages.some(hasGeoSignals),
    });
  } catch (error) {
    return serverError(error, 'Profile GET');
  }
}

export async function PUT(request: Request, { params }: Params) {
  const { siteId } = await params;
  try {
    const access = await resolveGeoContext(siteId);
    if (!access.ok) return access.response;
    const { organizationId, origin, profile: previous } = access.context;

    const validation = validateProfile(await request.json());
    if (!validation.ok) {
      return NextResponse.json({ error: 'Perfil inválido', details: validation.errors }, { status: 400 });
    }

    const profile = markUserEdits(previous, validation.profile);
    const saved = await businessProfileRepository.upsertProfile(organizationId, origin, profile);
    return NextResponse.json({ profile: saved });
  } catch (error) {
    return serverError(error, 'Profile PUT');
  }
}
