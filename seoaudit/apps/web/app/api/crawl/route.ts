import { crawlSite, type CrawlResult } from '@seo-optimizer/crawler';
import { NextResponse, after } from 'next/server';
import * as siteRepository from '@/lib/repositories/siteRepository';
import * as pageRepository from '@/lib/repositories/pageRepository';
import { requireOrgAccess } from '@/lib/auth/orgAccess';
import connectMongoose from '@/lib/db/mongoose';
import CrawlJob from '@/lib/models/CrawlJob';
import Page from '@/lib/models/Page';
import Site from '@/lib/models/Site';
import { createProgressThrottle, crawlDeadline } from '@/lib/crawl/budget';

export const runtime = 'nodejs';
// El crawl corre en after() dentro de esta invocación. 300 s es el máximo del plan Hobby de
// Vercel; debe coincidir con CRAWL_MAX_DURATION_S (lib/crawl/budget.ts).
export const maxDuration = 300;

export async function POST(request: Request) {
  const startedAt = Date.now();
  try {
    const { url, organizationId } = await request.json();

    // La organización debe venir explícita: nunca se toma una membresía cualquiera del usuario
    const access = await requireOrgAccess(organizationId, 'crawl.run');
    if (!access.ok) return access.response;

    if (!url) {
      return NextResponse.json({ error: "La URL es requerida" }, { status: 400 });
    }

    await connectMongoose();
    const job = await CrawlJob.create({
      url,
      organizationId: access.organizationId,
      startedAt: new Date(startedAt),
    });
    const jobId = job._id.toString();

    // after() mantiene viva la función en Vercel hasta que el crawl termina; sin esto la
    // plataforma puede congelarla en cuanto se envía la respuesta
    after(() => runCrawl(jobId, url, access.organizationId, crawlDeadline(startedAt)));

    return NextResponse.json({ jobId }, { status: 202 });
  } catch (error) {
    console.error('Crawl API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}

async function runCrawl(jobId: string, url: string, organizationId: string, deadline: number) {
  try {
    await connectMongoose();
    await CrawlJob.updateOne({ _id: jobId }, { $set: { status: 'running' } });

    const shouldWrite = createProgressThrottle();
    const crawl4aiUrl = process.env.CRAWL4AI_URL || 'http://localhost:11235';
    const result = await crawlSite(url, {
      concurrency: 5,
      crawl4aiUrl,
      deadline,
      onProgress: (processed, total) => {
        if (!shouldWrite(processed, total)) return;
        // $max: las escrituras pueden llegar desordenadas y el progreso no debe retroceder
        CrawlJob.updateOne({ _id: jobId }, { $max: { processed }, $set: { total } }).catch((error) =>
          console.error('Crawl progress update failed:', error)
        );
      },
    });

    // Filtrar archivos XML (sitemaps) que puedan haberse colado en las URLs descubiertas
    const pages = result.pages.filter((page) => !page.url.endsWith('.xml'));
    if (pages.length === 0) {
      throw new Error(
        result.truncated
          ? 'Se agotó el tiempo antes de rastrear alguna página. Intenta de nuevo.'
          : 'El sitemap no tiene páginas para rastrear.'
      );
    }

    // Se persiste ANTES de marcar el job como completado: el cliente redirige al siteId
    const siteId = await persistCrawlResult(url, organizationId, { ...result, pages });

    await CrawlJob.updateOne(
      { _id: jobId },
      {
        $set: {
          status: 'completed',
          siteId,
          truncated: result.truncated,
          processed: pages.length,
          total: result.total,
          finishedAt: new Date(),
        },
      }
    );
    console.log(`Crawl job completed: ${jobId} (${pages.length}/${result.total}${result.truncated ? ', parcial' : ''})`);
  } catch (err) {
    console.error('Crawl error for job', jobId, ':', err);
    await CrawlJob.updateOne(
      { _id: jobId, status: { $in: ['queued', 'running'] } },
      { $set: { status: 'failed', error: err instanceof Error ? err.message : String(err), finishedAt: new Date() } }
    ).catch((error) => console.error('Crawl job fail update failed:', error));
  }
}

/** Guarda Site + Pages. Si algo falla, borra lo creado para no dejar un sitio a medias. */
async function persistCrawlResult(url: string, organizationId: string, result: CrawlResult): Promise<string> {
  const firstPage = result.pages[0];
  const siteMetaTags = [
    ...(firstPage?.ogTitle ? [{ name: 'og:title', content: firstPage.ogTitle }] : []),
    ...(firstPage?.ogDescription ? [{ name: 'og:description', content: firstPage.ogDescription }] : []),
    ...(firstPage?.ogImage ? [{ name: 'og:image', content: firstPage.ogImage }] : []),
    ...(firstPage?.robots ? [{ name: 'robots', content: firstPage.robots }] : []),
  ];

  // in_progress hasta que estén las páginas: no cuenta como "último crawl completado" del origen
  const site = await siteRepository.createSite({
    url,
    organizationId,
    title: firstPage?.title || undefined,
    description: firstPage?.description || undefined,
    metaTags: siteMetaTags,
    llmsTxt: result.llmsTxt,
    crawlStatus: 'in_progress',
  });
  const siteId = site._id.toString();

  try {
    const pages = result.pages.map((page) => ({
      siteId,
      url: page.url,
      organizationId,
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

    await pageRepository.createPages(pages as Parameters<typeof pageRepository.createPages>[0]);

    await siteRepository.updateSite(siteId, {
      pageCount: pages.length,
      crawlStatus: 'completed',
      crawlTruncated: result.truncated,
      sitemapUrlCount: result.total,
    });
    return siteId;
  } catch (error) {
    await Page.deleteMany({ siteId }).catch(() => {});
    await Site.deleteOne({ _id: siteId }).catch(() => {});
    throw error;
  }
}
