import { NextResponse } from 'next/server';
import { z } from 'zod';
import { resolveGeoContext, serverError } from '@/lib/geo/server/access';
import { buildStructuredDataReport } from '@/lib/geo/server/structuredData';
import * as businessProfileRepository from '@/lib/repositories/businessProfileRepository';

export const runtime = 'nodejs';

const bodySchema = z.object({
  resolutions: z.record(z.string(), z.record(z.string(), z.enum(['keep', 'profile']))),
});

// Las resoluciones viven en el cliente; solo los cambios de @id aceptados se guardan como decisión del sitio
export async function POST(request: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  try {
    const access = await resolveGeoContext(siteId);
    if (!access.ok) return access.response;
    const { context } = access;
    if (!context.profile) {
      return NextResponse.json({ error: 'Primero configura el perfil de negocio' }, { status: 409 });
    }

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Solicitud inválida', details: parsed.error.issues }, { status: 400 });
    }

    const report = buildStructuredDataReport(context, parsed.data.resolutions);
    const rewrites = report.plan?.idRewrites ?? {};
    const stored = context.profile.acceptedIdRewrites ?? {};
    if (JSON.stringify(rewrites) !== JSON.stringify(stored)) {
      await businessProfileRepository.setAcceptedIdRewrites(context.organizationId, context.origin, rewrites);
    }
    return NextResponse.json(report);
  } catch (error) {
    return serverError(error, 'Structured data resolve');
  }
}
