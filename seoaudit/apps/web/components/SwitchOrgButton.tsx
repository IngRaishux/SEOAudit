'use client';

import { useRouter } from 'next/navigation';
import { clearSelectedOrganization } from '@/app/actions';

export function SwitchOrgButton() {
  const router = useRouter();

  const handleSwitchOrg = async () => {
    console.log('[SwitchOrgButton] Clearing organization');

    // Clear the selected organization cookie
    await clearSelectedOrganization();

    console.log('[SwitchOrgButton] Navigating to /organizations');

    // Navigate to organizations page
    router.push('/organizations');

    // Revalidate to show updated header
    router.refresh();
  };

  return (
    <button
      onClick={handleSwitchOrg}
      className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded hover:bg-zinc-300 dark:hover:bg-zinc-700 text-sm font-medium"
    >
      Switch Org
    </button>
  );
}
