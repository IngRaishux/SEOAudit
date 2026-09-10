import { crawlSite } from '@seo-optimizer/crawler';
import { NextResponse } from "next/server";
import { getServerSession } from 'next-auth/next';
import { handler } from '@/lib/auth/auth';
import { createJob, jobStore } from "@/lib/jobStore";
import * as siteRepository from '@/lib/repositories/siteRepository';
import * as pageRepository from '@/lib/repositories/pageRepository';
import type { Session } from 'next-auth';
import connectMongoose from '@/lib/db/mongoose';
import { connectToDatabase } from '@/lib/db/mongo';
import Membership from '@/lib/models/Membership';
import Organization from '@/lib/models/Organization';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  let session = (await getServerSession(handler)) as Session | null;

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // If accountId is not in session, resolve it from database using email
  if (!session.user.accountId) {
    try {
      const { db } = await connectToDatabase();
      const usersCollection = db.collection('users');

      // Find user by email
      const user = await usersCollection.findOne({ email: session.user.email });

      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      await connectMongoose();
      const membership = await Membership.findOne({ userId: user._id.toString() });

      if (membership) {
        session.user.id = user._id.toString();
        session.user.accountId = membership.organizationId.toString();
      } else {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    } catch (error) {
      console.error('Error resolving accountId:', error);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (!session.user.accountId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { url, organizationId } = await request.json();

  if (!url) {
    return NextResponse.json({ error: "La URL es requerida" }, { status: 400 });
  }

  // Usar organizationId del request, o fallback a session.user.accountId
  const effectiveOrgId = organizationId || session.user.accountId;

  if (!effectiveOrgId) {
    return NextResponse.json({ error: "Organization ID requerido" }, { status: 400 });
  }

  // Validar que el usuario es miembro de esta organización
  await connectMongoose();
  const isValidOrg = await Membership.findOne({
    userId: session.user.id,
    organizationId: effectiveOrgId,
  });

  if (!isValidOrg) {
    return NextResponse.json(
      { error: "No tienes acceso a esta organización" },
      { status: 403 }
    );
  }

  const job = createJob(url, effectiveOrgId);

  runCrawl(job.id);

  return NextResponse.json({ jobId: job.id, siteId: job.siteId });
}

async function runCrawl(jobId: string) {
  const job = jobStore.get(jobId);
  if (!job) return;

  job.status = "running";

  try {
    const result = await crawlSite(job.url, {
      concurrency: 5,
      onProgress: (processed, total) => {
        const j = jobStore.get(jobId);
        if (j) {
          j.processed = processed;
          j.total = total;
        }
      },
    });

    const j = jobStore.get(jobId);
    if (!j) return;

    j.result = result;
    j.finishedAt = Date.now();

    // Persistir en MongoDB ANTES de marcar como completado
    await persistCrawlResult(j);

    // Solo marcar como completado DESPUÉS de que la persistencia esté lista
    j.status = "completed";
  } catch (err) {
    const j = jobStore.get(jobId);
    if (j) {
      j.status = "failed";
      j.error = err instanceof Error ? err.message : String(err);
      j.finishedAt = Date.now();
    }
  }
}

async function persistCrawlResult(job: ReturnType<typeof jobStore.get>) {
  if (!job || !job.result) return;

  try {
    // Crear Site
    const site = await siteRepository.createSite({
      url: job.url,
      organizationId: job.organizationId,
      title: job.result.pages[0]?.title || undefined,
      description: job.result.pages[0]?.description || undefined,
    });

    // Actualizar job con el siteId de MongoDB
    job.siteId = site._id.toString();

    // Crear Pages
    const pages = job.result.pages.map((page) => ({
      siteId: site._id.toString(),
      url: page.url,
      organizationId: job.organizationId,
      title: page.title || undefined,
      description: page.description || undefined,
      statusCode: page.statusCode,
      canonical: page.canonical || undefined,
      headings: [...(page.h1 || []), ...(page.h2 || [])],
      metaTags: [
        ...(page.ogTitle ? [{ name: 'og:title', content: page.ogTitle }] : []),
        ...(page.ogDescription ? [{ name: 'og:description', content: page.ogDescription }] : []),
        ...(page.ogImage ? [{ name: 'og:image', content: page.ogImage }] : []),
        ...(page.robots ? [{ name: 'robots', content: page.robots }] : []),
      ],
      links: [],
    }));

    if (pages.length > 0) {
      await pageRepository.createPages(pages as Parameters<typeof pageRepository.createPages>[0]);
    }

    // Actualizar Site con pageCount
    await siteRepository.updateSite(site._id.toString(), {
      pageCount: pages.length,
      crawlStatus: 'completed',
    });
  } catch (error) {
    console.error('Error persisting crawl result:', error);
  }
}
