import { NextResponse, after } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { handler } from '@/lib/auth/auth';
import type { Session } from 'next-auth';
import connectMongoose from '@/lib/db/mongoose';
import { connectToDatabase } from '@/lib/db/mongo';
import Membership from '@/lib/models/Membership';
import Organization from '@/lib/models/Organization';
import * as siteRepository from '@/lib/repositories/siteRepository';
import * as pageRepository from '@/lib/repositories/pageRepository';
import * as suggestionRepository from '@/lib/repositories/suggestionRepository';
import {
  generateBulkSEOSuggestions,
  type BulkPageData,
} from '@/lib/generateBulkSEOSuggestions';
import * as generationJobRepository from '@/lib/repositories/generationJobRepository';

export const runtime = 'nodejs';
// La generación corre en after() dentro de esta misma invocación, así que necesita cubrir
// GENERATION_TIMEOUT_MS (10 min por defecto). 800s es el máximo del plan Pro de Vercel
export const maxDuration = 800;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const { siteId } = await params;
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

  try {
    await connectMongoose();
    const site = (await siteRepository.getSiteById(siteId)) as {
      _id: string;
      organizationId: string;
    } | null;

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    const membership = await Membership.findOne({
      userId: session.user.id,
      organizationId: site.organizationId,
    });

    if (!membership) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const pages = (await pageRepository.listPagesBySite(siteId, {
      limit: 0,
    })) as unknown as Array<{
      _id: string;
      url: string;
      title?: string;
      description?: string;
    }>;

    if (pages.length === 0) {
      return NextResponse.json(
        { error: 'El sitio no tiene páginas crawleadas' },
        { status: 400 }
      );
    }

    const org = await Organization.findById(site.organizationId);

    const { job, created } = await generationJobRepository.createOrGetActiveGenerationJob({
      siteId,
      organizationId: site.organizationId.toString(),
      total: pages.length,
    });
    const jobId = job._id.toString();

    if (!created) {
      return NextResponse.json({ jobId, alreadyRunning: true }, { status: 200 });
    }

    const bulkPages: BulkPageData[] = pages.map((page) => ({
      pageId: page._id.toString(),
      url: page.url,
      title: page.title || null,
      description: page.description || null,
      wordCount: 0,
    }));

    // after() mantiene viva la función en Vercel hasta que termina la generación
    after(() =>
      runBulkGeneration(
        jobId,
        siteId,
        bulkPages,
        site.organizationId.toString(),
        org?.name || 'default'
      )
    );

    return NextResponse.json({ jobId }, { status: 202 });
  } catch (error) {
    console.error('Generate-all API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}

async function runBulkGeneration(
  jobId: string,
  siteId: string,
  pages: BulkPageData[],
  organizationId: string,
  accountName: string
) {
  try {
    await generationJobRepository.markGenerationJobRunning(jobId);

    const results = await generateBulkSEOSuggestions(pages, accountName);

    const suggestionsToCreate = results.map((r) => ({
      pageId: r.pageId,
      siteId,
      organizationId,
      type: 'seo' as const,
      severity: 'medium' as const,
      title: 'Auto-generated seo suggestion',
      description: JSON.stringify(r.suggestion),
    }));

    const createdSuggestions = await suggestionRepository.createSuggestions(
      suggestionsToCreate
    );

    await generationJobRepository.completeGenerationJob(
      jobId,
      results.map((r, index) => ({
        pageId: r.pageId,
        suggestionId: createdSuggestions[index]._id.toString(),
        url: r.url,
      }))
    );
  } catch (err) {
    console.error('Bulk generation error for job', jobId, ':', err);
    await generationJobRepository.failGenerationJob(
      jobId,
      err instanceof Error ? err.message : String(err)
    );
  }
}
