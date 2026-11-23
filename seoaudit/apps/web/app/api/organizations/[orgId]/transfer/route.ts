import { NextResponse } from 'next/server';
import { requireOrgAccess } from '@/lib/auth/orgAccess';
import Membership from '@/lib/models/Membership';
import Organization from '@/lib/models/Organization';
import { canTransfer } from '@/lib/org/memberRules';
import { getMemberRef, ruleError } from '@/lib/org/members';

export const runtime = 'nodejs';

/**
 * Transfiere la propiedad a un admin. El índice único parcial impide dos owners, así que
 * primero se degrada al owner y después se promueve al admin; si lo segundo falla se revierte.
 */
export async function POST(request: Request, { params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  try {
    const access = await requireOrgAccess(orgId, 'org.manage');
    if (!access.ok) return access.response;

    const body = await request.json().catch(() => ({}));
    const targetUserId = typeof body?.targetUserId === 'string' ? body.targetUserId : '';
    const confirmName = typeof body?.confirmName === 'string' ? body.confirmName.trim() : '';

    const org = await Organization.findById(orgId).select('name').lean<{ name: string }>();
    if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    if (confirmName !== org.name.trim()) {
      return NextResponse.json({ error: 'El nombre de confirmación no coincide', code: 'CONFIRM_MISMATCH' }, { status: 400 });
    }

    const target = targetUserId ? await getMemberRef(orgId, targetUserId) : null;
    const rule = canTransfer({ userId: access.userId, role: access.role }, target);
    if (!rule.ok) {
      return ruleError(
        rule,
        rule.code === 'TARGET_NOT_ADMIN'
          ? 'Solo se puede transferir a un admin: asciéndelo primero'
          : 'No se puede transferir la propiedad a este miembro'
      );
    }

    const demoted = await Membership.updateOne(
      { organizationId: orgId, userId: access.userId, role: 'owner' },
      { $set: { role: 'admin' } }
    );
    if (demoted.modifiedCount !== 1) {
      return NextResponse.json({ error: 'Ya no eres el owner de esta organización' }, { status: 409 });
    }

    let promoted = 0;
    try {
      const res = await Membership.updateOne(
        { organizationId: orgId, userId: targetUserId, role: 'admin' },
        { $set: { role: 'owner' } }
      );
      promoted = res.modifiedCount;
    } finally {
      if (promoted !== 1) {
        await Membership.updateOne(
          { organizationId: orgId, userId: access.userId, role: 'admin' },
          { $set: { role: 'owner' } }
        );
      }
    }
    if (promoted !== 1) {
      return NextResponse.json({ error: 'El miembro dejó de ser admin; recarga e intenta de nuevo' }, { status: 409 });
    }

    return NextResponse.json({ ownerUserId: targetUserId, previousOwnerRole: 'admin' });
  } catch (error) {
    console.error('Error transferring ownership:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
