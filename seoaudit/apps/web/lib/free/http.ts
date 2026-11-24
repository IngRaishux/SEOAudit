import { NextResponse } from 'next/server';
import { FREE_LIMITS, freeToolsEnabled } from './config';
import { resetsAt } from './quota';
import type { FreeErrorCode, FreeQuota } from './types';
import type { FreeUsageCounts } from '@/lib/repositories/freeUsageRepository';

export function freeError(code: FreeErrorCode, status: number, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ code, ...extra }, { status });
}

/** Respuesta 404 DISABLED si las herramientas gratuitas están apagadas; null si están activas. */
export function disabledResponse() {
  return freeToolsEnabled() ? null : freeError('DISABLED', 404);
}

export function toQuota(usage: FreeUsageCounts, now: Date = new Date()): FreeQuota {
  return {
    crawl: { used: Math.min(usage.crawlPages, FREE_LIMITS.crawlPages), limit: FREE_LIMITS.crawlPages },
    suggestions: { used: Math.min(usage.suggestions, FREE_LIMITS.suggestions), limit: FREE_LIMITS.suggestions },
    resetsAt: resetsAt(now).toISOString(),
  };
}
