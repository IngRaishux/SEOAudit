import mongoose from 'mongoose';

const suggestionSchema = new mongoose.Schema(
  {
    pageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Page',
      required: true,
      index: true,
    },
    siteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Site',
      required: true,
      index: true,
    },
    organizationId: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['seo', 'performance', 'accessibility', 'best_practice'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    severity: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low'],
      default: 'medium',
    },
    recommendation: String,
    isResolved: {
      type: Boolean,
      default: false,
    },
    resolvedAt: Date,
    notes: String,
  },
  { timestamps: true }
);

// Index for listing suggestions by page
suggestionSchema.index({ pageId: 1 });

export default mongoose.models.Suggestion || mongoose.model('Suggestion', suggestionSchema);
