import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import connectMongoose from '@/lib/db/mongoose';
import { connectToDatabase } from '@/lib/db/mongo';
import Membership from '@/lib/models/Membership';
import { isOrgRole, type OrgRole } from '@/lib/auth/permissions';
import { RULE_STATUS, type MemberRef, type RuleResult } from '@/lib/org/memberRules';

export interface MemberView {
  userId: string;
  name: string;
  email: string;
  role: OrgRole;
  createdAt: string | null;
}

/** Miembros de la organización con nombre y email, el owner primero. */
export async function listMembers(organizationId: string): Promise<MemberView[]> {
  await connectMongoose();
  const memberships = await Membership.find({ organizationId })
    .select('userId role createdAt')
    .lean<Array<{ userId: string; role: string; createdAt?: Date }>>();

  const ids = memberships.map((m) => m.userId).filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id));
  const { db } = await connectToDatabase();
  const users = await db
    .collection('users')
    .find({ _id: { $in: ids } }, { projection: { name: 1, email: 1 } })
    .toArray();
  const byId = new Map(users.map((u) => [u._id.toString(), u]));

  const order: Record<OrgRole, number> = { owner: 0, admin: 1, editor: 2, viewer: 3 };
  return memberships
    .filter((m) => isOrgRole(m.role))
    .map((m) => {
      const u = byId.get(m.userId);
      return {
        userId: m.userId,
        name: (u?.name as string) || '',
        email: (u?.email as string) || '',
        role: m.role as OrgRole,
        createdAt: m.createdAt ? new Date(m.createdAt).toISOString() : null,
      };
    })
    .sort((a, b) => order[a.role] - order[b.role] || a.name.localeCompare(b.name));
}

export async function getMemberRef(organizationId: string, userId: string): Promise<MemberRef | null> {
  await connectMongoose();
  const m = await Membership.findOne({ organizationId, userId }).select('userId role').lean<{ userId: string; role: string }>();
  return m && isOrgRole(m.role) ? { userId: m.userId, role: m.role } : null;
}

export function ruleError(rule: Exclude<RuleResult, { ok: true }>, message: string) {
  return NextResponse.json({ error: message, code: rule.code }, { status: RULE_STATUS[rule.code] });
}
