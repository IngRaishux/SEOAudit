import type { InviteContext } from '@/components/invitations/inviteContext';
import { getInvitationPreview } from './service';

/** Resuelve el `?invite=` de login/registro; solo devuelve contexto si la invitación sigue pendiente. */
export async function resolveInviteParam(token: string | string[] | undefined): Promise<InviteContext | null> {
  if (typeof token !== 'string' || !token) return null;
  const preview = await getInvitationPreview(token);
  if (preview.status !== 'pending') return null;
  return {
    token,
    email: preview.email,
    inviterName: preview.inviterName,
    organizationName: preview.organizationName,
  };
}
