import Link from 'next/link';
import { RiArrowRightLine } from '@remixicon/react';
import type { HomeTexts } from './types';

interface CtaButtonsProps {
  texts: HomeTexts['hero'];
  isAuthenticated: boolean;
  /** En fondos de color primario el botón secundario necesita contraste propio. */
  onPrimary?: boolean;
}

export function CtaButtons({ texts, isAuthenticated, onPrimary = false }: CtaButtonsProps) {
  const primary = isAuthenticated
    ? { href: '/crawler', label: texts.ctaPrimaryUser }
    : { href: '/register', label: texts.ctaPrimaryGuest };
  const secondary = isAuthenticated
    ? { href: '/dashboard', label: texts.ctaSecondaryUser }
    : { href: '/login', label: texts.ctaSecondaryGuest };

  return (
    <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
      <Link href={primary.href} className={`btn btn-lg ${onPrimary ? 'btn-neutral landing-cta-neutral' : 'btn-primary landing-cta-primary'}`}>
        {primary.label}
        <RiArrowRightLine className="size-5" aria-hidden="true" />
      </Link>
      <Link
        href={secondary.href}
        className={`btn btn-lg ${onPrimary ? 'btn-ghost border-current landing-cta-ghost' : 'btn-outline landing-cta-outline'}`}
      >
        {secondary.label}
      </Link>
    </div>
  );
}
