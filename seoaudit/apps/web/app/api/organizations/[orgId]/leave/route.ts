import { NextResponse } from 'next/server';
import { requireOrgAccess } from '@/lib/auth/orgAccess';
import Membership from '@/lib/models/Membership';
import { canLeave } from '@/lib/org/memberRules';
import { ruleError } from '@/lib/org/members';

export const runtime = 'nodejs';

export async function POST(_request: Request, { params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  try {
    const access = await requireOrgAccess(orgId, 'site.read');
    if (!access.ok) return access.response;

    const memberCount = await Membership.countDocuments({ organizationId: orgId });
    const rule = canLeave({ userId: access.userId, role: access.role }, memberCount);
    if (!rule.ok) {
      return ruleError(
        rule,
        rule.code === 'OWNER_MUST_DELETE'
          ? 'Eres el único miembro: borra la organización en lugar de salir'
          : 'Transfiere la propiedad a un admin antes de salir'
      );
    }

    await Membership.deleteOne({ organizationId: orgId, userId: access.userId, role: { $ne: 'owner' } });
    return NextResponse.json({ left: orgId });
  } catch (error) {
    console.error('Error leaving organization:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
