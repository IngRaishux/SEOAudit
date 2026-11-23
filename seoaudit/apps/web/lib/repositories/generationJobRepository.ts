import mongoose from 'mongoose';
import connectMongoose from '@/lib/db/mongoose';
import GenerationJob from '@/lib/models/GenerationJob';
import { GENERATION_TIMEOUT_MS } from '@/lib/generateBulkSEOSuggestions';

export type GenerationJobStatus = 'queued' | 'running' | 'completed' | 'failed';

export interface GenerationJobResultItem {
  pageId: string;
  suggestionId: string;
  url: string;
}

export interface GenerationJobRecord {
  _id: mongoose.Types.ObjectId;
  siteId: string;
  organizationId: string;
  status: GenerationJobStatus;
  total: number;
  result: GenerationJobResultItem[] | null;
  error: string | null;
  startedAt: Date;
  finishedAt: Date | null;
}

// Margen sobre el timeout del modelo para guardar sugerencias y cerrar el job
export const STALE_JOB_MS = GENERATION_TIMEOUT_MS + 2 * 60 * 1000;
export const STALE_JOB_ERROR =
  'La generación se interrumpió antes de terminar. Intenta de nuevo.';

const ACTIVE_STATUSES: GenerationJobStatus[] = ['queued', 'running'];

export function isGenerationJobStale(job: GenerationJobRecord) {
  return (
    ACTIVE_STATUSES.includes(job.status) &&
    Date.now() - new Date(job.startedAt).getTime() > STALE_JOB_MS
  );
}

/**
 * Crea un job para el sitio, o devuelve el que ya está en curso (created: false).
 * Los jobs colgados se cierran antes para que no bloqueen una nueva generación.
 */
export async function createOrGetActiveGenerationJob(data: {
  siteId: string;
  organizationId: string;
  total: number;
}): Promise<{ job: GenerationJobRecord; created: boolean }> {
  await connectMongoose();

  await GenerationJob.updateMany(
    {
      siteId: data.siteId,
      status: { $in: ACTIVE_STATUSES },
      startedAt: { $lt: new Date(Date.now() - STALE_JOB_MS) },
    },
    { status: 'failed', error: STALE_JOB_ERROR, finishedAt: new Date() }
  );

  const findActive = () =>
    GenerationJob.findOne({
      siteId: data.siteId,
      status: { $in: ACTIVE_STATUSES },
    }).lean() as Promise<GenerationJobRecord | null>;

  const active = await findActive();
  if (active) return { job: active, created: false };

  try {
    const job = await GenerationJob.create(data);
    return { job: job.toObject() as GenerationJobRecord, created: true };
  } catch (error) {
    // Otro request creó el job entre el findOne y el create
    if ((error as { code?: number }).code === 11000) {
      const winner = await findActive();
      if (winner) return { job: winner, created: false };
    }
    throw error;
  }
}

export async function getGenerationJob(jobId: string) {
  if (!mongoose.isValidObjectId(jobId)) return null;
  await connectMongoose();
  return (await GenerationJob.findById(jobId).lean()) as GenerationJobRecord | null;
}

export async function markGenerationJobRunning(jobId: string) {
  await connectMongoose();
  return GenerationJob.findByIdAndUpdate(jobId, { status: 'running' });
}

export async function completeGenerationJob(
  jobId: string,
  result: GenerationJobResultItem[]
) {
  await connectMongoose();
  return GenerationJob.findByIdAndUpdate(jobId, {
    status: 'completed',
    result,
    finishedAt: new Date(),
  });
}

export async function failGenerationJob(jobId: string, error: string) {
  await connectMongoose();
  return GenerationJob.findOneAndUpdate(
    { _id: jobId, status: { $in: ['queued', 'running'] } },
    { status: 'failed', error, finishedAt: new Date() },
    { new: true }
  ).lean() as Promise<GenerationJobRecord | null>;
}
