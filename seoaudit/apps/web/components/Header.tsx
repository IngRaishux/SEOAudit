'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { SignOutButton } from '@/components/SignOutButton';
import { useI18n, useCurrentLanguage } from '@/lib/i18n/useI18n';

interface HeaderProps {
  currentOrganization?: string;
  currentOrgId?: string;
}

export function Header({ currentOrganization, currentOrgId }: HeaderProps) {
  const { data: session } = useSession();
  const lang = useCurrentLanguage();
  const { t } = useI18n(lang);

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      <div className="flex justify-between items-center px-4 lg:px-8 py-3 lg:py-4 gap-2 lg:gap-4">
        {session ? (
          <Link href="/organizations" className="text-lg lg:text-xl font-bold text-zinc-900 dark:text-white flex-shrink-0">
            SEO Audit
          </Link>
        ) : (
          <Link href="/" className="text-lg lg:text-xl font-bold text-zinc-900 dark:text-white flex-shrink-0">
            SEO Audit
          </Link>
        )}

        <div className="flex items-center gap-2 lg:gap-6 ml-auto">
          {session ? (
            <>
              <div className="hidden md:flex flex-col items-end">
                <p className="text-xs lg:text-sm font-medium text-zinc-900 dark:text-white truncate max-w-24 lg:max-w-none">
                  {session.user?.name || session.user?.email}
                </p>
                {currentOrganization && (
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 truncate max-w-24 lg:max-w-none">
                    {currentOrganization}
                  </p>
                )}
              </div>
              <Link
                href="/organizations"
                className="hidden sm:inline text-xs lg:text-sm text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap"
              >
                {t('common.organizations')}
              </Link>
              <Link
                href={currentOrgId ? `/settings?org=${currentOrgId}` : '/settings'}
                className="hidden sm:inline text-xs lg:text-sm text-zinc-600 hover:text-zinc-700 font-medium whitespace-nowrap"
              >
                {t('common.settings')}
              </Link>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-xs lg:text-sm text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap"
              >
                {t('auth.login')}
              </Link>
              <Link
                href="/register"
                className="text-xs lg:text-sm px-2 lg:px-4 py-1 lg:py-2 bg-blue-600 text-white rounded hover:bg-blue-700 whitespace-nowrap"
              >
                {t('auth.signUp')}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
