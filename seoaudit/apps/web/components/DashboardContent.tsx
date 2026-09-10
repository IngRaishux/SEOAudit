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
      <div className="max-w-6xl mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">{org.name}</h1>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm mt-1">
              {membershipsCount} {t('common.organization')}
              {membershipsCount !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex gap-2">
            <SwitchOrgButton />
            <Link
              href={`/organization-settings/${selectedOrgId}`}
              className="px-4 py-2 bg-zinc-600 text-white rounded hover:bg-zinc-700 text-sm font-medium"
            >
              {t('common.settings')}
            </Link>
            <Link
              href={`/crawler?org=${selectedOrgId}`}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
            >
              {t('dashboard.crawlNewSite')}
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
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

        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-semibold">{t('dashboard.yourSites')}</h2>
          </div>

          {sites.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-zinc-600 dark:text-zinc-400 mb-4">
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
              <table className="w-full">
                <thead className="border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-white">
                      {t('sites.url')}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-white">
                      {t('sites.pages')}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-white">
                      {t('sites.status')}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-white">
                      {t('sites.created')}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-white">
                      {t('sites.actions')}
                    </th>
                    {isOwner && (
                      <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-white">
                        {t('sites.delete')}
                      </th>
                    )}
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
                          {t(
                            `sites.crawlStatus.${site.crawlStatus || 'pending'}`,
                            site.crawlStatus || 'pending'
                          )}
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
                          {t('sites.view')}
                        </Link>
                      </td>
                      {isOwner && (
                        <td className="px-6 py-4 text-sm">
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
