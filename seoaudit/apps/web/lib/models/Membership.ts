import mongoose from 'mongoose';
import type { IOrganization } from './Organization';

export type MembershipRole = 'owner' | 'admin' | 'member';

export interface IMembership {
  _id: mongoose.Types.ObjectId;
  userId: string; // User ID from Auth.js, stored as string
  organizationId: mongoose.Types.ObjectId; // Reference to Organization
  role: MembershipRole;
  createdAt: Date;
}

const membershipSchema = new mongoose.Schema<IMembership>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member'],
      default: 'member',
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Unique compound index: a user can only have one membership per organization
membershipSchema.index({ userId: 1, organizationId: 1 }, { unique: true });

// Index for listing organization members
membershipSchema.index({ organizationId: 1, role: 1 });

const Membership =
  mongoose.models.Membership || mongoose.model<IMembership>('Membership', membershipSchema);

export default Membership;
