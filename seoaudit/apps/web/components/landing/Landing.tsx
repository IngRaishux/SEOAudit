import { getServerSession } from 'next-auth/next';
import { headers } from 'next/headers';
import type { Session } from 'next-auth';
import { handler } from '@/lib/auth/auth';
import { getServerTranslations } from '@/lib/i18n/server';
import type { Language } from '@/lib/i18n/ui';
import { Faq } from './Faq';
import { FinalCta } from './FinalCta';
import { Footer } from './Footer';
import { Hero } from './Hero';
import { HowItWorks } from './HowItWorks';
import { LanguageAlert } from './LanguageAlert';
import { LanguageSync } from './LanguageSync';
import { Stats } from './Stats';
import { Tools } from './Tools';
import { UseCases } from './UseCases';

/** Landing pública, renderizada en el servidor; `/` y `/en` solo cambian `lang`. */
export async function Landing({ lang }: { lang: Language }) {
  // Sesión resuelta en el servidor: evita el parpadeo de los CTA mientras carga useSession
  const session = (await getServerSession(handler)) as Session | null;
  const isAuthenticated = Boolean(session?.user);
  const acceptLanguage = (await headers()).get('accept-language');
  const texts = getServerTranslations(lang).home;
  const section = { texts, lang };

  return (
    <main className="bg-base-100">
      <LanguageSync lang={lang} />
      <LanguageAlert lang={lang} acceptLanguage={acceptLanguage} />
      <Hero {...section} isAuthenticated={isAuthenticated} />
      <Stats {...section} />
      <HowItWorks {...section} />
      <Tools {...section} />
      <UseCases {...section} />
      <Faq {...section} />
      <FinalCta {...section} isAuthenticated={isAuthenticated} />
      <Footer {...section} />
    </main>
  );
}
