import mongoose from 'mongoose';
import { ORG_ROLES, type OrgRole } from '@/lib/auth/permissions';

export type MembershipRole = OrgRole;

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
      enum: ORG_ROLES,
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

// Exactamente un owner por organización: la base impide un segundo owner
membershipSchema.index(
  { organizationId: 1 },
  { unique: true, partialFilterExpression: { role: 'owner' }, name: 'one_owner_per_org' }
);

const Membership =
  mongoose.models.Membership || mongoose.model<IMembership>('Membership', membershipSchema);

export default Membership;
