import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireOrgAccess } from '@/lib/auth/orgAccess';
import { ASSIGNABLE_ROLES } from '@/lib/auth/permissions';
import Invitation from '@/lib/models/Invitation';
import Membership from '@/lib/models/Membership';
import { generateToken, hashToken } from '@/lib/invitations/token';
import { expiresAtFrom, normalizeEmail } from '@/lib/invitations/state';
import {
  deliverInvitation,
  findUserByEmail,
  getUserBasics,
  invitationLink,
  listOrgInvitations,
  toView,
} from '@/lib/invitations/service';
import { getRequestLanguage } from '@/lib/i18n/server';

export const runtime = 'nodejs';

type Params = { params: Promise<{ orgId: string }> };

const createSchema = z.object({
  email: z.string().trim().email(),
  role: z.enum(ASSIGNABLE_ROLES),
});

export async function GET(_request: Request, { params }: Params) {
  const { orgId } = await params;
  try {
    const access = await requireOrgAccess(orgId, 'members.manage');
    if (!access.ok) return access.response;
    return NextResponse.json({ invitations: await listOrgInvitations(orgId) });
  } catch (error) {
    console.error('Error listing invitations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: Params) {
  const { orgId } = await params;
  try {
    const access = await requireOrgAccess(orgId, 'members.manage');
    if (!access.ok) return access.response;

    const parsed = createSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      const roleIssue = parsed.error.issues.some((i) => i.path[0] === 'role');
      return NextResponse.json(
        { error: roleIssue ? 'Rol inválido' : 'Correo inválido', code: roleIssue ? 'INVALID_ROLE' : 'INVALID_EMAIL' },
        { status: 400 }
      );
    }
    const email = normalizeEmail(parsed.data.email);
    const { role } = parsed.data;

    const existingUser = await findUserByEmail(email);
    if (existingUser && (await Membership.exists({ organizationId: orgId, userId: existingUser._id.toString() }))) {
      return NextResponse.json({ error: 'Ya es miembro', code: 'ALREADY_MEMBER' }, { status: 409 });
    }

    const token = generateToken();
    let invitation;
    try {
      invitation = await Invitation.create({
        organizationId: orgId,
        email,
        role,
        tokenHash: hashToken(token),
        invitedByUserId: access.userId,
        status: 'pending',
        expiresAt: expiresAtFrom(),
        emailStatus: 'failed',
      });
    } catch (error) {
      if ((error as { code?: number }).code === 11000) {
        return NextResponse.json({ error: 'Ya tiene una invitación pendiente', code: 'ALREADY_INVITED' }, { status: 409 });
      }
      throw error;
    }

    const link = invitationLink(token, request.url);
    const delivery = await deliverInvitation(invitation, link, await getRequestLanguage());
    const saved = await Invitation.findById(invitation._id).lean();
    const users = await getUserBasics([access.userId]);

    return NextResponse.json(
      { invitation: toView(saved ?? invitation.toObject(), users.get(access.userId)), link, emailSent: delivery.sent },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating invitation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
