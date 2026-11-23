import { NextResponse } from 'next/server';
import { requireOrgAccess } from '@/lib/auth/orgAccess';
import { listMembers } from '@/lib/org/members';

export const runtime = 'nodejs';

export async function GET(_request: Request, { params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  try {
    const access = await requireOrgAccess(orgId, 'site.read');
    if (!access.ok) return access.response;

    const members = await listMembers(orgId);
    return NextResponse.json({ members, currentUserId: access.userId, currentRole: access.role });
  } catch (error) {
    console.error('Error listing members:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
