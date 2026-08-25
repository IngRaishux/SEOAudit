import { getServerSession } from 'next-auth/next';
import { handler } from '@/lib/auth/auth';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import type { Session } from 'next-auth';
import * as siteRepository from '@/lib/repositories/siteRepository';
import * as pageRepository from '@/lib/repositories/pageRepository';
import connectMongoose from '@/lib/db/mongoose';
import { connectToDatabase } from '@/lib/db/mongo';
import Membership from '@/lib/models/Membership';
import Organization from '@/lib/models/Organization';

interface ISite {
  _id: string;
  url: string;
  accountId: string;
  title?: string;
  pageCount: number;
  crawlStatus: string;
  createdAt: Date;
  updatedAt: Date;
}

interface IPage {
  _id: string;
  siteId: string;
  url: string;
  accountId: string;
  title?: string;
  statusCode?: number;
  canonical?: string;
  headings: string[];
  metaTags: Array<{ name: string; content: string }>;
  createdAt: Date;
}

export default async function SiteDetailsPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = await params;
  let session = (await getServerSession(handler)) as Session | null;

  if (!session?.user?.email) {
    redirect('/login');
  }

  // If accountId is not in session, resolve it from database using email
  if (!session.user.accountId) {
    try {
      const { db } = await connectToDatabase();
      const usersCollection = db.collection('users');

      // Find user by email
      const user = await usersCollection.findOne({ email: session.user.email });

      if (!user) {
        redirect('/login');
      }

      await connectMongoose();
      const membership = await Membership.findOne({ userId: user._id.toString() });

      if (membership) {
        const org = await Organization.findById(membership.organizationId);
        session.user.id = user._id.toString();
        session.user.accountId = membership.organizationId.toString();
        session.user.organizationName = org?.name || 'Organization';
        session.user.role = membership.role as any;
      } else {
        redirect('/login');
      }
    } catch (error) {
      console.error('Error resolving accountId:', error);
      redirect('/login');
    }
  }

  if (!session.user.accountId) {
    redirect('/login');
  }

  // Obtener sitio
  let site: ISite | null = null;
  try {
    site = (await siteRepository.getSiteById(siteId)) as unknown as ISite;
  } catch (error) {
    console.error('Error fetching site:', error);
  }

  if (!site) {
    notFound();
  }

  // Validar que el site pertenece al usuario
  if (site.accountId !== session.user.accountId) {
    notFound();
  }

  // Obtener páginas del sitio
  let pages: IPage[] = [];
  try {
    pages = (await pageRepository.listPagesBySite(siteId, {
      limit: 100,
    })) as unknown as IPage[];
  } catch (error) {
    console.error('Error fetching pages:', error);
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="max-w-6xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 text-sm mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold mb-2 break-all">{site.url}</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Crawled on {new Date(site.createdAt).toLocaleDateString()}{' '}
            {new Date(site.createdAt).toLocaleTimeString()}
          </p>
        </div>

        {/* Site Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="p-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-2">Total Pages</p>
            <p className="text-3xl font-bold">{site.pageCount || pages.length}</p>
          </div>

          <div className="p-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-2">Status</p>
            <span
              className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                site.crawlStatus === 'completed'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : site.crawlStatus === 'failed'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
              }`}
            >
              {site.crawlStatus || 'pending'}
            </span>
          </div>

          {site.title && (
            <div className="p-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 md:col-span-2">
              <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-2">Page Title</p>
              <p className="text-sm truncate">{site.title}</p>
            </div>
          )}
        </div>

        {/* Pages List */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-semibold">Pages ({pages.length})</h2>
          </div>

          {pages.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-zinc-600 dark:text-zinc-400">No pages crawled yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-white">
                      URL
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-white">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-white">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-white">
                      Headings
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-white">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pages.map((page) => (
                    <tr
                      key={page._id}
                      className="border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    >
                      <td className="px-6 py-4 text-sm text-blue-600 hover:text-blue-700 truncate max-w-xs">
                        <a
                          href={page.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {page.url}
                        </a>
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-900 dark:text-white truncate max-w-xs">
                        {page.title || '—'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            page.statusCode === 200
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : page.statusCode && page.statusCode >= 400
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                          }`}
                        >
                          {page.statusCode || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                        {page.headings.length > 0 ? (
                          <span title={page.headings.join(', ')}>
                            {page.headings.length} heading{page.headings.length !== 1 ? 's' : ''}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Link
                          href={`/sugerence?url=${encodeURIComponent(page.url)}&pageId=${page._id}&siteId=${siteId}`}
                          className="text-amber-600 hover:text-amber-700 font-medium"
                        >
                          SEO →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Meta Tags */}
        {pages.length > 0 && pages[0].metaTags && pages[0].metaTags.length > 0 && (
          <div className="mt-8 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-xl font-semibold">Home Page Meta Tags</h2>
            </div>
            <div className="p-6">
              <div className="space-y-2">
                {pages[0].metaTags.map((tag, idx) => (
                  <div key={idx} className="text-sm">
                    <span className="font-medium text-zinc-900 dark:text-white">{tag.name}:</span>
                    <span className="text-zinc-600 dark:text-zinc-400 ml-2 break-all">{tag.content}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
