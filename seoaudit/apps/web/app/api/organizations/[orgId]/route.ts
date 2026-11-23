import { NextResponse } from 'next/server';
import { requireOrgAccess } from '@/lib/auth/orgAccess';
import { canDelete, RULE_STATUS } from '@/lib/org/memberRules';
import Membership from '@/lib/models/Membership';
import Invitation from '@/lib/models/Invitation';
import Organization from '@/lib/models/Organization';
import Site from '@/lib/models/Site';
import Page from '@/lib/models/Page';
import Suggestion from '@/lib/models/Suggestion';

export const runtime = 'nodejs';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;

  try {
    const access = await requireOrgAccess(orgId, 'org.manage');
    if (!access.ok) return access.response;

    const body = await request.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Organization name is required' },
        { status: 400 }
      );
    }

    const org = await Organization.findByIdAndUpdate(
      orgId,
      { name: name.trim() },
      { new: true }
    );

    if (!org) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ organization: org });
  } catch (error) {
    console.error('Error updating organization:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;

  try {
    const access = await requireOrgAccess(orgId, 'org.manage');
    if (!access.ok) return access.response;

    // Solo se borra si el owner es el único miembro
    const memberCount = await Membership.countDocuments({ organizationId: orgId });
    const rule = canDelete({ userId: access.userId, role: access.role }, memberCount);
    if (!rule.ok) {
      return NextResponse.json(
        { error: 'Quita a los miembros antes de borrar la organización', code: rule.code },
        { status: RULE_STATUS[rule.code] }
      );
    }

    // Los links de invitaciones pendientes dejan de servir
    await Invitation.updateMany(
      { organizationId: orgId, status: 'pending' },
      { $set: { status: 'revoked', respondedAt: new Date() } }
    );
    await Suggestion.deleteMany({ organizationId: orgId });
    await Page.deleteMany({ organizationId: orgId });
    await Site.deleteMany({ organizationId: orgId });
    await Membership.deleteMany({ organizationId: orgId });
    await Organization.findByIdAndDelete(orgId);

    return NextResponse.json({ message: 'Organization deleted successfully' });
  } catch (error) {
    console.error('Error deleting organization:', error);
    return NextResponse.json(
      { error: 'Failed to delete organization' },
      { status: 500 }
    );
  }
}
