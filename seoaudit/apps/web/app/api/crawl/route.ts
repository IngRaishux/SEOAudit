import { crawlSite } from '@seo-optimizer/crawler';
import { NextResponse } from "next/server";
import { createJob, jobStore } from "@/lib/jobStore";
import * as siteRepository from '@/lib/repositories/siteRepository';
import * as pageRepository from '@/lib/repositories/pageRepository';
import { requireOrgAccess } from '@/lib/auth/orgAccess';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { url, organizationId } = await request.json();

    // La organización debe venir explícita: nunca se toma una membresía cualquiera del usuario
    const access = await requireOrgAccess(organizationId, 'crawl.run');
    if (!access.ok) return access.response;

    if (!url) {
      return NextResponse.json({ error: "La URL es requerida" }, { status: 400 });
    }

    const job = createJob(url, access.organizationId);

    runCrawl(job.id);

    return NextResponse.json({ jobId: job.id, siteId: job.siteId });
  } catch (error) {
    console.error('Crawl API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}

async function runCrawl(jobId: string) {
  const job = jobStore.get(jobId);
  if (!job) return;

  job.status = "running";

  try {
    const crawl4aiUrl = process.env.CRAWL4AI_URL || 'http://localhost:11235';
    const result = await crawlSite(job.url, {
      concurrency: 5,
      crawl4aiUrl,
      onProgress: (processed, total) => {
        const j = jobStore.get(jobId);
        if (j) {
          j.processed = processed;
          j.total = total;
        }
      },
    });

    // Filtrar archivos XML (sitemaps) que puedan haberse colado en las URLs descubiertas
    const pages = result.pages.filter((page) => !page.url.endsWith('.xml'));

    console.log('Crawl completed, pages found:', pages.length);
    const j = jobStore.get(jobId);
    if (!j) return;

    j.result = {
      siteUrl: result.siteUrl,
      sitemapUrl: result.sitemapUrl,
      total: pages.length,
      pages,
      llmsTxt: result.llmsTxt,
    };
    j.finishedAt = Date.now();

    // Persistir en MongoDB ANTES de marcar como completado
    await persistCrawlResult(j);

    // Solo marcar como completado DESPUÉS de que la persistencia esté lista
    j.status = "completed";
    console.log('Crawl job completed:', jobId);
  } catch (err) {
    console.error('Crawl error for job', jobId, ':', err);
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
    const firstPage = job.result.pages[0];
    const siteMetaTags = [
      ...(firstPage?.ogTitle ? [{ name: 'og:title', content: firstPage.ogTitle }] : []),
      ...(firstPage?.ogDescription ? [{ name: 'og:description', content: firstPage.ogDescription }] : []),
      ...(firstPage?.ogImage ? [{ name: 'og:image', content: firstPage.ogImage }] : []),
      ...(firstPage?.robots ? [{ name: 'robots', content: firstPage.robots }] : []),
    ];

    const site = await siteRepository.createSite({
      url: job.url,
      organizationId: job.organizationId,
      title: firstPage?.title || undefined,
      description: firstPage?.description || undefined,
      metaTags: siteMetaTags,
      llmsTxt: job.result.llmsTxt,
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
      links: page.links,
      images: page.images,
      jsonLd: page.jsonLd,
      bodyText: page.bodyText,
      footerText: page.footerText,
      textTruncated: page.textTruncated,
      alternates: page.alternates ?? [],
      htmlLang: page.htmlLang || undefined,
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
