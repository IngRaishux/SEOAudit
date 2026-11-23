/** Invitación pendiente con la que se llega a login o registro desde /invite/[token]. */
export interface InviteContext {
  token: string;
  email: string;
  inviterName: string;
  organizationName: string;
}

export const inviteCallbackUrl = (invite?: InviteContext | null) =>
  invite ? `/invite/${encodeURIComponent(invite.token)}` : '/organizations';

export const withInvite = (path: string, invite?: InviteContext | null) =>
  invite ? `${path}?invite=${encodeURIComponent(invite.token)}` : path;
