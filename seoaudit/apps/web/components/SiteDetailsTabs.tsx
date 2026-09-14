'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useI18n, useCurrentLanguage } from '@/lib/i18n/useI18n';
import { SERPPreview } from './SERPPreview';
import { Card, CardContent } from './Card';

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
      <Card className="p-0">
        <div className="flex flex-wrap border-b border-base-300">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex-1 md:flex-none px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-base-content/60 hover:text-base-content'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-4 lg:p-6">
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
                <div className="alert alert-info">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span>{t('serpPreview.noDatabMessage')}</span>
                </div>
              )}
            </div>
          )}

          {/* Pages Tab */}
          {activeTab === 'pages' && (
            <div>
              {pages.length === 0 ? (
                <div className="alert alert-warning">
                  <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4v2m0 0v2m0-6h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{t('siteDetails.noPagesMessage')}</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table w-full text-sm">
                    <thead className="bg-base-200">
                      <tr>
                        <th className="text-base-content">
                          {t('common.url')}
                        </th>
                        <th className="text-base-content">
                          {t('siteDetails.pageTitle')}
                        </th>
                        <th className="text-base-content">
                          {t('common.status')}
                        </th>
                        <th className="text-base-content">
                          {t('pages.headings')}
                        </th>
                        <th className="text-base-content">
                          {t('sites.actions')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pages.map((page) => (
                        <tr key={page._id} className="hover">
                          <td className="text-primary truncate max-w-xs">
                            <a
                              href={page.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline"
                            >
                              {page.url}
                            </a>
                          </td>
                          <td className="text-base-content truncate max-w-xs">
                            {page.title || '—'}
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                page.statusCode === 200
                                  ? 'badge-success'
                                  : page.statusCode && page.statusCode >= 400
                                    ? 'badge-error'
                                    : 'badge-info'
                              }`}
                            >
                              {page.statusCode || '—'}
                            </span>
                          </td>
                          <td className="text-base-content/70">
                            {page.headings.length > 0 ? (
                              <span title={page.headings.join(', ')}>
                                {page.headings.length} heading{page.headings.length !== 1 ? 's' : ''}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td>
                            <Link
                              href={`/sugerence?url=${encodeURIComponent(page.url)}&pageId=${page._id}&siteId=${siteId}`}
                              className="link link-primary font-medium"
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
                <div className="space-y-4">
                  <p className="text-sm text-base-content/70 mb-4">
                    {t('siteDetails.metaTagsFrom')} <span className="font-mono text-base-content font-medium">{pages[0].url}</span>
                  </p>
                  {pages[0].metaTags.map((tag, idx) => (
                    <Card key={idx} className="border-primary/50">
                      <CardContent className="pt-6">
                        <div className="text-sm space-y-2">
                          <div className="flex items-start gap-2">
                            <span className="font-mono font-semibold text-primary flex-shrink-0">{tag.name}:</span>
                            <span className="text-base-content break-words">
                              {tag.content}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="alert alert-info">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span>{t('siteDetails.noMetaTagsMessage')}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
