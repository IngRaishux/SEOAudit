import { NextResponse } from 'next/server';
import { resolveGeoContext, serverError } from '@/lib/geo/server/access';
import { geminiJsonModel } from '@/lib/geo/ai';
import { hasGeoSignals } from '@/lib/geo/pages';
import { suggestProfile } from '@/lib/geo/suggest';

export const runtime = 'nodejs';
export const maxDuration = 300;

// Devuelve un borrador; solo PUT /profile lo guarda tras la confirmación del usuario
export async function POST(_request: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  try {
    const access = await resolveGeoContext(siteId);
    if (!access.ok) return access.response;
    const { origin, pages } = access.context;

    if (!pages.some(hasGeoSignals)) {
      return NextResponse.json({ error: 'Vuelve a crawlear el sitio para obtener las señales GEO' }, { status: 409 });
    }

    const suggestion = await suggestProfile(geminiJsonModel(), origin, pages);
    return NextResponse.json(suggestion);
  } catch (error) {
    return serverError(error, 'Profile suggest');
  }
}
