export const INVITATION_TTL_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

export type EffectiveInvitationStatus = 'pending' | 'expired' | 'accepted' | 'declined' | 'revoked';

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function expiresAtFrom(now: Date = new Date()): Date {
  return new Date(now.getTime() + INVITATION_TTL_DAYS * DAY_MS);
}

/** `expired` no se guarda: es una invitación pendiente cuya fecha ya pasó. */
export function effectiveStatus(
  invitation: { status: string; expiresAt: Date | string },
  now: Date = new Date()
): EffectiveInvitationStatus {
  if (invitation.status !== 'pending') return invitation.status as EffectiveInvitationStatus;
  return new Date(invitation.expiresAt).getTime() <= now.getTime() ? 'expired' : 'pending';
}
