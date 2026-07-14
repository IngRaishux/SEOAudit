import { NextResponse } from "next/server";
import { jobStore } from "@/lib/jobStore";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const job = jobStore.get(jobId);

  if (!job) {
    return NextResponse.json({ error: "Job no encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    id: job.id,
    url: job.url,
    status: job.status,
    processed: job.processed,
    total: job.total,
    result: job.result,
    error: job.error,
  });
}
