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
