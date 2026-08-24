import { NextResponse } from 'next/server';
import { jobStore } from '@/lib/jobStore';

export const runtime = 'nodejs';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;

  const job = jobStore.get(jobId);

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  return NextResponse.json({
    jobId: job.id,
    siteId: job.siteId,
    status: job.status,
    processed: job.processed,
    total: job.total,
    error: job.error || null,
  });
}
