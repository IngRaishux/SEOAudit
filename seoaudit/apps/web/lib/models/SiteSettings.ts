import mongoose from 'mongoose';

export interface ISiteSettings {
  _id: mongoose.Types.ObjectId;
  siteId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  crawlFrequency?: 'daily' | 'weekly' | 'monthly' | 'manual';
  maxPages?: number;
  followRobots?: boolean;
  checkSSL?: boolean;
  trackMetrics?: boolean;
  customHeaders?: Record<string, string>;
  excludePatterns?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const siteSettingsSchema = new mongoose.Schema<ISiteSettings>(
  {
    siteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Site',
      required: true,
      index: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    crawlFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'manual'],
      default: 'manual',
    },
    maxPages: {
      type: Number,
      default: 1000,
    },
    followRobots: {
      type: Boolean,
      default: true,
    },
    checkSSL: {
      type: Boolean,
      default: true,
    },
    trackMetrics: {
      type: Boolean,
      default: true,
    },
    customHeaders: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    excludePatterns: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

// Unique index: one settings doc per site
siteSettingsSchema.index({ siteId: 1 }, { unique: true });

export default mongoose.models.SiteSettings || mongoose.model<ISiteSettings>('SiteSettings', siteSettingsSchema);
