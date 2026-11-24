import { NextResponse, type NextRequest } from 'next/server';
import { requestSuggestion } from '@/lib/seoSuggestionCore';
import { normalizeUrl } from '@/lib/hreflang/review';
import { disabledResponse, freeError, toQuota } from '@/lib/free/http';
import { freeJobAccess } from '@/lib/free/guard';
import { resetsAt, utcDay } from '@/lib/free/quota';
import type { FreeSuggestion } from '@/lib/free/types';
import { getUsage, releaseSuggestion, reserveSuggestion } from '@/lib/repositories/freeUsageRepository';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const disabled = disabledResponse();
  if (disabled) return disabled;

  let body: { jobId?: unknown; url?: unknown };
  try {
    body = await request.json();
  } catch {
    return freeError('NOT_IN_JOB', 400);
  }
  if (typeof body.jobId !== 'string' || typeof body.url !== 'string') return freeError('NOT_IN_JOB', 400);

  const access = freeJobAccess(request, body.jobId);
  if (!access.ok) return freeError(access.code, access.code === 'FORBIDDEN' ? 403 : 404);
  const { job, visitor } = access;

  // Los datos de la página salen del rastreo del servidor, nunca del cliente: la ruta no sirve de proxy a la IA
  const target = normalizeUrl(body.url);
  const page = job.result?.pages.find((p) => normalizeUrl(p.url) === target);
  if (!page) return freeError('NOT_IN_JOB', 404);

  const now = new Date();
  const day = utcDay(now);
  if (!(await reserveSuggestion(visitor, day))) {
    return freeError('QUOTA_EXCEEDED', 429, {
      resetsAt: resetsAt(now).toISOString(),
      quota: toQuota(await getUsage(visitor, day), now),
    });
  }

  try {
    // Sin la comprobación de sitio de la Server Action: aquí el control es la sesión firmada y el cupo
    const generated = await requestSuggestion({
      url: page.url,
      title: page.title,
      description: page.description,
      wordCount: page.wordCount,
    });
    const suggestion: FreeSuggestion = {
      title: generated.title?.S ?? '',
      description: generated.description?.S ?? '',
      keywords: generated.keywords?.SS ?? [],
    };
    return NextResponse.json({ suggestion, quota: toQuota(await getUsage(visitor, day), now) });
  } catch (error) {
    console.error('Free suggestion failed', error);
    await releaseSuggestion(visitor, day).catch(() => undefined);
    return freeError('AI_FAILED', 502, { quota: toQuota(await getUsage(visitor, day), now) });
  }
}
