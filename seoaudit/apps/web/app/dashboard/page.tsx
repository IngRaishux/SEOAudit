import { getServerSession } from 'next-auth/next';
import { handler } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { Session } from 'next-auth';
import * as siteRepository from '@/lib/repositories/siteRepository';
import connectMongoose from '@/lib/db/mongoose';
import { connectToDatabase } from '@/lib/db/mongo';
import Membership from '@/lib/models/Membership';
import Organization from '@/lib/models/Organization';
import { getSelectedOrganization } from '@/app/actions';
import { SwitchOrgButton } from '@/components/SwitchOrgButton';

interface ISite {
  _id: string;
  url: string;
  organizationId: string;
  title?: string;
  pageCount: number;
  crawlStatus: string;
  createdAt: Date;
  updatedAt: Date;
}

export default async function DashboardPage(props: {
  searchParams: Promise<{ org?: string }>;
}) {
  const searchParams = await props.searchParams;
  const selectedOrgId = searchParams.org;

  let session = (await getServerSession(handler)) as Session | null;

  if (!session?.user?.email) {
    redirect('/login');
  }

  // Get user ID
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

  // Get all organizations for this user
  const memberships = await Membership.find({ userId: session.user.id }).lean();

  if (memberships.length === 0) {
    // No organizations, redirect to create one
    redirect('/organizations');
  }

  // Determine which organization to display
  // Priority: URL param > cookie > redirect
  let accountId: string;

  // 1. Try URL parameter first (explicit choice)
  let resolvedOrgId = selectedOrgId;

  // 2. If not in URL, try cookie (remembered choice)
  if (!resolvedOrgId) {
    const cookieOrgId = await getSelectedOrganization();
    if (cookieOrgId && memberships.some((m) => m.organizationId.toString() === cookieOrgId)) {
      // Cookie is valid, redirect to dashboard with this org
      redirect(`/dashboard?org=${cookieOrgId}`);
    }
  }

  // 3. If still no valid org, redirect to selection
  if (!resolvedOrgId) {
    redirect('/organizations');
  }

  // Validate that user is member of selected org
  const isMember = memberships.some(
    (m) => m.organizationId.toString() === resolvedOrgId
  );
  if (!isMember) {
    redirect('/organizations');
  }

  accountId = resolvedOrgId;

  // Get organization details
  const org = (await Organization.findById(accountId).lean()) as any;
  if (!org) {
    redirect('/organizations');
  }

  // Get membership for this org to check role
  const membership = (await Membership.findOne({
    userId: session.user.id,
    organizationId: accountId,
  }).lean()) as any;

  let sites: ISite[] = [];
  let total = 0;

  try {
    sites = (await siteRepository.listSitesByAccount(accountId, {
      limit: 20,
      skip: 0,
    })) as unknown as ISite[];
    total = await siteRepository.countSitesByAccount(accountId);
  } catch (error) {
    console.error('Error fetching sites:', error);
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="max-w-6xl mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">{org.name}</h1>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm mt-1">
              {memberships.length} organization{memberships.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex gap-2">
            <SwitchOrgButton />
            <Link
              href={`/crawler?org=${selectedOrgId}`}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
            >
              Crawl New Site
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="p-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-2">Total Sites</p>
            <p className="text-3xl font-bold">{total}</p>
          </div>

          <div className="p-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-2">Role</p>
            <p className="text-lg font-semibold capitalize">{membership?.role || 'Member'}</p>
          </div>

          <div className="p-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-2">Your Email</p>
            <p className="text-sm truncate">{session.user.email}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-semibold">Your Sites</h2>
          </div>

          {sites.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                No sites yet. Start by crawling a website.
              </p>
              <Link
                href={`/crawler?org=${selectedOrgId}`}
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
              >
                Go to crawler →
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-white">
                      URL
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-white">
                      Pages
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-white">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-white">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-white">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sites.map((site: any) => (
                    <tr
                      key={site._id.toString()}
                      className="border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    >
                      <td className="px-6 py-4 text-sm text-zinc-900 dark:text-white truncate max-w-xs">
                        {site.url}
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                        {site.pageCount || 0}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            site.crawlStatus === 'completed'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : site.crawlStatus === 'failed'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          }`}
                        >
                          {site.crawlStatus || 'pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                        {new Date(site.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Link
                          href={`/sites/${site._id.toString()}`}
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
