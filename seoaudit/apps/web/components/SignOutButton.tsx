'use client';

import { signOut } from 'next-auth/react';
import { Button } from '@/components/Button';
import { useI18n, useCurrentLanguage } from '@/lib/i18n/useI18n';

export function SignOutButton() {
  const lang = useCurrentLanguage();
  const { t } = useI18n(lang);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={handleSignOut}
    >
      {t('header.logout')}
    </Button>
  );
}
