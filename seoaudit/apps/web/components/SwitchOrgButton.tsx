'use client';

import { useRouter } from 'next/navigation';
import { clearSelectedOrganization } from '@/app/actions';
import { useI18n, useCurrentLanguage } from '@/lib/i18n/useI18n';

export function SwitchOrgButton() {
  const router = useRouter();
  const lang = useCurrentLanguage();
  const { t } = useI18n(lang);

  const handleSwitchOrg = async () => {
    await clearSelectedOrganization();
    router.push('/organizations');
    router.refresh();
  };

  return (
    <button
      onClick={handleSwitchOrg}
      className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded hover:bg-zinc-300 dark:hover:bg-zinc-700 text-sm font-medium"
    >
      {t('dashboard.switchOrg')}
    </button>
  );
}
