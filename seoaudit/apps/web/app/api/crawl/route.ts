import { crawlSite } from '@seo-optimizer/crawler';
import { NextResponse } from "next/server";
import { createJob, jobStore } from "@/lib/jobStore";

export async function POST(request: Request) {
  const { url } = await request.json();

  if (!url) {
    return NextResponse.json({ error: "La URL es requerida" }, { status: 400 });
  }

  const job = createJob(url);

  // Ejecutar el crawler en background — NO await
  runCrawl(job.id, url);

  return NextResponse.json({ jobId: job.id });
}

async function runCrawl(jobId: string, url: string) {
  const job = jobStore.get(jobId);
  if (!job) return;

  job.status = "running";

  try {
    const result = await crawlSite(url, {
      concurrency: 5,
      onProgress: (processed, total) => {
        const j = jobStore.get(jobId);
        if (j) {
          j.processed = processed;
          j.total = total;
        }
      },
    });

    const j = jobStore.get(jobId);
    if (j) {
      j.status = "completed";
      j.result = result;
      j.finishedAt = Date.now();
    }
  } catch (err) {
    const j = jobStore.get(jobId);
    if (j) {
      j.status = "failed";
      j.error = err instanceof Error ? err.message : String(err);
      j.finishedAt = Date.now();
    }
  }
}
