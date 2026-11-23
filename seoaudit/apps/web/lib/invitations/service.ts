import { ObjectId } from 'mongodb';
import connectMongoose from '@/lib/db/mongoose';
import { connectToDatabase } from '@/lib/db/mongo';
import Invitation, { type IInvitation } from '@/lib/models/Invitation';
import Organization from '@/lib/models/Organization';
import { sendMail } from '@/lib/mail/mailer';
import { invitationEmail } from '@/lib/mail/templates/invitation';
import type { Language } from '@/lib/i18n/ui';
import { effectiveStatus, normalizeEmail, type EffectiveInvitationStatus } from './state';
import { hashToken } from './token';

export function invitationLink(token: string, requestUrl?: string): string {
  const base = process.env.AUTH_URL || process.env.NEXTAUTH_URL || (requestUrl ? new URL(requestUrl).origin : '');
  return `${base.replace(/\/+$/, '')}/invite/${token}`;
}

export async function getUserBasics(userIds: string[]): Promise<Map<string, { name: string; email: string }>> {
  const ids = [...new Set(userIds)].filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id));
  if (ids.length === 0) return new Map();
  const { db } = await connectToDatabase();
  const users = await db.collection('users').find({ _id: { $in: ids } }, { projection: { name: 1, email: 1 } }).toArray();
  return new Map(users.map((u) => [u._id.toString(), { name: (u.name as string) || '', email: (u.email as string) || '' }]));
}

export async function findUserByEmail(email: string) {
  const { db } = await connectToDatabase();
  // Los emails de usuarios existentes pueden tener mayúsculas: se compara sin distinguirlas
  const escaped = normalizeEmail(email).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return db.collection('users').findOne({ email: { $regex: `^${escaped}$`, $options: 'i' } });
}

/** ¿El email tiene alguna invitación pendiente y vigente? (se usa al crear cuentas). */
export async function hasPendingInvitation(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  await connectMongoose();
  const found = await Invitation.exists({
    email: normalizeEmail(email),
    status: 'pending',
    expiresAt: { $gt: new Date() },
  });
  return Boolean(found);
}

/** Envía (o reenvía) el correo y guarda el resultado en la invitación. */
export async function deliverInvitation(
  invitation: Pick<IInvitation, '_id' | 'email' | 'role' | 'expiresAt' | 'organizationId' | 'invitedByUserId'>,
  link: string,
  lang: Language
) {
  const [org, users] = await Promise.all([
    Organization.findById(invitation.organizationId).select('name').lean<{ name: string }>(),
    getUserBasics([invitation.invitedByUserId]),
  ]);
  const inviter = users.get(invitation.invitedByUserId);
  const mail = invitationEmail(
    {
      inviterName: inviter?.name || inviter?.email || 'SEOAudit',
      organizationName: org?.name || '',
      role: invitation.role,
      link,
      expiresAt: invitation.expiresAt,
    },
    lang
  );
  const result = await sendMail({ to: invitation.email, ...mail });
  await Invitation.updateOne(
    { _id: invitation._id },
    result.sent
      ? { $set: { emailStatus: 'sent' }, $unset: { emailError: 1 } }
      : { $set: { emailStatus: 'failed', emailError: result.error } }
  );
  return result;
}

export interface InvitationView {
  id: string;
  email: string;
  role: IInvitation['role'];
  status: EffectiveInvitationStatus;
  expiresAt: string;
  emailStatus: IInvitation['emailStatus'];
  invitedByName: string;
  createdAt: string;
}

export async function listOrgInvitations(organizationId: string): Promise<InvitationView[]> {
  await connectMongoose();
  const invitations = await Invitation.find({ organizationId, status: 'pending' })
    .sort({ createdAt: -1 })
    .lean<IInvitation[]>();
  const users = await getUserBasics(invitations.map((i) => i.invitedByUserId));
  return invitations.map((i) => toView(i, users.get(i.invitedByUserId)));
}

export function toView(i: IInvitation, inviter?: { name: string; email: string }): InvitationView {
  return {
    id: String(i._id),
    email: i.email,
    role: i.role,
    status: effectiveStatus(i),
    expiresAt: new Date(i.expiresAt).toISOString(),
    emailStatus: i.emailStatus,
    invitedByName: inviter?.name || inviter?.email || '',
    createdAt: new Date(i.createdAt).toISOString(),
  };
}

export async function findInvitationByToken(token: string) {
  if (!token || token.length > 200) return null;
  await connectMongoose();
  return Invitation.findOne({ tokenHash: hashToken(token) }).lean<IInvitation>();
}

export type InvitationPreview =
  | { status: 'invalid' | 'expired' }
  | {
      status: 'pending';
      email: string;
      role: IInvitation['role'];
      organizationName: string;
      inviterName: string;
      expiresAt: string;
    };

/**
 * Lo que la pantalla de aceptación puede mostrar. Una invitación que ya no sirve no revela
 * nada de la organización.
 */
export async function getInvitationPreview(token: string): Promise<InvitationPreview> {
  const invitation = await findInvitationByToken(token);
  if (!invitation) return { status: 'invalid' };

  const status = effectiveStatus(invitation);
  if (status === 'expired') return { status: 'expired' };
  if (status !== 'pending') return { status: 'invalid' };

  const org = await Organization.findById(invitation.organizationId).select('name').lean<{ name: string }>();
  if (!org) return { status: 'invalid' };

  const inviter = (await getUserBasics([invitation.invitedByUserId])).get(invitation.invitedByUserId);
  return {
    status: 'pending',
    email: invitation.email,
    role: invitation.role,
    organizationName: org.name,
    inviterName: inviter?.name || inviter?.email || '',
    expiresAt: new Date(invitation.expiresAt).toISOString(),
  };
}
