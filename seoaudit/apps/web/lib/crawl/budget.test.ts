import { describe, expect, it } from 'vitest';
import { createProgressThrottle, crawlDeadline, crawlerSettings, isCrawlJobStale, STALE_CRAWL_MS } from './budget';

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

describe('crawlerSettings', () => {
  it('usa 3 en paralelo y 30 s por página por defecto', () => {
    expect(crawlerSettings({})).toEqual({ concurrency: 3, pageTimeoutMs: 30_000 });
  });
  it('respeta las variables de entorno', () => {
    expect(crawlerSettings({ CRAWLER_CONCURRENCY: '5', CRAWLER_TIMEOUT_MS: '20000' })).toEqual({
      concurrency: 5,
      pageTimeoutMs: 20_000,
    });
  });
  it('acota la espera para no comerse el margen del deadline y la concurrencia a 10', () => {
    expect(crawlerSettings({ CRAWLER_CONCURRENCY: '50', CRAWLER_TIMEOUT_MS: '120000' })).toEqual({
      concurrency: 10,
      pageTimeoutMs: 35_000,
    });
  });
  it('ignora valores inválidos', () => {
    expect(crawlerSettings({ CRAWLER_CONCURRENCY: 'abc', CRAWLER_TIMEOUT_MS: '-1' })).toEqual({
      concurrency: 3,
      pageTimeoutMs: 30_000,
    });
  });
});
