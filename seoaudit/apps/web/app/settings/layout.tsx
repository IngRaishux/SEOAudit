import { ReactNode } from 'react';
import Link from 'next/link';

interface SettingsLayoutProps {
  children: ReactNode;
  params: Promise<{ type?: string }>;
}

export default async function SettingsLayout({
  children,
  params,
}: SettingsLayoutProps) {
  const resolvedParams = await params;
  const currentType = resolvedParams.type || 'user';

  const tabs = [
    { id: 'user', label: 'User Settings', href: '/settings' },
    { id: 'organization', label: 'Organization', href: '/settings/organization' },
    { id: 'sites', label: 'Sites', href: '/settings/sites' },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-4xl font-bold mb-8">Settings</h1>

        {/* Tabs Navigation */}
        <div className="mb-8 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex gap-6">
            {tabs.map((tab) => (
              <Link
                key={tab.id}
                href={tab.href}
                className={`pb-3 px-1 font-medium text-sm transition-colors ${
                  currentType === tab.id
                    ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div>{children}</div>
      </div>
    </div>
  );
}
