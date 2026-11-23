import type { Metadata } from 'next';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { RegisterForm } from '@/components/RegisterForm';
import { getRequestLanguage, getServerTranslations } from '@/lib/i18n/server';
import { resolveInviteParam } from '@/lib/invitations/inviteParam';

export async function generateMetadata(): Promise<Metadata> {
  const { auth } = getServerTranslations(await getRequestLanguage());
  return { title: `${auth.registerTitle} · SEO Audit`, description: auth.registerSubtitle };
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const lang = await getRequestLanguage();
  const invite = await resolveInviteParam((await searchParams).invite);
  const { auth } = getServerTranslations(lang);

  return (
    <AuthLayout lang={lang} title={auth.registerTitle} subtitle={auth.registerSubtitle}>
      <RegisterForm invite={invite} />
    </AuthLayout>
  );
}
