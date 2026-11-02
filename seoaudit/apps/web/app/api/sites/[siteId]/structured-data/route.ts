import { NextResponse } from 'next/server';
import { resolveGeoContext, serverError } from '@/lib/geo/server/access';
import { buildStructuredDataReport } from '@/lib/geo/server/structuredData';

export const runtime = 'nodejs';

export async function GET(_request: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  try {
    const access = await resolveGeoContext(siteId);
    if (!access.ok) return access.response;
    return NextResponse.json(buildStructuredDataReport(access.context));
  } catch (error) {
    return serverError(error, 'Structured data GET');
  }
}
