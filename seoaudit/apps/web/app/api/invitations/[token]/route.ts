import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { connectToDatabase } from '@/lib/db/mongo';
import { requireUser } from '@/lib/auth/orgAccess';
import Invitation from '@/lib/models/Invitation';
import Membership from '@/lib/models/Membership';
import Organization from '@/lib/models/Organization';
import { effectiveStatus, normalizeEmail } from '@/lib/invitations/state';
import { findInvitationByToken as findByToken, getInvitationPreview } from '@/lib/invitations/service';

export const runtime = 'nodejs';

type Params = { params: Promise<{ token: string }> };

const SELECTED_ORG_COOKIE = 'selectedOrganization';

/** Datos mínimos para la pantalla de aceptación (público). */
export async function GET(_request: Request, { params }: Params) {
  const { token } = await params;
  try {
    const preview = await getInvitationPreview(token);
    return NextResponse.json(preview, { status: preview.status === 'invalid' ? 404 : 200 });
  } catch (error) {
    console.error('Error reading invitation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** Acepta o rechaza. Exige sesión con el mismo email al que se envió la invitación. */
export async function POST(request: Request, { params }: Params) {
  const { token } = await params;
  try {
    const user = await requireUser();
    if (!user.ok) return user.response;

    const body = await request.json().catch(() => ({}));
    const action = body?.action;
    if (action !== 'accept' && action !== 'decline') {
      return NextResponse.json({ error: 'action debe ser accept o decline' }, { status: 400 });
    }

    const invitation = await findByToken(token);
    if (!invitation) return NextResponse.json({ error: 'Invitación no válida', code: 'INVALID' }, { status: 410 });
    const status = effectiveStatus(invitation);
    if (status !== 'pending') {
      return NextResponse.json(
        { error: 'Invitación no válida', code: status === 'expired' ? 'EXPIRED' : 'INVALID' },
        { status: 410 }
      );
    }

    const { db } = await connectToDatabase();
    const account = await db.collection('users').findOne({ _id: new ObjectId(user.userId) }, { projection: { email: 1 } });
    if (!account?.email || normalizeEmail(account.email as string) !== invitation.email) {
      return NextResponse.json({ error: 'Esta invitación es para otra cuenta', code: 'WRONG_ACCOUNT' }, { status: 403 });
    }

    const orgId = String(invitation.organizationId);
    if (action === 'accept' && !(await Organization.exists({ _id: orgId }))) {
      return NextResponse.json({ error: 'Invitación no válida', code: 'INVALID' }, { status: 410 });
    }

    // Update condicional: dos aceptaciones simultáneas no pueden pasar las dos
    const responded = await Invitation.findOneAndUpdate(
      { _id: invitation._id, status: 'pending', expiresAt: { $gt: new Date() } },
      {
        $set: {
          status: action === 'accept' ? 'accepted' : 'declined',
          respondedAt: new Date(),
          ...(action === 'accept' ? { acceptedByUserId: user.userId } : {}),
        },
      },
      { new: true }
    );
    if (!responded) return NextResponse.json({ error: 'Invitación no válida', code: 'INVALID' }, { status: 410 });

    if (action === 'decline') return NextResponse.json({ status: 'declined' });

    // Si ya era miembro conserva su rol
    await Membership.updateOne(
      { userId: user.userId, organizationId: orgId },
      { $setOnInsert: { userId: user.userId, organizationId: orgId, role: invitation.role } },
      { upsert: true }
    );

    const response = NextResponse.json({ status: 'accepted', organizationId: orgId, redirect: `/dashboard?org=${orgId}` });
    response.cookies.set(SELECTED_ORG_COOKIE, orgId, { maxAge: 60 * 60 * 24 * 30, path: '/' });
    return response;
  } catch (error) {
    console.error('Error responding to invitation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
