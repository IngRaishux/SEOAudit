'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RiCheckLine, RiCloseLine, RiErrorWarningLine } from '@remixicon/react';
import { useCurrentLanguage, useI18n } from '@/lib/i18n/useI18n';

type State = 'idle' | 'accept' | 'decline' | 'declined' | 'invalid' | 'error';

/** Botones Aceptar / Rechazar de la pantalla de invitación. */
export function InviteResponse({ token }: { token: string }) {
  const router = useRouter();
  const { t } = useI18n(useCurrentLanguage());
  const tr = (key: string) => t(`team.acceptPage.${key}`);
  const [state, setState] = useState<State>('idle');

  async function respond(action: 'accept' | 'decline') {
    setState(action);
    try {
      const res = await fetch(`/api/invitations/${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && action === 'accept' && data.redirect) {
        router.push(data.redirect);
        router.refresh();
        return;
      }
      if (res.ok) {
        setState('declined');
        return;
      }
      setState(res.status === 410 ? 'invalid' : 'error');
    } catch {
      setState('error');
    }
  }

  if (state === 'declined' || state === 'invalid') {
    return (
      <div className="space-y-4">
        <p role="status" className="font-medium">
          {tr(state === 'declined' ? 'declined' : 'invalid')}
        </p>
        <div className="card-actions justify-end">
          <Link href="/organizations" className="btn btn-ghost">
            {tr('goToOrganizations')}
          </Link>
        </div>
      </div>
    );
  }

  const busy = state === 'accept' || state === 'decline';
  return (
    <div className="space-y-4">
      {state === 'error' && (
        <div role="alert" className="alert alert-error text-sm py-3">
          <RiErrorWarningLine className="size-5" aria-hidden="true" />
          <span>{t('team.errors.generic')}</span>
        </div>
      )}
      <div className="card-actions flex-col sm:flex-row sm:justify-end">
        <button
          type="button"
          className="btn btn-ghost w-full sm:w-auto"
          onClick={() => respond('decline')}
          disabled={busy}
        >
          {state === 'decline' ? <span className="loading loading-spinner loading-sm" /> : <RiCloseLine className="size-4" aria-hidden="true" />}
          {tr('decline')}
        </button>
        <button
          type="button"
          className="btn btn-primary w-full sm:w-auto"
          onClick={() => respond('accept')}
          disabled={busy}
        >
          {state === 'accept' ? <span className="loading loading-spinner loading-sm" /> : <RiCheckLine className="size-4" aria-hidden="true" />}
          {busy ? tr('working') : tr('accept')}
        </button>
      </div>
    </div>
  );
}
