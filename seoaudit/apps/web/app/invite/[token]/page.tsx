import type { Metadata } from 'next';
import Link from 'next/link';
import { ObjectId } from 'mongodb';
import { RiErrorWarningLine, RiMailOpenLine, RiTimeLine } from '@remixicon/react';
import { getSessionUserId } from '@/lib/auth/sessionUser';
import { connectToDatabase } from '@/lib/db/mongo';
import { getInvitationPreview } from '@/lib/invitations/service';
import { normalizeEmail } from '@/lib/invitations/state';
import { getRequestLanguage, serverT } from '@/lib/i18n/server';
import { formatMessage } from '@/lib/i18n/format';
import { InviteResponse } from '@/components/invitations/InviteResponse';
import { InviteSignOutButton } from '@/components/invitations/InviteSignOutButton';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getRequestLanguage();
  // El token va en la URL: que no se filtre como referrer ni se indexe
  return { title: serverT(lang, 'team.acceptPage.title'), robots: { index: false }, referrer: 'no-referrer' };
}

async function sessionEmail(): Promise<string | null> {
  const userId = await getSessionUserId();
  if (!userId || !ObjectId.isValid(userId)) return null;
  const { db } = await connectToDatabase();
  const user = await db.collection('users').findOne({ _id: new ObjectId(userId) }, { projection: { email: 1 } });
  return (user?.email as string) ?? null;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-base-200 px-4 py-12">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body gap-4">{children}</div>
      </div>
    </main>
  );
}

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const lang = await getRequestLanguage();
  const tr = (key: string) => serverT(lang, `team.acceptPage.${key}`);
  const preview = await getInvitationPreview(token);

  if (preview.status !== 'pending') {
    const expired = preview.status === 'expired';
    const Icon = expired ? RiTimeLine : RiErrorWarningLine;
    return (
      <Shell>
        <Icon className="size-10 text-warning" aria-hidden="true" />
        <h1 className="card-title text-xl">{tr(expired ? 'expired' : 'invalid')}</h1>
        <div className="card-actions justify-end">
          <Link href="/organizations" className="btn btn-ghost">
            {tr('goToOrganizations')}
          </Link>
        </div>
      </Shell>
    );
  }

  const values = {
    inviter: preview.inviterName,
    org: preview.organizationName,
    email: preview.email,
    role: serverT(lang, `team.roles.${preview.role}`),
  };
  const currentEmail = await sessionEmail();
  const encoded = encodeURIComponent(token);

  if (!currentEmail) {
    return (
      <Shell>
        <RiMailOpenLine className="size-10 text-primary" aria-hidden="true" />
        <h1 className="card-title text-xl">{formatMessage(tr('signedOutTitle'), values)}</h1>
        <p className="text-base-content/70">{formatMessage(tr('signedOutHint'), values)}</p>
        <div className="card-actions flex-col sm:flex-row sm:justify-end">
          <Link href={`/register?invite=${encoded}`} className="btn btn-outline w-full sm:w-auto">
            {tr('register')}
          </Link>
          <Link href={`/login?invite=${encoded}`} className="btn btn-primary w-full sm:w-auto">
            {tr('login')}
          </Link>
        </div>
      </Shell>
    );
  }

  if (normalizeEmail(currentEmail) !== preview.email) {
    return (
      <Shell>
        <RiErrorWarningLine className="size-10 text-warning" aria-hidden="true" />
        <h1 className="card-title text-xl">{formatMessage(tr('wrongAccount'), values)}</h1>
        <p className="text-base-content/70">
          {formatMessage(tr('wrongAccountHint'), { ...values, current: currentEmail })}
        </p>
        <div className="card-actions justify-end">
          <InviteSignOutButton callbackUrl={`/login?invite=${encoded}`} label={tr('signOut')} />
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <RiMailOpenLine className="size-10 text-primary" aria-hidden="true" />
      <h1 className="card-title text-xl">{formatMessage(tr('question'), values)}</h1>
      <p className="text-base-content/70">{formatMessage(tr('roleOffered'), values)}</p>
      <InviteResponse token={token} />
    </Shell>
  );
}
