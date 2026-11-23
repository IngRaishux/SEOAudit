import { NextResponse } from 'next/server';
import { requireOrgAccess } from '@/lib/auth/orgAccess';
import Membership from '@/lib/models/Membership';
import { canChangeRole, canRemove } from '@/lib/org/memberRules';
import { getMemberRef, ruleError } from '@/lib/org/members';

export const runtime = 'nodejs';

type Params = { params: Promise<{ orgId: string; userId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { orgId, userId } = await params;
  try {
    const access = await requireOrgAccess(orgId, 'members.manage');
    if (!access.ok) return access.response;

    const target = await getMemberRef(orgId, userId);
    if (!target) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    const newRole = typeof body?.role === 'string' ? body.role : '';
    const rule = canChangeRole({ userId: access.userId, role: access.role }, target, newRole);
    if (!rule.ok) return ruleError(rule, 'No se puede cambiar el rol de este miembro');

    // Condicionado al rol leído: si cambió entretanto (p. ej. pasó a owner) no se pisa
    const result = await Membership.updateOne(
      { organizationId: orgId, userId, role: target.role },
      { $set: { role: newRole } }
    );
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'El miembro cambió mientras tanto; recarga e intenta de nuevo' }, { status: 409 });
    }
    return NextResponse.json({ userId, role: newRole });
  } catch (error) {
    console.error('Error changing member role:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { orgId, userId } = await params;
  try {
    const access = await requireOrgAccess(orgId, 'members.manage');
    if (!access.ok) return access.response;

    const target = await getMemberRef(orgId, userId);
    if (!target) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

    const rule = canRemove({ userId: access.userId, role: access.role }, target);
    if (!rule.ok) return ruleError(rule, 'No se puede quitar a este miembro');

    await Membership.deleteOne({ organizationId: orgId, userId, role: { $ne: 'owner' } });
    return NextResponse.json({ removed: userId });
  } catch (error) {
    console.error('Error removing member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
