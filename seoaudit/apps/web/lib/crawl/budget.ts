/**
 * Presupuesto de tiempo del crawl. Debe coincidir con `maxDuration` de app/api/crawl/route.ts
 * (Next exige ahí un literal, por eso el valor está repetido).
 */
export const CRAWL_MAX_DURATION_S = 300;

/**
 * Margen antes del límite para que terminen las páginas en curso (hasta 10 s cada una) y se
 * guarde el resultado en Mongo.
 */
export const CRAWL_SAFETY_MARGIN_MS = 45_000;

/** Momento a partir del cual el crawl no empieza URLs nuevas. */
export function crawlDeadline(startedAt: number): number {
  return startedAt + CRAWL_MAX_DURATION_S * 1000 - CRAWL_SAFETY_MARGIN_MS;
}

/**
 * Concurrencia y espera por página, configurables con CRAWLER_CONCURRENCY y CRAWLER_TIMEOUT_MS.
 * La espera se acota para que una página en curso al llegar el deadline termine dentro del margen.
 */
export function crawlerSettings(env: Record<string, string | undefined> = process.env) {
  const concurrency = Number(env.CRAWLER_CONCURRENCY);
  const timeout = Number(env.CRAWLER_TIMEOUT_MS);
  const maxPageTimeout = CRAWL_SAFETY_MARGIN_MS - 10_000;
  return {
    concurrency: Number.isFinite(concurrency) && concurrency >= 1 ? Math.min(Math.floor(concurrency), 10) : 3,
    pageTimeoutMs:
      Number.isFinite(timeout) && timeout > 0 ? Math.min(Math.max(timeout, 5_000), maxPageTimeout) : 30_000,
  };
}

/** Un job activo más viejo que esto murió con la función (timeout, redeploy). */
export const STALE_CRAWL_MS = CRAWL_MAX_DURATION_S * 1000 + 60_000;

export function isCrawlJobStale(job: { status: string; startedAt: Date | string }, now = Date.now()): boolean {
  return (
    (job.status === 'queued' || job.status === 'running') &&
    now - new Date(job.startedAt).getTime() > STALE_CRAWL_MS
  );
}

/** Decide si vale la pena escribir el progreso: como mucho cada `intervalMs`, y siempre el final. */
export function createProgressThrottle(intervalMs = 1500, now: () => number = Date.now) {
  let last = Number.NEGATIVE_INFINITY;
  return (processed: number, total: number): boolean => {
    const t = now();
    if (processed >= total || t - last >= intervalMs) {
      last = t;
      return true;
    }
    return false;
  };
}
