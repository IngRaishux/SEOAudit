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
      onClick={handleSignOut}
      className="bg-red-600 hover:bg-red-700 text-white"
    >
      {t('header.logout')}
    </Button>
  );
}
