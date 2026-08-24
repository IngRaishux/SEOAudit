import mongoose from 'mongoose';

export interface IOrganization {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  createdByUserId: string; // User ID from Auth.js, stored as string
  createdAt: Date;
  updatedAt: Date;
}

const organizationSchema = new mongoose.Schema<IOrganization>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    createdByUserId: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create or get model — avoid redefinition in hot reload
const Organization =
  mongoose.models.Organization || mongoose.model<IOrganization>('Organization', organizationSchema);

export default Organization;
