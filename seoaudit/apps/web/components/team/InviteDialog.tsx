'use client';

import { useState } from 'react';
import { RiErrorWarningLine, RiUserAddLine } from '@remixicon/react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@seo-optimizer/ui';
import type { AssignableRole } from '@/lib/auth/permissions';
import { toastSuccess } from '@/lib/toast';
import { CopyLink } from './CopyLink';
import { ASSIGNABLE, api, useTeamT, type InvitationView } from './useTeam';

interface Props {
  orgId: string;
  onCreated: (invitation: InvitationView, link: string) => void;
}

type Result = { link: string; emailSent: boolean };

export function InviteDialog({ orgId, onCreated }: Props) {
  const { tt, errorText, roleLabel } = useTeamT();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AssignableRole>('editor');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  function reset(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setEmail('');
      setRole('editor');
      setError(null);
      setResult(null);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    const res = await api<{ invitation: InvitationView; link: string; emailSent: boolean }>(
      `/api/organizations/${orgId}/invitations`,
      { method: 'POST', body: { email, role } }
    );
    setSending(false);
    if (!res.ok) return setError(errorText(res.data));
    toastSuccess(tt('invite.created'));
    setResult({ link: res.data.link, emailSent: res.data.emailSent });
    onCreated(res.data.invitation, res.data.link);
  }

  return (
    <Dialog open={open} onOpenChange={reset}>
      <DialogTrigger asChild>
        <Button size="sm" icon={<RiUserAddLine className="size-4" aria-hidden="true" />}>
          {tt('invite.button')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{tt('invite.title')}</DialogTitle>
          <DialogDescription>{tt('invite.description')}</DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-3 py-2">
            {!result.emailSent && (
              <div role="alert" className="alert alert-warning text-sm py-3">
                <RiErrorWarningLine className="size-5" aria-hidden="true" />
                <span>{tt('invite.emailFailed')}</span>
              </div>
            )}
            <p className="text-sm font-medium">{tt('invite.linkLabel')}</p>
            <CopyLink link={result.link} />
            <p className="text-xs text-base-content/60">{tt('invite.linkHint')}</p>
            <DialogFooter>
              <Button variant="ghost" size="sm" onClick={() => reset(false)}>
                {tt('invite.close')}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4 py-2">
            {error && (
              <div role="alert" className="alert alert-error text-sm py-3">
                <RiErrorWarningLine className="size-5" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}
            <label className="form-control w-full">
              <span className="label-text font-medium pb-1">{tt('invite.email')}</span>
              <input
                type="email"
                required
                autoFocus
                className="input input-bordered w-full"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ana@empresa.com"
                disabled={sending}
              />
            </label>
            <label className="form-control w-full">
              <span className="label-text font-medium pb-1">{tt('invite.role')}</span>
              <select
                className="select select-bordered w-full"
                value={role}
                onChange={(e) => setRole(e.target.value as AssignableRole)}
                disabled={sending}
              >
                {ASSIGNABLE.map((r) => (
                  <option key={r} value={r}>
                    {roleLabel(r)} — {tt(`roleDescriptions.${r}`)}
                  </option>
                ))}
              </select>
            </label>
            <DialogFooter>
              <Button type="button" variant="ghost" size="sm" onClick={() => reset(false)} disabled={sending}>
                {tt('invite.close')}
              </Button>
              <Button type="submit" size="sm" isLoading={sending} loadingText={tt('invite.sending')}>
                {tt('invite.send')}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
