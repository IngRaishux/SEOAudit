'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SignOutButton } from '@/components/SignOutButton';
import { useI18n, useCurrentLanguage } from '@/lib/i18n/useI18n';
import { landingLanguageForPath, landingPath } from '@/lib/i18n/language';
import type { Language } from '@/lib/i18n/ui';
import { RiSearchLine } from '@remixicon/react';

const LANDING_LANGUAGES: Language[] = ['es', 'en'];

/** Enlaces <a> nativos: cambiar de idioma exige recargar el root layout (lang y provider). */
function LandingLanguageSwitcher({ current, label }: { current: Language; label: string }) {
  return (
    <nav aria-label={label} className="join">
      {LANDING_LANGUAGES.map((lang) => (
        <a
          key={lang}
          href={landingPath(lang)}
          hrefLang={lang}
          lang={lang}
          aria-current={lang === current ? 'page' : undefined}
          className={`join-item btn btn-xs sm:btn-sm ${lang === current ? 'btn-active btn-neutral' : 'btn-ghost'}`}
        >
          {lang.toUpperCase()}
        </a>
      ))}
    </nav>
  );
}

interface HeaderProps {
  currentOrganization?: string;
  currentOrgId?: string;
}

export function Header({ currentOrganization, currentOrgId }: HeaderProps) {
  const { data: session } = useSession();
  const lang = useCurrentLanguage();
  const { t } = useI18n(lang);
  const landingLanguage = landingLanguageForPath(usePathname() ?? '');

  return (
    <header className="navbar bg-base-100 border-b border-base-300 sticky top-0 z-40">
      <div className="flex-1">
        {session ? (
          <Link href="/organizations" className="btn btn-ghost text-lg lg:text-xl font-bold text-base-content flex items-center gap-2">
            <RiSearchLine className="text-xl" />
            SEO Audit
          </Link>
        ) : (
          // <a> nativo: vuelve a la landing del idioma actual recargando el layout
          <a href={landingPath(lang)} className="btn btn-ghost px-2 sm:px-4 text-lg lg:text-xl font-bold text-base-content flex items-center gap-2">
            <RiSearchLine className="text-xl" />
            SEO Audit
          </a>
        )}
      </div>

      <div className="flex-none gap-1 sm:gap-2">
        {landingLanguage && (
          <LandingLanguageSwitcher current={landingLanguage} label={t('home.languageSwitcher.label')} />
        )}
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
