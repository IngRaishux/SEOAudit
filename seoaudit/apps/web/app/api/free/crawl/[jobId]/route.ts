import { NextResponse, type NextRequest } from 'next/server';
import { disabledResponse, freeError, toQuota } from '@/lib/free/http';
import { freeJobAccess } from '@/lib/free/guard';
import { summarizePages } from '@/lib/free/jobs';
import { utcDay } from '@/lib/free/quota';
import type { FreeJobStatus } from '@/lib/free/types';
import { getUsage } from '@/lib/repositories/freeUsageRepository';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  const disabled = disabledResponse();
  if (disabled) return disabled;

  const { jobId } = await params;
  const access = freeJobAccess(request, jobId);
  if (!access.ok) return freeError(access.code, access.code === 'FORBIDDEN' ? 403 : 404);

  const { job, visitor } = access;
  const now = new Date();
  const body: FreeJobStatus = {
    status: job.status,
    processed: job.processed,
    total: job.total,
    error: job.free?.errorCode ?? null,
    pages: job.status === 'completed' ? summarizePages(job) : null,
    quota: toQuota(await getUsage(visitor, utcDay(now)), now),
  };
  return NextResponse.json(body);
}
