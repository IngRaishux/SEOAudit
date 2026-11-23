import { NextResponse } from 'next/server';
import connectMongoose from '@/lib/db/mongoose';
import CrawlJob from '@/lib/models/CrawlJob';
import { isObjectId, requireJobAccess, requireUser } from '@/lib/auth/orgAccess';
import { isCrawlJobStale } from '@/lib/crawl/budget';

export const runtime = 'nodejs';

const STALE_ERROR = 'El crawl se interrumpió antes de terminar. Intenta de nuevo.';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;

  const user = await requireUser();
  if (!user.ok) return user.response;
  if (!isObjectId(jobId)) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

  await connectMongoose();
  let job = await CrawlJob.findById(jobId).lean();
  const access = await requireJobAccess(job, 'site.read');
  if (!access.ok) return access.response;
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

  // Si la función murió (timeout de la plataforma, redeploy) el job quedaría "running" para siempre
  if (isCrawlJobStale(job)) {
    job =
      (await CrawlJob.findOneAndUpdate(
        { _id: jobId, status: { $in: ['queued', 'running'] } },
        { $set: { status: 'failed', error: STALE_ERROR, finishedAt: new Date() } },
        { new: true }
      ).lean()) ?? (await CrawlJob.findById(jobId).lean());
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  return NextResponse.json({
    jobId: job._id.toString(),
    siteId: job.siteId,
    status: job.status,
    processed: job.processed,
    total: job.total,
    truncated: job.truncated,
    error: job.error || null,
  });
}
