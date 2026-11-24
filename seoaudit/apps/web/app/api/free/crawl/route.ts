import { after, NextResponse, type NextRequest } from 'next/server';
import { createJob } from '@/lib/jobStore';
import { disabledResponse, freeError, toQuota } from '@/lib/free/http';
import { runFreeCrawl } from '@/lib/free/jobs';
import { validatePublicUrl } from '@/lib/free/publicUrl';
import { resetsAt, utcDay } from '@/lib/free/quota';
import { FREE_SESSION_COOKIE, FREE_SESSION_TTL_MS, signFreeSession } from '@/lib/free/session';
import { verifyTurnstile } from '@/lib/free/turnstile';
import { clientIp, visitorKey } from '@/lib/free/visitor';
import { getUsage, reserveCrawl } from '@/lib/repositories/freeUsageRepository';

export const runtime = 'nodejs';
// El rastreo corre en after() dentro de esta invocación: como mucho 20 páginas, que caben de sobra en
// el máximo del plan Hobby de Vercel (300 s), igual que generate-all
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const disabled = disabledResponse();
  if (disabled) return disabled;

  let body: { url?: unknown; turnstileToken?: unknown };
  try {
    body = await request.json();
  } catch {
    return freeError('INVALID_URL', 400, { reason: 'format' });
  }

  // Primero lo que no cuesta nada: formato y destino público. Así no se gasta el token en URLs inválidas
  const validation = await validatePublicUrl(typeof body.url === 'string' ? body.url : '');
  if (!validation.ok) return freeError('INVALID_URL', 400, { reason: validation.error });

  const ip = clientIp(request.headers);
  const token = typeof body.turnstileToken === 'string' ? body.turnstileToken : null;
  if (!(await verifyTurnstile(token, ip))) return freeError('TURNSTILE_FAILED', 403);

  try {
    const secret = process.env.AUTH_SECRET!;
    const visitor = visitorKey(request.headers, secret);
    const now = new Date();
    const day = utcDay(now);

    const reserved = await reserveCrawl(visitor, day);
    if (reserved === 0) {
      return freeError('QUOTA_EXCEEDED', 429, {
        resetsAt: resetsAt(now).toISOString(),
        quota: toQuota(await getUsage(visitor, day), now),
      });
    }

    const job = createJob(validation.url.href, 'free');
    job.free = { visitor, day, reserved, errorCode: null };
    after(() => runFreeCrawl(job.id));

    const response = NextResponse.json({ jobId: job.id, reserved });
    response.cookies.set(
      FREE_SESSION_COOKIE,
      signFreeSession({ jobId: job.id, visitor, exp: Date.now() + FREE_SESSION_TTL_MS }, secret),
      {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/api/free',
        maxAge: FREE_SESSION_TTL_MS / 1000,
      },
    );
    return response;
  } catch (error) {
    console.error('Free crawl start error', error);
    return freeError('SERVER_ERROR', 500);
  }
}
