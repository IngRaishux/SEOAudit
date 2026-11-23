'use client';

import { useCallback, useEffect, useState } from 'react';
import { useCurrentLanguage, useI18n } from '@/lib/i18n/useI18n';
import { formatMessage } from '@/lib/i18n/format';
import { can, type AssignableRole, type OrgRole } from '@/lib/auth/permissions';
import type { MemberView } from '@/lib/org/members';
import type { InvitationView } from '@/lib/invitations/service';

export type { MemberView, InvitationView };

export interface TeamOrg {
  id: string;
  name: string;
}

/** Traducciones del módulo de equipos, con formato y mensajes de error por código de la API. */
export function useTeamT() {
  const lang = useCurrentLanguage();
  const { t } = useI18n(lang);
  const tt = useCallback(
    (key: string, values?: Record<string, string | number>) => {
      const text = t(`team.${key}`);
      return values ? formatMessage(text, values) : text;
    },
    [t]
  );
  const errorText = useCallback(
    (data: { code?: string; error?: string } | null | undefined) =>
      (data?.code && t(`team.errors.${data.code}`)) || data?.error || t('team.errors.generic'),
    [t]
  );
  const roleLabel = useCallback((role: OrgRole) => t(`team.roles.${role}`), [t]);
  return { lang, t, tt, errorText, roleLabel };
}

export async function api<T = Record<string, unknown>>(
  url: string,
  init?: { method?: string; body?: unknown }
): Promise<{ ok: boolean; status: number; data: T & { code?: string; error?: string } }> {
  const res = await fetch(url, {
    method: init?.method ?? 'GET',
    headers: init?.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

/** Miembros e invitaciones de la organización, recargables. */
export function useTeamData(orgId: string) {
  const [members, setMembers] = useState<MemberView[]>([]);
  const [invitations, setInvitations] = useState<InvitationView[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState<OrgRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const reload = useCallback(async () => {
    const res = await api<{ members: MemberView[]; currentUserId: string; currentRole: OrgRole }>(
      `/api/organizations/${orgId}/members`
    );
    if (!res.ok) {
      setError(true);
      setLoading(false);
      return;
    }
    setMembers(res.data.members);
    setCurrentUserId(res.data.currentUserId);
    setCurrentRole(res.data.currentRole);
    if (can(res.data.currentRole, 'members.manage')) {
      const inv = await api<{ invitations: InvitationView[] }>(`/api/organizations/${orgId}/invitations`);
      if (inv.ok) setInvitations(inv.data.invitations);
    } else {
      setInvitations([]);
    }
    setError(false);
    setLoading(false);
  }, [orgId]);

  useEffect(() => {
    // Carga inicial al montar: el estado se actualiza cuando responde la API
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload();
  }, [reload]);

  return { members, invitations, currentUserId, currentRole, loading, error, reload };
}

export const ASSIGNABLE: AssignableRole[] = ['admin', 'editor', 'viewer'];
