import { NextResponse } from 'next/server';
import { z } from 'zod';
import { resolveGeoContext, serverError } from '@/lib/geo/server/access';
import { geminiJsonModel } from '@/lib/geo/ai';
import { checkLlmsTxt, generateLlmsTxt } from '@/lib/geo/llmsTxt';

export const runtime = 'nodejs';
export const maxDuration = 300;

type Params = { params: Promise<{ siteId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { siteId } = await params;
  try {
    const access = await resolveGeoContext(siteId);
    if (!access.ok) return access.response;
    const { llmsTxt, pages, profile } = access.context;
    return NextResponse.json({
      report: checkLlmsTxt(llmsTxt, pages),
      current: llmsTxt?.content ?? null,
      hasProfile: !!profile,
      languages: profile?.languages ?? [],
      defaultLanguage: profile?.defaultLanguage ?? null,
    });
  } catch (error) {
    return serverError(error, 'llms.txt GET');
  }
}

const bodySchema = z.object({ lang: z.string().min(2).optional() });

export async function POST(request: Request, { params }: Params) {
  const { siteId } = await params;
  try {
    const access = await resolveGeoContext(siteId);
    if (!access.ok) return access.response;
    const { profile, pages } = access.context;
    if (!profile) {
      return NextResponse.json({ error: 'Primero configura el perfil de negocio' }, { status: 409 });
    }

    const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 });

    const content = await generateLlmsTxt(geminiJsonModel(), profile, pages, parsed.data.lang ?? profile.defaultLanguage);
    return NextResponse.json({ content, filename: 'llms.txt' });
  } catch (error) {
    return serverError(error, 'llms.txt generate');
  }
}
