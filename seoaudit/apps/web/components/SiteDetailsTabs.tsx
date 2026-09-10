'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useI18n, useCurrentLanguage } from '@/lib/i18n/useI18n';
import { SERPPreview } from './SERPPreview';

interface MetaTag {
  name: string;
  content: string;
}

interface Page {
  _id: string;
  url: string;
  title?: string;
  statusCode?: number;
  headings: string[];
  metaTags: MetaTag[];
  description?: string
}

interface SiteDetailsTabsProps {
  pages: Page[];
  siteUrl: string;
  siteId: string;
  organizationId: string;
}

type TabType = 'serp' | 'pages' | 'meta';

export function SiteDetailsTabs({
  pages,
  siteUrl,
  siteId,
  organizationId,
}: SiteDetailsTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('serp');
  const lang = useCurrentLanguage();
  const { t } = useI18n(lang);

  const tabs = [
    { id: 'serp', label: t('siteDetails.tabs.serp'), icon: '🔍' },
    { id: 'pages', label: `${t('siteDetails.tabs.pages')} (${pages.length})`, icon: '📄' },
    { id: 'meta', label: t('siteDetails.tabs.meta'), icon: '🏷️' },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Tabs Navigation */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <div className="flex flex-wrap border-b border-zinc-200 dark:border-zinc-800">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex-1 md:flex-none px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* SERP Preview Tab */}
          {activeTab === 'serp' && (
            <div className="space-y-4">
              {pages.length > 0 && pages[0].title ? (
                <SERPPreview
                  title={pages[0].title || 'Sin título'}
                  description={pages[0].description || 'Sin descripción'}
                  url={siteUrl}
                />
              ) : (
                <div className="p-8 text-center">
                  <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                    {t('serpPreview.noDatabMessage')}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Pages Tab */}
          {activeTab === 'pages' && (
            <div>
              {pages.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-zinc-600 dark:text-zinc-400">{t('siteDetails.noPagesMessage')}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800">
                      <tr>
                        <th className="px-6 py-3 text-left font-semibold text-zinc-900 dark:text-white">
                          {t('common.url')}
                        </th>
                        <th className="px-6 py-3 text-left font-semibold text-zinc-900 dark:text-white">
                          {t('siteDetails.pageTitle')}
                        </th>
                        <th className="px-6 py-3 text-left font-semibold text-zinc-900 dark:text-white">
                          {t('common.status')}
                        </th>
                        <th className="px-6 py-3 text-left font-semibold text-zinc-900 dark:text-white">
                          {t('pages.headings')}
                        </th>
                        <th className="px-6 py-3 text-left font-semibold text-zinc-900 dark:text-white">
                          {t('sites.actions')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pages.map((page) => (
                        <tr
                          key={page._id}
                          className="border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                        >
                          <td className="px-6 py-4 text-blue-600 hover:text-blue-700 truncate max-w-xs">
                            <a
                              href={page.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline"
                            >
                              {page.url}
                            </a>
                          </td>
                          <td className="px-6 py-4 text-zinc-900 dark:text-white truncate max-w-xs">
                            {page.title || '—'}
                          </td>
                          <td className="px-6 py-4">
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
                          <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                            {page.headings.length > 0 ? (
                              <span title={page.headings.join(', ')}>
                                {page.headings.length} heading{page.headings.length !== 1 ? 's' : ''}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <Link
                              href={`/sugerence?url=${encodeURIComponent(page.url)}&pageId=${page._id}&siteId=${siteId}`}
                              className="text-amber-600 hover:text-amber-700 font-medium"
                            >
                              {t('sites.actions')} →
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Meta Tags Tab */}
          {activeTab === 'meta' && (
            <div>
              {pages.length > 0 && pages[0].metaTags && pages[0].metaTags.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                    {t('siteDetails.metaTagsFrom')} ({pages[0].url})
                  </p>
                  {pages[0].metaTags.map((tag, idx) => (
                    <div key={idx} className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                      <div className="text-sm">
                        <span className="font-mono font-medium text-zinc-900 dark:text-white">{tag.name}</span>
                        <span className="text-zinc-600 dark:text-zinc-400 ml-2">
                          {tag.content}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-zinc-600 dark:text-zinc-400">
                    {t('siteDetails.noMetaTagsMessage')}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
