'use client';

import { RiMailOpenLine } from '@remixicon/react';
import { useCurrentLanguage, useI18n } from '@/lib/i18n/useI18n';
import { formatMessage } from '@/lib/i18n/format';
import type { InviteContext } from './inviteContext';

/** Aviso en login/registro de que se llega por una invitación. */
export function InviteBanner({ invite }: { invite: InviteContext }) {
  const { t } = useI18n(useCurrentLanguage());
  return (
    <div role="status" className="alert alert-info text-sm py-3">
      <RiMailOpenLine className="size-5" aria-hidden="true" />
      <span>
        {formatMessage(t('team.acceptPage.signedOutTitle'), {
          inviter: invite.inviterName,
          org: invite.organizationName,
        })}
      </span>
    </div>
  );
}
