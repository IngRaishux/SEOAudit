'use client';

import { useState } from 'react';
import { RiUserUnfollowLine } from '@remixicon/react';
import type { OrgRole } from '@/lib/auth/permissions';
import { canChangeRole, canRemove } from '@/lib/org/memberRules';
import { toastError, toastSuccess } from '@/lib/toast';
import { ASSIGNABLE, api, useTeamT, type MemberView } from './useTeam';

interface Props {
  orgId: string;
  members: MemberView[];
  currentUserId: string;
  currentRole: OrgRole;
  onChange: () => void | Promise<void>;
}

export function MembersTable({ orgId, members, currentUserId, currentRole, onChange }: Props) {
  const { tt, errorText, roleLabel } = useTeamT();
  const [busy, setBusy] = useState<string | null>(null);
  const actor = { userId: currentUserId, role: currentRole };

  async function changeRole(member: MemberView, role: string) {
    setBusy(member.userId);
    const res = await api(`/api/organizations/${orgId}/members/${member.userId}`, { method: 'PATCH', body: { role } });
    setBusy(null);
    if (!res.ok) return toastError(errorText(res.data));
    toastSuccess(tt('members.roleUpdated'));
    await onChange();
  }

  async function remove(member: MemberView) {
    if (!window.confirm(tt('members.removeConfirm', { name: member.name || member.email }))) return;
    setBusy(member.userId);
    const res = await api(`/api/organizations/${orgId}/members/${member.userId}`, { method: 'DELETE' });
    setBusy(null);
    if (!res.ok) return toastError(errorText(res.data));
    toastSuccess(tt('members.removed'));
    await onChange();
  }

  return (
    <div className="overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th>{tt('members.title')}</th>
            <th>{tt('members.role')}</th>
            <th>
              <span className="sr-only">{tt('members.remove')}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => {
            const isMe = member.userId === currentUserId;
            // Con cualquier rol asignable: decide si se muestra el selector para este miembro
            const editable = canChangeRole(actor, member, 'viewer').ok;
            const removable = canRemove(actor, member).ok;
            return (
              <tr key={member.userId}>
                <td>
                  <div className="font-medium">
                    {member.name || member.email}{' '}
                    {isMe && <span className="text-base-content/60 font-normal">{tt('members.you')}</span>}
                  </div>
                  <div className="text-sm text-base-content/60 break-all">{member.email}</div>
                </td>
                <td>
                  {editable ? (
                    <select
                      className="select select-bordered select-sm"
                      aria-label={`${tt('members.role')}: ${member.name || member.email}`}
                      value={member.role}
                      disabled={busy === member.userId}
                      onChange={(e) => changeRole(member, e.target.value)}
                    >
                      {ASSIGNABLE.map((role) => (
                        <option key={role} value={role}>
                          {roleLabel(role)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className={`badge ${member.role === 'owner' ? 'badge-primary' : 'badge-ghost'}`}>
                      {roleLabel(member.role)}
                    </span>
                  )}
                </td>
                <td className="text-right">
                  {removable && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm text-error"
                      disabled={busy === member.userId}
                      onClick={() => remove(member)}
                    >
                      <RiUserUnfollowLine className="size-4" aria-hidden="true" />
                      {tt('members.remove')}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
