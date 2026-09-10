import { getServerSession } from 'next-auth/next';
import { handler } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import type { Session } from 'next-auth';
import connectMongoose from '@/lib/db/mongoose';
import { connectToDatabase } from '@/lib/db/mongo';
import Membership from '@/lib/models/Membership';
import Site from '@/lib/models/Site';
import * as siteRepository from '@/lib/repositories/siteRepository';
import Link from 'next/link';

interface ISite {
  _id: string;
  url: string;
  organizationId: string;
  title?: string;
  pageCount: number;
}

export default async function SitesSettingsPage(props: {
  searchParams: Promise<{ org?: string }>;
}) {
  const searchParams = await props.searchParams;
  const selectedOrgId = searchParams.org;

  let session = (await getServerSession(handler)) as Session | null;

  if (!session?.user?.email) {
    redirect('/login');
  }

  if (!session.user.id) {
    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ email: session.user.email });
    if (!user) {
      redirect('/login');
    }
    session.user.id = user._id.toString();
  }

  await connectMongoose();

  const memberships = await Membership.find({ userId: session.user.id }).lean();

  if (memberships.length === 0) {
    redirect('/organizations');
  }

  let accountId: string;

  if (!selectedOrgId) {
    accountId = memberships[0].organizationId.toString();
  } else {
    const isMember = memberships.some(
      (m) => m.organizationId.toString() === selectedOrgId
    );
    if (!isMember) {
      redirect('/settings/sites');
    }
    accountId = selectedOrgId;
  }

  // Get sites for this organization
  const sites = (await siteRepository.listSitesByAccount(accountId, {
    limit: 100,
    skip: 0,
  })) as unknown as ISite[];

  return (
    <div className="space-y-6">
      {/* Organization Selector */}
      {memberships.length > 1 && (
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="p-6">
            <label className="block text-sm font-medium text-zinc-900 dark:text-white mb-2">
              Filter by Organization
            </label>
            <select
              defaultValue={accountId}
              onChange={(e) => {
                window.location.href = `/settings/sites?org=${e.target.value}`;
              }}
              className="px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white w-full"
            >
              {memberships.map((m) => (
                <option key={m._id} value={(m.organizationId as any).toString()}>
                  {(m.organizationId as any).toString()}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Sites List */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-semibold">Sites</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Click on a site to manage its specific settings
          </p>
        </div>

        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {sites.length === 0 ? (
            <div className="p-6 text-center text-zinc-600 dark:text-zinc-400">
              <p>No sites yet. Create one by crawling a website.</p>
            </div>
          ) : (
            sites.map((site) => (
              <Link
                key={site._id}
                href={`/settings/site/${site._id}?org=${accountId}`}
                className="block p-6 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-zinc-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      {site.title || site.url}
                    </h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 font-mono">
                      {site.url}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-2">
                      {site.pageCount} pages
                    </p>
                  </div>
                  <div className="text-blue-600 dark:text-blue-400 font-medium">
                    Edit →
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
