'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RiInformationLine, RiLogoutBoxRLine, RiUserSharedLine } from '@remixicon/react';
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
import type { OrgRole } from '@/lib/auth/permissions';
import { canDelete, canLeave, canStartTransfer } from '@/lib/org/memberRules';
import { toastError, toastSuccess } from '@/lib/toast';
import { clearSelectedOrganization } from '@/app/actions';
import { DeleteOrganizationDialog } from '@/components/DeleteOrganizationDialog';
import { api, useTeamT, type MemberView, type TeamOrg } from './useTeam';

interface Props {
  org: TeamOrg;
  members: MemberView[];
  currentUserId: string;
  currentRole: OrgRole;
  onChange: () => void | Promise<void>;
}

function Blocked({ text }: { text: string }) {
  return (
    <p className="flex items-start gap-2 text-sm text-base-content/70">
      <RiInformationLine className="size-4 mt-0.5 shrink-0 text-info" aria-hidden="true" />
      <span>{text}</span>
    </p>
  );
}

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="max-w-md">
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-base-content/70">{description}</p>
      </div>
      <div className="shrink-0 sm:max-w-xs">{children}</div>
    </div>
  );
}

function TransferDialog({ org, admins, onDone }: { org: TeamOrg; admins: MemberView[]; onDone: () => void }) {
  const { tt, errorText } = useTeamT();
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState(admins[0]?.userId ?? '');
  const [confirmName, setConfirmName] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await api(`/api/organizations/${org.id}/transfer`, {
      method: 'POST',
      body: { targetUserId: target, confirmName },
    });
    setSaving(false);
    if (!res.ok) return toastError(errorText(res.data));
    toastSuccess(tt('danger.transferred'));
    setOpen(false);
    onDone();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="light" size="sm" icon={<RiUserSharedLine className="size-4" aria-hidden="true" />}>
          {tt('danger.transfer')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{tt('danger.transfer')}</DialogTitle>
          <DialogDescription>{tt('danger.transferDescription')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4 py-2">
          <label className="form-control w-full">
            <span className="label-text font-medium pb-1">{tt('danger.transferTarget')}</span>
            <select className="select select-bordered w-full" value={target} onChange={(e) => setTarget(e.target.value)}>
              {admins.map((a) => (
                <option key={a.userId} value={a.userId}>
                  {a.name ? `${a.name} (${a.email})` : a.email}
                </option>
              ))}
            </select>
          </label>
          <label className="form-control w-full">
            <span className="label-text pb-1">
              {tt('danger.transferConfirm')} <strong>{org.name}</strong>
            </span>
            <input
              className="input input-bordered w-full"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={org.name}
            />
          </label>
          <DialogFooter>
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={saving}>
              {tt('invite.close')}
            </Button>
            <Button type="submit" size="sm" isLoading={saving} disabled={confirmName.trim() !== org.name.trim() || !target}>
              {tt('danger.transferButton')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DangerZone({ org, members, currentUserId, currentRole, onChange }: Props) {
  const router = useRouter();
  const { tt, errorText } = useTeamT();
  const [leaving, setLeaving] = useState(false);
  const me = { userId: currentUserId, role: currentRole };
  const admins = members.filter((m) => m.role === 'admin');

  async function leave() {
    if (!window.confirm(tt('danger.leaveConfirm', { org: org.name }))) return;
    setLeaving(true);
    const res = await api(`/api/organizations/${org.id}/leave`, { method: 'POST' });
    setLeaving(false);
    if (!res.ok) return toastError(errorText(res.data));
    toastSuccess(tt('danger.left'));
    await clearSelectedOrganization();
    router.replace('/organizations');
    router.refresh();
  }

  const leaveRule = canLeave(me, members.length);
  const transferRule = canStartTransfer(me, admins.length);
  const deleteRule = canDelete(me, members.length);
  const isOwner = currentRole === 'owner';

  return (
    <section className="rounded-box border border-error/40 p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-error">{tt('danger.title')}</h2>
      <div className="divide-y divide-base-300">
        {isOwner && (
          <Section title={tt('danger.transfer')} description={tt('danger.transferDescription')}>
            {transferRule.ok ? (
              <TransferDialog org={org} admins={admins} onDone={() => void onChange()} />
            ) : (
              <Blocked text={tt(`errors.${transferRule.code}`)} />
            )}
          </Section>
        )}
        {isOwner && (
          <Section title={tt('danger.delete')} description={tt('danger.deleteDescription')}>
            {deleteRule.ok ? (
              <DeleteOrganizationDialog organizationId={org.id} organizationName={org.name} />
            ) : (
              <Blocked text={tt(`errors.${deleteRule.code}`)} />
            )}
          </Section>
        )}
        <Section title={tt('danger.leave')} description={tt('danger.leaveDescription')}>
          {leaveRule.ok ? (
            <Button
              variant="destructive"
              size="sm"
              isLoading={leaving}
              onClick={leave}
              icon={<RiLogoutBoxRLine className="size-4" aria-hidden="true" />}
            >
              {tt('danger.leave')}
            </Button>
          ) : (
            <Blocked text={tt(`errors.${leaveRule.code}`)} />
          )}
        </Section>
      </div>
    </section>
  );
}
