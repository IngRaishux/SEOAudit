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
    <header className="navbar bg-base-100 border-b border-base-300 sticky top-0 z-40">
      <div className="flex-1">
        {session ? (
          <Link href="/organizations" className="btn btn-ghost text-lg lg:text-xl font-bold text-base-content">
            🔍 SEO Audit
          </Link>
        ) : (
          <Link href="/" className="btn btn-ghost text-lg lg:text-xl font-bold text-base-content">
            🔍 SEO Audit
          </Link>
        )}
      </div>

      <div className="flex-none gap-2">
        {session ? (
          <>
            {/* User Info - Hidden on mobile */}
            <div className="hidden md:flex flex-col items-end px-4">
              <p className="text-xs lg:text-sm font-medium text-base-content truncate max-w-24 lg:max-w-none">
                {session.user?.name || session.user?.email}
              </p>
              {currentOrganization && (
                <p className="text-xs text-base-content/70 truncate max-w-24 lg:max-w-none">
                  {currentOrganization}
                </p>
              )}
            </div>

            {/* Links - Hidden on small screens */}
            <div className="hidden sm:flex gap-2">
              <Link
                href="/organizations"
                className="btn btn-ghost btn-sm text-xs lg:text-sm"
              >
                {t('common.organizations')}
              </Link>
              <Link
                href={currentOrgId ? `/settings?org=${currentOrgId}` : '/settings'}
                className="btn btn-ghost btn-sm text-xs lg:text-sm"
              >
                {t('common.settings')}
              </Link>
            </div>

            {/* Sign Out */}
            <SignOutButton />
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="btn btn-ghost btn-sm text-xs lg:text-sm"
            >
              {t('auth.login')}
            </Link>
            <Link
              href="/register"
              className="btn btn-primary btn-sm text-xs lg:text-sm"
            >
              {t('auth.signUp')}
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
