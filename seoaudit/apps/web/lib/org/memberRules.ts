import { can, isAssignableRole, type OrgRole } from '@/lib/auth/permissions';

export interface MemberRef {
  userId: string;
  role: OrgRole;
}

export type RuleCode =
  | 'NOT_ALLOWED'
  | 'CANNOT_CHANGE_SELF'
  | 'CANNOT_MODIFY_OWNER'
  | 'USE_TRANSFER'
  | 'INVALID_ROLE'
  | 'USE_LEAVE'
  | 'OWNER_MUST_TRANSFER'
  | 'OWNER_MUST_DELETE'
  | 'HAS_MEMBERS'
  | 'NO_ADMINS'
  | 'INVALID_TARGET'
  | 'TARGET_NOT_ADMIN';

export type RuleResult = { ok: true } | { ok: false; code: RuleCode };

/** Estado HTTP con el que cada regla rechaza la operación en la API. */
export const RULE_STATUS: Record<RuleCode, number> = {
  NOT_ALLOWED: 403,
  CANNOT_CHANGE_SELF: 400,
  CANNOT_MODIFY_OWNER: 403,
  USE_TRANSFER: 400,
  INVALID_ROLE: 400,
  USE_LEAVE: 400,
  OWNER_MUST_TRANSFER: 409,
  OWNER_MUST_DELETE: 409,
  HAS_MEMBERS: 409,
  NO_ADMINS: 409,
  INVALID_TARGET: 400,
  TARGET_NOT_ADMIN: 400,
};

const OK: RuleResult = { ok: true };
const fail = (code: RuleCode): RuleResult => ({ ok: false, code });

export function canChangeRole(actor: MemberRef, target: MemberRef, newRole: string): RuleResult {
  if (!can(actor.role, 'members.manage')) return fail('NOT_ALLOWED');
  if (actor.userId === target.userId) return fail('CANNOT_CHANGE_SELF');
  if (target.role === 'owner') return fail('CANNOT_MODIFY_OWNER');
  if (newRole === 'owner') return fail('USE_TRANSFER');
  if (!isAssignableRole(newRole)) return fail('INVALID_ROLE');
  return OK;
}

export function canRemove(actor: MemberRef, target: MemberRef): RuleResult {
  if (!can(actor.role, 'members.manage')) return fail('NOT_ALLOWED');
  if (actor.userId === target.userId) return fail('USE_LEAVE');
  if (target.role === 'owner') return fail('CANNOT_MODIFY_OWNER');
  return OK;
}

/** `memberCount` incluye al propio miembro. */
export function canLeave(member: MemberRef, memberCount: number): RuleResult {
  if (member.role !== 'owner') return OK;
  return fail(memberCount <= 1 ? 'OWNER_MUST_DELETE' : 'OWNER_MUST_TRANSFER');
}

/** `memberCount` incluye al owner. */
export function canDelete(actor: MemberRef, memberCount: number): RuleResult {
  if (!can(actor.role, 'org.manage')) return fail('NOT_ALLOWED');
  if (memberCount > 1) return fail('HAS_MEMBERS');
  return OK;
}

/** Si el owner puede iniciar una transferencia, según cuántos admins hay. */
export function canStartTransfer(actor: MemberRef, adminCount: number): RuleResult {
  if (!can(actor.role, 'org.manage')) return fail('NOT_ALLOWED');
  if (adminCount === 0) return fail('NO_ADMINS');
  return OK;
}

export function canTransfer(actor: MemberRef, target: MemberRef | null): RuleResult {
  if (!can(actor.role, 'org.manage')) return fail('NOT_ALLOWED');
  if (!target || target.userId === actor.userId) return fail('INVALID_TARGET');
  if (target.role !== 'admin') return fail('TARGET_NOT_ADMIN');
  return OK;
}
