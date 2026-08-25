'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { setSelectedOrganization } from '@/app/actions';

interface Organization {
  id: string;
  name: string;
}

interface OrganizationSelectorProps {
  organizations: Organization[];
  currentOrgId?: string;
}

export function OrganizationSelector({
  organizations,
  currentOrgId,
}: OrganizationSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  if (organizations.length === 0) {
    return null;
  }

  const currentOrg = organizations.find((o) => o.id === currentOrgId);

  const handleSelectOrganization = async (orgId: string) => {
    await setSelectedOrganization(orgId);
    setIsOpen(false);
    // Navigate to current page with selected org parameter
    let nextPath = '/dashboard';
    if (pathname === '/settings') {
      nextPath = '/settings';
    } else if (pathname.startsWith('/sites/')) {
      nextPath = pathname;
    }
    router.push(`${nextPath}?org=${orgId}`);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
      >
        <span className="truncate max-w-xs">{currentOrg?.name || 'Select Org'}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-lg z-50">
          <div className="p-2 max-h-64 overflow-y-auto">
            {organizations.map((org) => (
              <button
                key={org.id}
                onClick={() => handleSelectOrganization(org.id)}
                className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                  org.id === currentOrgId
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 font-medium'
                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                {org.name}
              </button>
            ))}
          </div>
          <div className="border-t border-zinc-200 dark:border-zinc-700 p-2">
            <a
              href="/organizations"
              className="block w-full text-left px-3 py-2 rounded text-sm text-blue-600 dark:text-blue-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              + New Organization
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
