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
import { SiteDetailsTabs } from '@/components/SiteDetailsTabs';
import { Card } from '@/components/Card';

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

interface IPage {
  _id: string;
  siteId: string;
  url: string;
  organizationId: string;
  title?: string;
  statusCode?: number;
  canonical?: string;
  headings: string[];
  metaTags: Array<{ name: string; content: string }>;
  createdAt: Date;
  description?: string;
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

  // Resolve user ID from session or email
  if (!session.user.id) {
    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ email: session.user.email });
    if (!user) {
      redirect('/login');
    }
    session.user.id = user._id.toString();
  }

  // Get site first to determine organization
  let site: ISite | null = null;
  try {
    site = (await siteRepository.getSiteById(siteId)) as unknown as ISite;
  } catch (error) {
    console.error('Error fetching site:', error);
  }

  if (!site) {
    notFound();
  }

  // Validate that user is member of the site's organization
  await connectMongoose();
  const membership = await Membership.findOne({
    userId: session.user.id,
    organizationId: site.organizationId,
  });

  if (!membership) {
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

  // Serialize pages data for client component
  const serializedPages = JSON.parse(JSON.stringify(pages));

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="max-w-6xl mx-auto p-4 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/dashboard?org=${site.organizationId}`} className="text-blue-600 hover:text-blue-700 text-sm mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl lg:text-4xl font-bold mb-2 break-all">{site.url}</h1>
          <p className="text-xs lg:text-sm text-zinc-600 dark:text-zinc-400">
            Crawled on {new Date(site.createdAt).toLocaleDateString()}{' '}
            {new Date(site.createdAt).toLocaleTimeString()}
          </p>
        </div>

        {/* Site Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4 mb-8">
          <Card className="p-3 lg:p-4">
            <p className="text-xs lg:text-sm text-base-content/70 mb-2">Total Pages</p>
            <p className="text-2xl lg:text-3xl font-bold">{site.pageCount || pages.length}</p>
          </Card>

          <Card className="p-3 lg:p-4">
            <p className="text-xs lg:text-sm text-base-content/70 mb-2">Status</p>
            <span
              className={`badge ${
                site.crawlStatus === 'completed'
                  ? 'badge-success'
                  : site.crawlStatus === 'failed'
                    ? 'badge-error'
                    : 'badge-warning'
              }`}
            >
              {site.crawlStatus || 'pending'}
            </span>
          </Card>

          {site.title && (
            <Card className="p-3 lg:p-4 md:col-span-2 lg:col-span-2">
              <p className="text-xs lg:text-sm text-base-content/70 mb-2">Page Title</p>
              <p className="text-xs lg:text-sm truncate">{site.title}</p>
            </Card>
          )}
        </div>

        {/* Tabs Section */}
        <SiteDetailsTabs
          pages={serializedPages}
          siteUrl={site.url}
          siteId={siteId}
          organizationId={site.organizationId}
        />
      </div>
    </div>
  );
}
