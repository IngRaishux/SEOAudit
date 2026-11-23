import type { Metadata } from 'next';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { RegisterForm } from '@/components/RegisterForm';
import { getRequestLanguage, getServerTranslations } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const { auth } = getServerTranslations(await getRequestLanguage());
  return { title: `${auth.registerTitle} · SEO Audit`, description: auth.registerSubtitle };
}

export default async function RegisterPage() {
  const lang = await getRequestLanguage();
  const { auth } = getServerTranslations(lang);

  return (
    <AuthLayout lang={lang} title={auth.registerTitle} subtitle={auth.registerSubtitle}>
      <RegisterForm />
    </AuthLayout>
  );
}
