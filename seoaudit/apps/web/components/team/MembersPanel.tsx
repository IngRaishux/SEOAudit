'use client';

import { useState } from 'react';
import { can } from '@/lib/auth/permissions';
import { DangerZone } from './DangerZone';
import { InvitationsList } from './InvitationsList';
import { InviteDialog } from './InviteDialog';
import { MembersTable } from './MembersTable';
import { useTeamData, useTeamT, type TeamOrg } from './useTeam';

/** Pestaña Miembros: lista, invitaciones y zona de peligro según el rol del usuario. */
export function MembersPanel({ org }: { org: TeamOrg }) {
  const { tt } = useTeamT();
  const { members, invitations, currentUserId, currentRole, loading, error, reload } = useTeamData(org.id);
  // El token no se guarda en claro: el link solo existe en esta sesión tras crear o reenviar
  const [links, setLinks] = useState<Record<string, string>>({});
  const addLink = (id: string, link: string) => setLinks((prev) => ({ ...prev, [id]: link }));

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <span className="loading loading-spinner loading-md" aria-label="Loading" />
      </div>
    );
  }
  if (error || !currentUserId || !currentRole) {
    return <p className="text-error">{tt('members.loadError')}</p>;
  }

  const canManage = can(currentRole, 'members.manage');

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">
            {tt('members.title')} <span className="text-base-content/60 font-normal">({members.length})</span>
          </h2>
          {canManage && (
            <InviteDialog
              orgId={org.id}
              onCreated={(invitation, link) => {
                addLink(invitation.id, link);
                void reload();
              }}
            />
          )}
        </div>
        <MembersTable
          orgId={org.id}
          members={members}
          currentUserId={currentUserId}
          currentRole={currentRole}
          onChange={reload}
        />
      </section>

      {canManage && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">{tt('invitations.title')}</h2>
          <InvitationsList orgId={org.id} invitations={invitations} links={links} onLink={addLink} onChange={reload} />
        </section>
      )}

      <DangerZone org={org} members={members} currentUserId={currentUserId} currentRole={currentRole} onChange={reload} />
    </div>
  );
}
