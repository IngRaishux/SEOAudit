import mongoose from 'mongoose';

// Los jobs solo sirven para mostrar la pantalla de resultados; el contenido vive en Suggestion
const JOB_TTL_SECONDS = 24 * 60 * 60;

const generationJobResultSchema = new mongoose.Schema(
  {
    pageId: { type: String, required: true },
    suggestionId: { type: String, required: true },
    url: { type: String, required: true },
  },
  { _id: false }
);

const generationJobSchema = new mongoose.Schema(
  {
    siteId: {
      type: String,
      required: true,
      index: true,
    },
    organizationId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['queued', 'running', 'completed', 'failed'],
      default: 'queued',
    },
    total: {
      type: Number,
      required: true,
    },
    result: {
      type: [generationJobResultSchema],
      default: null,
    },
    error: {
      type: String,
      default: null,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    finishedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

generationJobSchema.index({ createdAt: 1 }, { expireAfterSeconds: JOB_TTL_SECONDS });

// Un solo job activo por sitio; lo garantiza Mongo aunque lleguen dos POST a la vez
generationJobSchema.index(
  { siteId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ['queued', 'running'] } },
  }
);

export default mongoose.models.GenerationJob ||
  mongoose.model('GenerationJob', generationJobSchema);
