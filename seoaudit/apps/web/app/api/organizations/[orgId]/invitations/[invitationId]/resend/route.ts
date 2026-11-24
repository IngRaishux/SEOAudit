import { NextResponse } from 'next/server';
import { isObjectId, requireOrgAccess } from '@/lib/auth/orgAccess';
import Invitation from '@/lib/models/Invitation';
import { generateToken, hashToken } from '@/lib/invitations/token';
import { expiresAtFrom } from '@/lib/invitations/state';
import { deliverInvitation, getUserBasics, invitationLink, toView } from '@/lib/invitations/service';
import { getRequestLanguage } from '@/lib/i18n/server';

export const runtime = 'nodejs';

/** Reenvía una invitación pendiente o vencida: token nuevo (el anterior deja de servir) y 7 días más. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ orgId: string; invitationId: string }> }
) {
  const { orgId, invitationId } = await params;
  try {
    const access = await requireOrgAccess(orgId, 'members.manage');
    if (!access.ok) return access.response;
    if (!isObjectId(invitationId)) return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });

    const token = generateToken();
    const invitation = await Invitation.findOneAndUpdate(
      { _id: invitationId, organizationId: orgId, status: 'pending' },
      { $set: { tokenHash: hashToken(token), expiresAt: expiresAtFrom(), emailStatus: 'failed' }, $unset: { emailError: 1 } },
      { new: true }
    );
    if (!invitation) {
      const exists = await Invitation.exists({ _id: invitationId, organizationId: orgId });
      return exists
        ? NextResponse.json({ error: 'Esta invitación ya no se puede reenviar', code: 'NOT_RESENDABLE' }, { status: 409 })
        : NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    const link = invitationLink(token, request.url);
    const delivery = await deliverInvitation(invitation, link, await getRequestLanguage());
    const saved = await Invitation.findById(invitation._id).lean();
    const users = await getUserBasics([invitation.invitedByUserId]);

    return NextResponse.json({
      invitation: toView(saved ?? invitation.toObject(), users.get(invitation.invitedByUserId)),
      link,
      emailSent: delivery.sent,
    });
  } catch (error) {
    console.error('Error resending invitation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
