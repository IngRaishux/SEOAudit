import { NextResponse } from 'next/server';
import { isObjectId, requireOrgAccess } from '@/lib/auth/orgAccess';
import Invitation from '@/lib/models/Invitation';

export const runtime = 'nodejs';

/** Revoca una invitación pendiente (también si ya venció). */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ orgId: string; invitationId: string }> }
) {
  const { orgId, invitationId } = await params;
  try {
    const access = await requireOrgAccess(orgId, 'members.manage');
    if (!access.ok) return access.response;
    if (!isObjectId(invitationId)) return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });

    const result = await Invitation.updateOne(
      { _id: invitationId, organizationId: orgId, status: 'pending' },
      { $set: { status: 'revoked', respondedAt: new Date() } }
    );
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }
    return NextResponse.json({ revoked: invitationId });
  } catch (error) {
    console.error('Error revoking invitation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
