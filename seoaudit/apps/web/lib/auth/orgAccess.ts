import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectMongoose from '@/lib/db/mongoose';
import Membership from '@/lib/models/Membership';
import Site from '@/lib/models/Site';
import Page from '@/lib/models/Page';
import Suggestion from '@/lib/models/Suggestion';
import { getSessionUserId } from '@/lib/auth/sessionUser';
import { can, isOrgRole, type OrgAction, type OrgRole } from '@/lib/auth/permissions';

export interface OrgAccess {
  userId: string;
  organizationId: string;
  role: OrgRole;
}

export type AccessResult<T = object> =
  | ({ ok: true } & OrgAccess & T)
  | { ok: false; response: NextResponse };

export function deny(error: string, status: number, code?: string): { ok: false; response: NextResponse } {
  return { ok: false, response: NextResponse.json(code ? { error, code } : { error }, { status }) };
}

const unauthorized = () => deny('Unauthorized', 401);
const notFound = (what: string) => deny(`${what} not found`, 404);

export function isObjectId(value: unknown): value is string {
  return typeof value === 'string' && mongoose.isValidObjectId(value);
}

/** Sesión requerida; devuelve el id del usuario. */
export async function requireUser(): Promise<{ ok: true; userId: string } | { ok: false; response: NextResponse }> {
  const userId = await getSessionUserId();
  return userId ? { ok: true, userId } : unauthorized();
}

/** Rol del usuario en la organización, o null si no es miembro. */
export async function getMemberRole(userId: string, organizationId: string): Promise<OrgRole | null> {
  if (!isObjectId(organizationId)) return null;
  await connectMongoose();
  const membership = await Membership.findOne({ userId, organizationId }).select('role').lean<{ role: string }>();
  return membership && isOrgRole(membership.role) ? membership.role : null;
}

async function authorize(userId: string, organizationId: string, action: OrgAction): Promise<AccessResult> {
  const role = await getMemberRole(userId, organizationId);
  if (!role) return deny('No tienes acceso a esta organización', 403);
  if (!can(role, action)) return deny('Tu rol no permite esta acción', 403, 'FORBIDDEN_ROLE');
  return { ok: true, userId, organizationId, role };
}

/** Autoriza una acción sobre una organización indicada de forma explícita. */
export async function requireOrgAccess(organizationId: string | null | undefined, action: OrgAction): Promise<AccessResult> {
  const user = await requireUser();
  if (!user.ok) return user;
  if (!organizationId) return deny('organizationId es requerido', 400);
  if (!isObjectId(organizationId)) return notFound('Organization');
  return authorize(user.userId, organizationId, action);
}

/** Autoriza contra la organización a la que pertenece el sitio. */
export async function requireSiteAccess(siteId: string, action: OrgAction): Promise<AccessResult<{ siteId: string }>> {
  const user = await requireUser();
  if (!user.ok) return user;
  if (!isObjectId(siteId)) return notFound('Site');
  await connectMongoose();
  const site = await Site.findById(siteId).select('organizationId').lean<{ organizationId: unknown }>();
  if (!site) return notFound('Site');
  const access = await authorize(user.userId, String(site.organizationId), action);
  return access.ok ? { ...access, siteId } : access;
}

/** Autoriza contra la organización a la que pertenece la página. */
export async function requirePageAccess(pageId: string, action: OrgAction): Promise<AccessResult<{ pageId: string }>> {
  const user = await requireUser();
  if (!user.ok) return user;
  if (!isObjectId(pageId)) return notFound('Page');
  await connectMongoose();
  const page = await Page.findById(pageId).select('organizationId siteId').lean<{ organizationId?: unknown; siteId: unknown }>();
  if (!page) return notFound('Page');
  let organizationId = page.organizationId ? String(page.organizationId) : null;
  if (!organizationId) {
    const site = await Site.findById(page.siteId).select('organizationId').lean<{ organizationId: unknown }>();
    if (!site) return notFound('Page');
    organizationId = String(site.organizationId);
  }
  const access = await authorize(user.userId, organizationId, action);
  return access.ok ? { ...access, pageId } : access;
}

/** Autoriza contra la organización a la que pertenece la sugerencia. */
export async function requireSuggestionAccess(
  suggestionId: string,
  action: OrgAction
): Promise<AccessResult<{ suggestionId: string }>> {
  const user = await requireUser();
  if (!user.ok) return user;
  if (!isObjectId(suggestionId)) return notFound('Suggestion');
  await connectMongoose();
  const suggestion = await Suggestion.findById(suggestionId).select('organizationId').lean<{ organizationId: unknown }>();
  if (!suggestion) return notFound('Suggestion');
  const access = await authorize(user.userId, String(suggestion.organizationId), action);
  return access.ok ? { ...access, suggestionId } : access;
}

/** Autoriza contra la organización de un job (crawl o generación) ya resuelto por quien llama. */
export async function requireJobAccess(
  job: { organizationId: unknown } | null | undefined,
  action: OrgAction
): Promise<AccessResult> {
  const user = await requireUser();
  if (!user.ok) return user;
  if (!job) return notFound('Job');
  return authorize(user.userId, String(job.organizationId), action);
}
