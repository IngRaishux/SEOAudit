'use client';

import { useState } from 'react';
import { RiCloseCircleLine, RiMailSendLine } from '@remixicon/react';
import { toastError, toastSuccess } from '@/lib/toast';
import { CopyLink } from './CopyLink';
import { api, useTeamT, type InvitationView } from './useTeam';

interface Props {
  orgId: string;
  invitations: InvitationView[];
  /** Links disponibles en esta sesión (recién creados o reenviados), por id de invitación. */
  links: Record<string, string>;
  onLink: (id: string, link: string) => void;
  onChange: () => void | Promise<void>;
}

export function InvitationsList({ orgId, invitations, links, onLink, onChange }: Props) {
  const { lang, tt, errorText, roleLabel } = useTeamT();
  const [busy, setBusy] = useState<string | null>(null);
  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat(lang === 'es' ? 'es-MX' : 'en-US', { dateStyle: 'medium' }).format(new Date(iso));

  async function resend(inv: InvitationView) {
    setBusy(inv.id);
    const res = await api<{ link: string; emailSent: boolean }>(
      `/api/organizations/${orgId}/invitations/${inv.id}/resend`,
      { method: 'POST' }
    );
    setBusy(null);
    if (!res.ok) return toastError(errorText(res.data));
    onLink(inv.id, res.data.link);
    if (res.data.emailSent) toastSuccess(tt('invitations.resent'));
    else toastError(tt('invite.emailFailed'));
    await onChange();
  }

  async function revoke(inv: InvitationView) {
    if (!window.confirm(tt('invitations.revokeConfirm', { email: inv.email }))) return;
    setBusy(inv.id);
    const res = await api(`/api/organizations/${orgId}/invitations/${inv.id}`, { method: 'DELETE' });
    setBusy(null);
    if (!res.ok) return toastError(errorText(res.data));
    toastSuccess(tt('invitations.revoked'));
    await onChange();
  }

  if (invitations.length === 0) {
    return <p className="text-sm text-base-content/60">{tt('invitations.empty')}</p>;
  }

  return (
    <ul className="divide-y divide-base-300">
      {invitations.map((inv) => (
        <li key={inv.id} className="py-3 space-y-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="font-medium break-all">{inv.email}</div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-base-content/60">
                <span className="badge badge-ghost badge-sm">{roleLabel(inv.role)}</span>
                {inv.status === 'expired' ? (
                  <span className="badge badge-warning badge-sm">{tt('invitations.expired')}</span>
                ) : (
                  <span>{tt('invitations.expires', { date: formatDate(inv.expiresAt) })}</span>
                )}
                {inv.emailStatus === 'failed' && (
                  <span className="badge badge-error badge-outline badge-sm">{tt('invitations.emailFailed')}</span>
                )}
                {inv.invitedByName && <span>· {tt('invitations.invitedBy', { name: inv.invitedByName })}</span>}
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <button type="button" className="btn btn-ghost btn-sm" disabled={busy === inv.id} onClick={() => resend(inv)}>
                <RiMailSendLine className="size-4" aria-hidden="true" />
                {tt('invitations.resend')}
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm text-error"
                disabled={busy === inv.id}
                onClick={() => revoke(inv)}
              >
                <RiCloseCircleLine className="size-4" aria-hidden="true" />
                {tt('invitations.revoke')}
              </button>
            </div>
          </div>
          {links[inv.id] && <CopyLink link={links[inv.id]} />}
        </li>
      ))}
    </ul>
  );
}
