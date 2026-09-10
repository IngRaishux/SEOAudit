import type { CrawlResult } from "@seo-optimizer/crawler";

export type JobStatus = "queued" | "running" | "completed" | "failed";

export interface Job {
  id: string;
  siteId: string;
  url: string;
  organizationId: string;
  status: JobStatus;
  processed: number;
  total: number;
  result: CrawlResult | null;
  error: string | null;
  startedAt: number;
  finishedAt: number | null;
}

const globalForStore = globalThis as unknown as {
  __jobStore?: Map<string, Job>;
};

export const jobStore: Map<string, Job> =
  globalForStore.__jobStore ?? new Map();

if (process.env.NODE_ENV !== "production") {
  globalForStore.__jobStore = jobStore;
}

export function createJob(url: string, organizationId: string): Job {
  const id = crypto.randomUUID();
  const siteId = crypto.randomUUID();
  const job: Job = {
    id,
    siteId,
    url,
    organizationId,
    status: "queued",
    processed: 0,
    total: 0,
    result: null,
    error: null,
    startedAt: Date.now(),
    finishedAt: null,
  };
  jobStore.set(id, job);
  return job;
}
