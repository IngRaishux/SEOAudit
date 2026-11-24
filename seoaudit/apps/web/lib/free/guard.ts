import type { NextRequest } from 'next/server';
import { jobStore, type Job } from '@/lib/jobStore';
import { FREE_SESSION_COOKIE, verifyFreeSession } from './session';
import { visitorKey } from './visitor';

export type FreeJobAccess = { ok: true; job: Job; visitor: string } | { ok: false; code: 'FORBIDDEN' | 'NOT_FOUND' };

/** El trabajo gratuito solo lo ve quien lo lanzó: cookie firmada con ese jobId y la misma IP. */
export function freeJobAccess(request: NextRequest, jobId: string): FreeJobAccess {
  const visitor = visitorKey(request.headers);
  const session = verifyFreeSession(request.cookies.get(FREE_SESSION_COOKIE)?.value, visitor, process.env.AUTH_SECRET!);
  if (!session || session.jobId !== jobId) return { ok: false, code: 'FORBIDDEN' };
  const job = jobStore.get(jobId);
  if (!job?.free || job.free.visitor !== visitor) return { ok: false, code: 'NOT_FOUND' };
  return { ok: true, job, visitor };
}
