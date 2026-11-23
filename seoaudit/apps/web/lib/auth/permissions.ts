export const ORG_ROLES = ['owner', 'admin', 'editor', 'viewer'] as const;
export type OrgRole = (typeof ORG_ROLES)[number];

/** Roles que se pueden asignar por invitación o cambio de rol (owner solo se obtiene por transferencia). */
export const ASSIGNABLE_ROLES = ['admin', 'editor', 'viewer'] as const;
export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];

export type OrgAction =
  | 'site.read'
  | 'crawl.run'
  | 'content.edit'
  | 'site.delete'
  | 'members.manage'
  | 'org.manage';

const PERMISSIONS: Record<OrgAction, readonly OrgRole[]> = {
  'site.read': ['owner', 'admin', 'editor', 'viewer'],
  'crawl.run': ['owner', 'admin', 'editor', 'viewer'],
  'content.edit': ['owner', 'admin', 'editor'],
  'site.delete': ['owner', 'admin'],
  'members.manage': ['owner', 'admin'],
  'org.manage': ['owner'],
};

export function isOrgRole(value: unknown): value is OrgRole {
  return typeof value === 'string' && (ORG_ROLES as readonly string[]).includes(value);
}

export function isAssignableRole(value: unknown): value is AssignableRole {
  return typeof value === 'string' && (ASSIGNABLE_ROLES as readonly string[]).includes(value);
}

export function can(role: OrgRole | string | null | undefined, action: OrgAction): boolean {
  return isOrgRole(role) && PERMISSIONS[action].includes(role);
}
