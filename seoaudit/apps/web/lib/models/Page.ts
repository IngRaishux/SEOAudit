import mongoose from 'mongoose';

const pageSchema = new mongoose.Schema(
  {
    siteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Site',
      required: true,
      index: true,
    },
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
    statusCode: Number,
    contentLength: Number,
    contentType: String,
    canonical: String,
    headings: [String],
    links: [
      {
        url: String,
        text: String,
        isExternal: Boolean,
      },
    ],
    metaTags: [
      {
        name: String,
        content: String,
      },
    ],
    images: [
      {
        url: String,
        alt: String,
      },
    ],
  },
  { timestamps: true }
);

// Index for listing pages by site
pageSchema.index({ siteId: 1 });

export default mongoose.models.Page || mongoose.model('Page', pageSchema);
