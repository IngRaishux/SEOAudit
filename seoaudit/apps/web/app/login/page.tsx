import type { Metadata } from 'next';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { LoginForm } from '@/components/LoginForm';
import { getRequestLanguage, getServerTranslations } from '@/lib/i18n/server';
import { resolveInviteParam } from '@/lib/invitations/inviteParam';

export async function generateMetadata(): Promise<Metadata> {
  const { auth } = getServerTranslations(await getRequestLanguage());
  return { title: auth.loginTitle, description: auth.loginSubtitle };
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const lang = await getRequestLanguage();
  const invite = await resolveInviteParam((await searchParams).invite);
  const { auth } = getServerTranslations(lang);

  return (
    <AuthLayout lang={lang} title={auth.loginTitle} subtitle={auth.loginSubtitle}>
      <LoginForm invite={invite} />
    </AuthLayout>
  );
}
