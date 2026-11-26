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
import { isOrgRole } from '@/lib/auth/permissions';
import { SiteDetailsTabs } from '@/components/SiteDetailsTabs';
import { Card } from '@/components/Card';
import type { ISite, IPage } from '@/lib/interfaces';
import { getRequestLanguage, serverT } from '@/lib/i18n/server';
import { formatMessage } from '@/lib/i18n/format';
import { SITE_PAGE_LIMIT } from '@/lib/limits';

export default async function SiteDetailsPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = await params;
  const session = (await getServerSession(handler)) as Session | null;

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
    // .lean() devuelve ObjectId y Date de Mongo; se convierten a JSON plano para poder pasarlos a un Client Component
    const found = await siteRepository.getSiteById(siteId);
    site = found ? (JSON.parse(JSON.stringify(found)) as ISite) : null;
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
      limit: SITE_PAGE_LIMIT,
    })) as unknown as IPage[];
  } catch (error) {
    console.error('Error fetching pages:', error);
  }


  // Total de URLs del sitio para el aviso de tope: el del sitemap si el crawl lo registró; en
  // sitios anteriores al tope, las páginas guardadas (pueden pasar del tope)
  let siteTotal = site.sitemapTotal;
  if (siteTotal === undefined) {
    try {
      siteTotal = await pageRepository.countPagesBySite(siteId);
    } catch (error) {
      console.error('Error counting pages:', error);
    }
  }
  const showPageLimitNotice = siteTotal !== undefined && siteTotal > SITE_PAGE_LIMIT;
  const language = await getRequestLanguage();

  // Serialize pages data for client component
  const serializedPages = JSON.parse(JSON.stringify(pages));  
  return (
    <div className="min-h-screen bg-base-200 text-base-content">
      <div className="max-w-6xl mx-auto p-4 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/dashboard?org=${site.organizationId}`} className="link link-hover text-sm text-base-content/70 hover:text-base-content mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl lg:text-4xl font-bold mb-2 break-all">{site.url}</h1>
          <p className="text-xs lg:text-sm text-base-content/70">
            Crawled on {new Date(site.createdAt).toLocaleDateString()}{' '}
            {new Date(site.createdAt).toLocaleTimeString()}
          </p>
        </div>

        {showPageLimitNotice && (
          <div role="status" className="alert alert-info mb-6 text-sm">
            <span>
              {formatMessage(serverT(language, 'sites.pageLimitNotice'), {
                shown: pages.length,
                total: siteTotal ?? pages.length,
                limit: SITE_PAGE_LIMIT,
              })}
            </span>
          </div>
        )}

        {site.crawlTruncated && (
          <div role="status" className="alert alert-warning mb-6 text-sm">
            <span>
              {formatMessage(serverT(language, 'sites.partialNotice'), {
                crawled: site.pageCount,
                total: site.sitemapUrlCount ?? site.pageCount,
              })}
            </span>
          </div>
        )}

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
          site={site}
          siteUrl={site.url}
          siteId={siteId}
          organizationId={site.organizationId}
          role={isOrgRole(membership.role) ? membership.role : 'viewer'}
        />
      </div>
    </div>
  );
}
