'use client';

import Link from 'next/link';
import { useI18n, useCurrentLanguage } from '@/lib/i18n/useI18n';
import { DeleteSiteDialog } from './DeleteSiteDialog';
import { SwitchOrgButton } from './SwitchOrgButton';

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
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="max-w-6xl mx-auto p-4 lg:p-8">
        <div className="flex flex-col lg:flex-row justify-between lg:items-center mb-8 gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl lg:text-4xl font-bold truncate">{org.name}</h1>
            <p className="text-zinc-600 dark:text-zinc-400 text-xs lg:text-sm mt-1">
              {membershipsCount} {t('common.organization')}
              {membershipsCount !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 lg:flex-nowrap">
            <SwitchOrgButton />
            <Link
              href={`/organization-settings/${selectedOrgId}`}
              className="flex-1 lg:flex-none px-3 lg:px-4 py-2 bg-zinc-600 text-white rounded hover:bg-zinc-700 text-xs lg:text-sm font-medium text-center lg:text-left whitespace-nowrap"
            >
              {t('common.settings')}
            </Link>
            <Link
              href={`/crawler?org=${selectedOrgId}`}
              className="flex-1 lg:flex-none px-3 lg:px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs lg:text-sm font-medium text-center lg:text-left whitespace-nowrap"
            >
              {t('dashboard.crawlNewSite')}
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-8">
          <div className="p-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-2">
              {t('dashboard.totalSites')}
            </p>
            <p className="text-3xl font-bold">{total}</p>
          </div>

          <div className="p-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-2">
              {t('dashboard.role')}
            </p>
            <p className="text-lg font-semibold capitalize">
              {t(`dashboard.${membership?.role || 'member'}`)}
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-2">
              {t('dashboard.yourEmail')}
            </p>
            <p className="text-sm truncate">{userEmail}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="p-3 lg:p-6 border-b border-zinc-200 dark:border-zinc-800">
            <h2 className="text-lg lg:text-xl font-semibold">{t('dashboard.yourSites')}</h2>
          </div>

          {sites.length === 0 ? (
            <div className="p-6 lg:p-8 text-center">
              <p className="text-zinc-600 dark:text-zinc-400 mb-4 text-sm">
                {t('dashboard.noSites')}
              </p>
              <Link
                href={`/crawler?org=${selectedOrgId}`}
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
              >
                {t('dashboard.goCrawler')}
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs lg:text-sm">
                <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800">
                  <tr>
                    <th className="px-2 lg:px-6 py-1.5 lg:py-3 text-left font-semibold text-zinc-900 dark:text-white">
                      {t('sites.url')}
                    </th>
                    <th className="px-2 lg:px-6 py-1.5 lg:py-3 text-left font-semibold text-zinc-900 dark:text-white text-center">
                      {t('sites.pages')}
                    </th>
                    <th className="px-2 lg:px-6 py-1.5 lg:py-3 text-left font-semibold text-zinc-900 dark:text-white">
                      {t('sites.status')}
                    </th>
                    <th className="px-2 lg:px-6 py-1.5 lg:py-3 text-left font-semibold text-zinc-900 dark:text-white">
                      {t('sites.created')}
                    </th>
                    <th className="px-2 lg:px-6 py-1.5 lg:py-3 text-left font-semibold text-zinc-900 dark:text-white">
                      {t('sites.actions')}
                    </th>
                    {isOwner && (
                      <th className="px-2 lg:px-6 py-1.5 lg:py-3 text-left font-semibold text-zinc-900 dark:text-white">
                        {t('sites.delete')}
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {sites.map((site: any) => (
                    <tr
                      key={site._id.toString()}
                      className="border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700/50 transition-colors"
                    >
                      <td className="px-2 lg:px-6 py-1.5 lg:py-4 text-zinc-900 dark:text-white truncate max-w-20 lg:max-w-xs">
                        {site.url}
                      </td>
                      <td className="px-2 lg:px-6 py-1.5 lg:py-4 text-zinc-600 dark:text-zinc-400 text-center">
                        {site.pageCount || 0}
                      </td>
                      <td className="px-2 lg:px-6 py-1.5 lg:py-4">
                        <span
                          className={`px-1.5 lg:px-2 py-0.5 rounded text-xs font-medium inline-block whitespace-nowrap ${
                            site.crawlStatus === 'completed'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : site.crawlStatus === 'failed'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          }`}
                        >
                          {t(
                            `sites.crawlStatus.${site.crawlStatus || 'pending'}`,
                            site.crawlStatus || 'pending'
                          )}
                        </span>
                      </td>
                      <td className="px-2 lg:px-6 py-1.5 lg:py-4 text-zinc-600 dark:text-zinc-400 whitespace-nowrap text-xs lg:text-base">
                        {new Date(site.createdAt).toISOString().split('T')[0]}
                      </td>
                      <td className="px-2 lg:px-6 py-1.5 lg:py-4">
                        <Link
                          href={`/sites/${site._id.toString()}`}
                          className="text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap text-xs lg:text-base"
                        >
                          {t('sites.view')}
                        </Link>
                      </td>
                      {isOwner && (
                        <td className="px-2 lg:px-6 py-1.5 lg:py-4">
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
        </div>
      </div>
    </div>
  );
}
