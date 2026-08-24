'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { SignOutButton } from '@/components/SignOutButton';

interface HeaderProps {
  currentOrganization?: string;
}

export function Header({ currentOrganization }: HeaderProps) {
  const { data: session } = useSession();

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      <div className="flex justify-between items-center px-8 py-4">
        <Link href="/" className="text-xl font-bold text-zinc-900 dark:text-white">
          SEO Audit
        </Link>

        <div className="flex items-center gap-6">
          {session ? (
            <>
              <div className="flex flex-col items-end">
                <p className="text-sm font-medium text-zinc-900 dark:text-white">
                  {session.user?.name || session.user?.email}
                </p>
                {currentOrganization && (
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    {currentOrganization}
                  </p>
                )}
              </div>
              <Link
                href="/organizations"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Organizations
              </Link>
              <Link
                href="/settings"
                className="text-sm text-zinc-600 hover:text-zinc-700 font-medium"
              >
                Settings
              </Link>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="text-sm px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
