'use client';

import Link from 'next/link';
import { useI18n, useCurrentLanguage } from '@/lib/i18n/useI18n';
import { DeleteSiteDialog } from './DeleteSiteDialog';
import { SwitchOrgButton } from './SwitchOrgButton';
import { Card, CardHeader, CardTitle, CardContent } from './Card';
import { Button } from '@seo-optimizer/ui';
import { RiSettings4Line, RiSearch2Line, RiEyeLine } from '@remixicon/react';

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

interface DashboardContentProps {
  org: {
    name: string;
    _id: string;
  };
  membership: {
    role: 'owner' | 'admin' | 'member';
  };
  sites: ISite[];
  total: number;
  userEmail: string;
  selectedOrgId: string;
  membershipsCount: number;
}

export function DashboardContent({
  org,
  membership,
  sites,
  total,
  userEmail,
  selectedOrgId,
  membershipsCount,
}: DashboardContentProps) {
  const lang = useCurrentLanguage();
  const { t } = useI18n(lang);
  const isOwner = membership?.role === 'owner';

  return (
    <div className="min-h-screen bg-base-100">
      <div className="max-w-6xl mx-auto p-4 lg:p-8">
        <div className="flex flex-col lg:flex-row justify-between lg:items-center mb-8 gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl lg:text-4xl font-bold truncate">{org.name}</h1>
            <p className="text-base-content/70 text-xs lg:text-sm mt-1">
              {membershipsCount} {t('common.organization')}
              {membershipsCount !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 lg:flex-nowrap">
            <SwitchOrgButton />
            <Button
              asChild
              variant="secondary"
              size="sm"
              icon={<RiSettings4Line className="size-4" />}
            >
              <Link href={`/organization-settings/${selectedOrgId}`}>
                {t('common.settings')}
              </Link>
            </Button>
            <Button
              asChild
              variant="primary"
              size="sm"
              icon={<RiSearch2Line className="size-4" />}
            >
              <Link href={`/crawler?org=${selectedOrgId}`}>
                {t('dashboard.crawlNewSite')}
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-base-content/70 text-sm mb-2">
                {t('dashboard.totalSites')}
              </p>
              <p className="text-3xl font-bold text-base-content">{total}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-base-content/70 text-sm mb-2">
                {t('dashboard.role')}
              </p>
              <p className="text-lg font-semibold capitalize text-base-content">
                {t(`dashboard.${membership?.role || 'member'}`)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-base-content/70 text-sm mb-2">
                {t('dashboard.yourEmail')}
              </p>
              <p className="text-sm truncate text-base-content">{userEmail}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.yourSites')}</CardTitle>
          </CardHeader>
          <CardContent>
            {sites.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-base-content/70 mb-4 text-sm">
                  {t('dashboard.noSites')}
                </p>
                <Button
                  asChild
                  variant="primary"
                  size="sm"
                  icon={<RiSearch2Line className="size-4" />}
                >
                  <Link href={`/crawler?org=${selectedOrgId}`}>
                    {t('dashboard.goCrawler')}
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table w-full text-xs lg:text-sm">
                  <thead className="bg-base-200">
                    <tr>
                      <th className="text-base-content">
                        {t('sites.url')}
                      </th>
                      <th className="text-base-content text-center">
                        {t('sites.pages')}
                      </th>
                      <th className="text-base-content">
                        {t('sites.status')}
                      </th>
                      <th className="text-base-content">
                        {t('sites.created')}
                      </th>
                      <th className="text-base-content">
                        {t('sites.actions')}
                      </th>
                      {isOwner && (
                       <th className="text-base-content">
                            {t('sites.delete')}
                          </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {sites.map((site: any) => (
                      <tr key={site._id.toString()} className="hover">
                        <td className="text-base-content truncate max-w-20 lg:max-w-xs">
                          {site.url}
                        </td>
                        <td className="text-base-content/70 text-center">
                          {site.pageCount || 0}
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              site.crawlStatus === 'completed'
                                ? 'badge-success'
                                : site.crawlStatus === 'failed'
                                  ? 'badge-error'
                                  : 'badge-warning'
                            }`}
                          >
                            {t(
                              `sites.crawlStatus.${site.crawlStatus || 'pending'}`,
                              site.crawlStatus || 'pending'
                            )}
                          </span>
                        </td>
                        <td className="text-base-content/70 whitespace-nowrap text-xs lg:text-base">
                          {new Date(site.createdAt).toISOString().split('T')[0]}
                        </td>
                        <td>
                          <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            icon={<RiEyeLine className="size-4" />}
                            className="text-primary hover:text-primary/80"
                          >
                            <Link href={`/sites/${site._id.toString()}`}>
                              {t('sites.view')}
                            </Link>
                          </Button>
                        </td>
                        {isOwner && (
                          <td> 
                            <DeleteSiteDialog
                              siteId={site._id.toString()}
                              siteUrl={site.url.toString()}
                              orgId={org._id}
                            />
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
