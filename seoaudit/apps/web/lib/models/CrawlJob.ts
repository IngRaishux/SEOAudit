import mongoose from 'mongoose';

// El job solo sirve para seguir el progreso; el resultado vive en Site y Page
const JOB_TTL_SECONDS = 24 * 60 * 60;

export type CrawlJobStatus = 'queued' | 'running' | 'completed' | 'failed';

export interface ICrawlJob {
  _id: mongoose.Types.ObjectId;
  url: string;
  organizationId: string;
  status: CrawlJobStatus;
  processed: number;
  total: number;
  /** Se asigna al guardar el resultado. */
  siteId: string | null;
  truncated: boolean;
  error: string | null;
  startedAt: Date;
  finishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const crawlJobSchema = new mongoose.Schema<ICrawlJob>(
  {
    url: { type: String, required: true },
    organizationId: { type: String, required: true, index: true },
    status: { type: String, enum: ['queued', 'running', 'completed', 'failed'], default: 'queued' },
    processed: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    siteId: { type: String, default: null },
    truncated: { type: Boolean, default: false },
    error: { type: String, default: null },
    startedAt: { type: Date, default: Date.now },
    finishedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

crawlJobSchema.index({ createdAt: 1 }, { expireAfterSeconds: JOB_TTL_SECONDS });

const CrawlJob =
  (mongoose.models.CrawlJob as mongoose.Model<ICrawlJob>) || mongoose.model<ICrawlJob>('CrawlJob', crawlJobSchema);

export default CrawlJob;
