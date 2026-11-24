// Tipos compartidos entre las rutas /api/free/* y el cliente de la landing

export type FreeErrorCode =
  | 'DISABLED'
  | 'INVALID_URL'
  | 'TURNSTILE_FAILED'
  | 'QUOTA_EXCEEDED'
  | 'NO_SITEMAP'
  | 'CRAWL_FAILED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'NOT_IN_JOB'
  | 'AI_FAILED'
  | 'SERVER_ERROR';

export interface FreeQuota {
  crawl: { used: number; limit: number };
  suggestions: { used: number; limit: number };
  /** ISO: siguiente medianoche UTC. */
  resetsAt: string;
}

export interface FreePageSummary {
  url: string;
  statusCode: number;
  title: string | null;
  description: string | null;
  h1: string[];
  wordCount: number;
}

export interface FreeJobStatus {
  status: 'queued' | 'running' | 'completed' | 'failed';
  processed: number;
  total: number;
  error: FreeErrorCode | null;
  pages: FreePageSummary[] | null;
  quota: FreeQuota;
}

export interface FreeSuggestion {
  title: string;
  description: string;
  keywords: string[];
}
