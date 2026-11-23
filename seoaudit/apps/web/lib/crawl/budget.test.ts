import { describe, expect, it } from 'vitest';
import { createProgressThrottle, crawlDeadline, isCrawlJobStale, STALE_CRAWL_MS } from './budget';

describe('crawlDeadline', () => {
  it('deja el margen de seguridad antes del maxDuration', () => {
    expect(crawlDeadline(0)).toBe(300_000 - 45_000);
  });
});

describe('isCrawlJobStale', () => {
  const now = 10_000_000;
  it('un job activo que pasó el límite está colgado', () => {
    expect(isCrawlJobStale({ status: 'running', startedAt: new Date(now - STALE_CRAWL_MS - 1) }, now)).toBe(true);
    expect(isCrawlJobStale({ status: 'queued', startedAt: new Date(now - STALE_CRAWL_MS - 1) }, now)).toBe(true);
  });
  it('un job reciente o terminado no está colgado', () => {
    expect(isCrawlJobStale({ status: 'running', startedAt: new Date(now - 1000) }, now)).toBe(false);
    expect(isCrawlJobStale({ status: 'completed', startedAt: new Date(0) }, now)).toBe(false);
  });
});

describe('createProgressThrottle', () => {
  it('escribe como mucho cada intervalo y siempre el final', () => {
    let t = 0;
    const shouldWrite = createProgressThrottle(1000, () => t);
    expect(shouldWrite(1, 10)).toBe(true);
    t = 500;
    expect(shouldWrite(2, 10)).toBe(false);
    t = 1000;
    expect(shouldWrite(3, 10)).toBe(true);
    t = 1100;
    expect(shouldWrite(10, 10)).toBe(true);
  });
});
