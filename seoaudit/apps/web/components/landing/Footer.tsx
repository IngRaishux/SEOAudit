import Link from 'next/link';
import { RiSearchLine } from '@remixicon/react';
import type { SectionProps } from './types';

export function Footer({ texts }: SectionProps) {
  const { footer, hero } = texts;

  return (
    <footer className="footer p-10 bg-neutral text-neutral-content">
      <aside>
        <p className="flex items-center gap-2 text-xl font-bold">
          <RiSearchLine className="size-6" aria-hidden="true" />
          SEO Audit
        </p>
        <p className="max-w-xs opacity-80">{footer.tagline}</p>
      </aside>
      <nav>
        <h6 className="footer-title">{footer.product}</h6>
        <a href="#tools" className="link link-hover">{footer.tools}</a>
        <a href="#how-it-works" className="link link-hover">{footer.howItWorks}</a>
        <a href="#faq" className="link link-hover">{footer.faq}</a>
      </nav>
      <nav>
        <h6 className="footer-title">{footer.account}</h6>
        <Link href="/register" className="link link-hover">{hero.ctaPrimaryGuest}</Link>
        <Link href="/login" className="link link-hover">{hero.ctaSecondaryGuest}</Link>
      </nav>
    </footer>
  );
}
