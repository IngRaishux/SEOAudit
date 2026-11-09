import type { Metadata } from 'next';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { LoginForm } from '@/components/LoginForm';
import { getRequestLanguage, getServerTranslations } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const { auth } = getServerTranslations(await getRequestLanguage());
  return { title: `${auth.loginTitle} · SEO Audit`, description: auth.loginSubtitle };
}

export default async function LoginPage() {
  const lang = await getRequestLanguage();
  const { auth } = getServerTranslations(lang);

  return (
    <AuthLayout lang={lang} title={auth.loginTitle} subtitle={auth.loginSubtitle}>
      <LoginForm />
    </AuthLayout>
  );
}
