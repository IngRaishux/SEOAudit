import { crawlSite, NoSitemapError } from '@seo-optimizer/crawler';
import { jobStore, type Job } from '@/lib/jobStore';
import { settleCrawl } from '@/lib/repositories/freeUsageRepository';
import { FREE_SESSION_TTL_MS } from './session';
import type { FreePageSummary } from './types';

/** Resumen por página que ve el visitante: sin HTML ni texto completo. */
export function summarizePages(job: Job): FreePageSummary[] {
  return (job.result?.pages ?? []).map((page) => ({
    url: page.url,
    statusCode: page.statusCode,
    title: page.title,
    description: page.description,
    h1: page.h1 ?? [],
    wordCount: page.wordCount,
  }));
}

/**
 * Rastrea un análisis gratuito: como máximo las páginas reservadas, solo del mismo host y sin
 * renderizado. No persiste nada; devuelve al cupo lo que no se rastreó y borra el trabajo a la hora.
 */
export async function runFreeCrawl(jobId: string): Promise<void> {
  const job = jobStore.get(jobId);
  if (!job?.free) return;
  const { visitor, day, reserved } = job.free;
  job.status = 'running';

  let crawled = 0;
  try {
    const result = await crawlSite(job.url, {
      maxUrls: reserved,
      concurrency: 3,
      renderJs: false,
      sameHostOnly: true,
      crawl4aiUrl: process.env.CRAWL4AI_URL || 'http://localhost:11235',
      onProgress: (processed, total) => {
        job.processed = processed;
        job.total = total;
      },
    });
    const pages = result.pages.filter((page) => !page.url.endsWith('.xml'));
    crawled = pages.length;
    job.result = { ...result, total: pages.length, pages };
    job.status = 'completed';
  } catch (error) {
    job.status = 'failed';
    job.free.errorCode = error instanceof NoSitemapError ? 'NO_SITEMAP' : 'CRAWL_FAILED';
    job.error = error instanceof Error ? error.message : String(error);
    console.error('Free crawl failed', jobId, job.error);
  } finally {
    job.finishedAt = Date.now();
    await settleCrawl(visitor, day, reserved - crawled).catch((error) =>
      console.error('Free crawl: could not settle quota', jobId, error),
    );
    setTimeout(() => jobStore.delete(jobId), FREE_SESSION_TTL_MS).unref?.();
  }
}
