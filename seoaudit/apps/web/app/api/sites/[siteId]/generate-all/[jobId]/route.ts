import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { handler } from '@/lib/auth/auth';
import type { Session } from 'next-auth';
import connectMongoose from '@/lib/db/mongoose';
import { connectToDatabase } from '@/lib/db/mongo';
import Membership from '@/lib/models/Membership';
import * as generationJobRepository from '@/lib/repositories/generationJobRepository';
import * as suggestionRepository from '@/lib/repositories/suggestionRepository';
import type { SEOSuggestion } from '@/lib/generateSEOSuggestions';

export const runtime = 'nodejs';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ siteId: string; jobId: string }> }
) {
  const { siteId, jobId } = await params;
  const session = (await getServerSession(handler)) as Session | null;

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!session.user.id) {
    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    session.user.id = user._id.toString();
  }

  await connectMongoose();
  let job = await generationJobRepository.getGenerationJob(jobId);

  // Un job de otro sitio se reporta como inexistente para no revelar que existe
  if (!job || job.siteId !== siteId) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  const membership = await Membership.findOne({
    userId: session.user.id,
    organizationId: job.organizationId,
  });

  if (!membership) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // Si la función que generaba murió (timeout de la plataforma, redeploy), el job se
  // quedaría en "running" para siempre
  if (generationJobRepository.isGenerationJobStale(job)) {
    job =
      (await generationJobRepository.failGenerationJob(
        jobId,
        generationJobRepository.STALE_JOB_ERROR
      )) ?? (await generationJobRepository.getGenerationJob(jobId));
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
  }

  let result = null;
  if (job.status === 'completed' && job.result) {
    // Se lee de Suggestion para que al recargar se vean los cambios ya guardados
    const suggestions = await suggestionRepository.listSuggestionsByIds(
      job.result.map((item) => item.suggestionId)
    );
    const contentById = new Map(
      suggestions.map((s) => [
        String(s._id),
        JSON.parse(s.description as string) as SEOSuggestion,
      ])
    );
    result = job.result.flatMap((item) => {
      const content = contentById.get(item.suggestionId);
      return content ? [{ ...item, content }] : [];
    });
  }

  return NextResponse.json({
    jobId: job._id.toString(),
    siteId: job.siteId,
    status: job.status,
    total: job.total,
    error: job.error || null,
    result,
  });
}
