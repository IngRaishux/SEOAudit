import mongoose from 'mongoose';
import { ASSIGNABLE_ROLES, type AssignableRole } from '@/lib/auth/permissions';

export const INVITATION_STATUSES = ['pending', 'accepted', 'declined', 'revoked'] as const;
export type InvitationStatus = (typeof INVITATION_STATUSES)[number];
export type EmailStatus = 'sent' | 'failed';

export interface IInvitation {
  _id: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  email: string;
  role: AssignableRole;
  /** sha256 del token; el token en claro nunca se guarda. */
  tokenHash: string;
  invitedByUserId: string;
  status: InvitationStatus;
  expiresAt: Date;
  emailStatus: EmailStatus;
  emailError?: string;
  acceptedByUserId?: string;
  respondedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const invitationSchema = new mongoose.Schema<IInvitation>(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    role: { type: String, enum: ASSIGNABLE_ROLES, required: true },
    tokenHash: { type: String, required: true, unique: true },
    invitedByUserId: { type: String, required: true },
    status: { type: String, enum: INVITATION_STATUSES, default: 'pending', required: true },
    expiresAt: { type: Date, required: true },
    emailStatus: { type: String, enum: ['sent', 'failed'], default: 'failed', required: true },
    emailError: { type: String },
    acceptedByUserId: { type: String },
    respondedAt: { type: Date },
  },
  { timestamps: true }
);

// Una sola invitación pendiente por email y organización (las vencidas siguen "pendientes" hasta reenviarse)
invitationSchema.index(
  { organizationId: 1, email: 1 },
  { unique: true, partialFilterExpression: { status: 'pending' }, name: 'one_pending_per_email_org' }
);

// Consulta en el alta: ¿este email tiene invitaciones pendientes?
invitationSchema.index({ email: 1, status: 1 });

const Invitation =
  (mongoose.models.Invitation as mongoose.Model<IInvitation>) ||
  mongoose.model<IInvitation>('Invitation', invitationSchema);

export default Invitation;
