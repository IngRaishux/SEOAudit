import mongoose from 'mongoose';

const siteSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },
    organizationId: {
      type: String,
      required: true,
      index: true,
    },
    title: String,
    description: String,
    crawlStatus: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'failed'],
      default: 'pending',
    },
    crawlErrorMessage: String,
    pageCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Compound index for listing sites by organization
siteSchema.index({ organizationId: 1, createdAt: -1 });

export default mongoose.models.Site || mongoose.model('Site', siteSchema);
