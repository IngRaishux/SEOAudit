'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useI18n, useCurrentLanguage } from '@/lib/i18n/useI18n';
import { SERPPreview } from './SERPPreview';
import { Card, CardContent } from './Card';
import { GenerateAllDialog } from './GenerateAllDialog';
import { can, type OrgRole } from '@/lib/auth/permissions';
import { ISite } from '@/lib/interfaces';
import { RiSearchLine, RiFileTextLine, RiPriceTag3Line, RiSparklingLine } from '@remixicon/react';
import { GeoTab } from './geo/GeoTab';
import { HreflangCell, HreflangSummary } from './hreflang/HreflangCell';
import { normalizeUrl, reviewHreflang, type HreflangAlternate } from '@/lib/hreflang/review';
import { Pagination } from './Pagination';
import { ExportPagesMenu } from './ExportPagesMenu';
import { DEFAULT_PAGE_SIZE, paginate } from '@/lib/pagination';
import { toPageRow } from '@/lib/sitePages/rows';

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
  /** undefined: rastreada antes de capturar hreflang */
  alternates?: HreflangAlternate[];
  htmlLang?: string;
}

interface SiteDetailsTabsProps {
  pages: Page[];
  siteUrl: string;
  siteId: string;
  organizationId: string;
  role: OrgRole;
  site: ISite 
}

type TabType = 'serp' | 'pages' | 'meta' | 'geo';

export function SiteDetailsTabs({
  pages,
  siteUrl,
  siteId,
  site,
  role,
}: SiteDetailsTabsProps) {
  const canEdit = can(role, 'content.edit');
  const [activeTab, setActiveTab] = useState<TabType>('serp');
  const lang = useCurrentLanguage();
  const { t } = useI18n(lang);
  const hreflangReviews = useMemo(() => reviewHreflang(pages), [pages]);
  const pagesByUrl = useMemo(() => new Map(pages.map((p) => [normalizeUrl(p.url), p])), [pages]);
  // Filas de todas las páginas: la tabla solo pinta el bloque visible, pero el export y la revisión
  // de hreflang necesitan el sitio completo
  const pageRows = useMemo(
    () => pages.map((p) => toPageRow(p, hreflangReviews.get(normalizeUrl(p.url)), t)),
    [pages, hreflangReviews, t]
  );
  const [pagesPage, setPagesPage] = useState(1);
  const [pagesPageSize, setPagesPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const pager = paginate(pagesPage, pagesPageSize, pages.length);
  const visiblePages = pages.slice(pager.start, pager.end);

  const tabs = [
    { id: 'serp', label: t('siteDetails.tabs.serp'), icon: <RiSearchLine className="size-4" /> },
    { id: 'pages', label: `${t('siteDetails.tabs.pages')} (${pages.length})`, icon: <RiFileTextLine className="size-4" /> },
    { id: 'meta', label: t('siteDetails.tabs.meta'), icon: <RiPriceTag3Line className="size-4" /> },
    { id: 'geo', label: t('siteDetails.tabs.geo'), icon: <RiSparklingLine className="size-4" /> },
  ] as const;

  console.log('pages => ', pages);
  

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
              {site.title && site.description ? (
                <>
                  {(() => {
                    
                    return (
                      <SERPPreview
                        title={site.description}
                        description={site.description}
                        url={siteUrl}
                      />
                    );
                  })()}
                </>
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
                <div>
                  {/* Fuera del contenedor con scroll para que el menú de exportar no quede recortado */}
                  <div className="flex flex-wrap justify-end gap-2 mb-4">
                    <ExportPagesMenu rows={pageRows} siteUrl={site.url || siteUrl} lang={lang} t={t} />
                    {canEdit && <GenerateAllDialog siteId={siteId} pageCount={pages.length} />}
                  </div>
                  <HreflangSummary pages={pages} reviews={hreflangReviews} t={t} />
                  <div className="overflow-x-auto">
                  {/* Padding horizontal reducido para que las 7 columnas quepan sin scroll en escritorio */}
                  <table className="table w-full text-sm [&_th]:px-3 [&_td]:px-3">
                    <thead className="bg-base-200">
                      <tr>
                        <th className="text-base-content">
                          {t('common.url')}
                        </th>
                        <th className="text-base-content">
                          {t('siteDetails.pageTitle')}
                        </th>
                        <th className="text-base-content">
                          {t('siteDetails.description')}
                        </th>
                        <th className="text-base-content">
                          {t('siteDetails.hreflang.column')}
                        </th>
                        <th className="text-base-content text-center">
                          {t('pages.headings')}
                        </th>
                        <th className="text-base-content">
                          {t('common.status')}
                        </th>
                        {canEdit && (
                          <th className="text-base-content">
                            {t('sites.actions')}
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {visiblePages.map((page, index) => {
                        const row = pageRows[pager.start + index];
                        return (
                        <tr key={page._id} className="hover">
                          <td className="text-primary min-w-40 max-w-52">
                            <a
                              href={page.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline break-all line-clamp-2"
                              title={page.url}
                            >
                              {page.url}
                            </a>
                          </td>
                          <td className="text-base-content min-w-36 max-w-48">
                            {page.title ? (
                              <span className="line-clamp-2" title={page.title}>
                                {page.title}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="text-base-content/80 min-w-48 max-w-64">
                            {row.description ? (
                              <span className="line-clamp-2" title={row.description}>
                                {row.description}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="align-top">
                            <HreflangCell
                              pageUrl={page.url}
                              pagesByUrl={pagesByUrl}
                              alternates={page.alternates}
                              htmlLang={page.htmlLang}
                              review={hreflangReviews.get(normalizeUrl(page.url))}
                              t={t}
                            />
                          </td>
                          <td className="text-base-content/70 text-center">
                            {page.headings.length > 0 ? (
                              <span title={page.headings.join('\n')}>{page.headings.length}</span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                row.statusTone === 'success'
                                  ? 'badge-success'
                                  : row.statusTone === 'error'
                                    ? 'badge-error'
                                    : 'badge-info'
                              }`}
                            >
                              {page.statusCode || '—'}
                            </span>
                          </td>
                          {canEdit && (
                            <td className="whitespace-nowrap">
                              <Link
                                href={`/sugerence?url=${encodeURIComponent(page.url)}&pageId=${page._id}&siteId=${siteId}`}
                                className="link link-primary font-medium"
                              >
                                {t('sites.actions')} →
                              </Link>
                            </td>
                          )}
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  </div>
                  <Pagination
                    className="mt-4"
                    page={pager.page}
                    pageSize={pagesPageSize}
                    total={pages.length}
                    onPageChange={setPagesPage}
                    onPageSizeChange={(size) => {
                      setPagesPageSize(size);
                      setPagesPage(1);
                    }}
                    t={t}
                  />
                </div>
              )}
            </div>
          )}

          {/* Meta Tags Tab */}
          {activeTab === 'meta' && (
            <div>
              {site.metaTags && site.metaTags.length > 0 ? (
                <div className="space-y-4">
                  <p className="text-sm text-base-content/70 mb-4">
                    {t('siteDetails.metaTagsFrom')} <span className="font-mono text-base-content font-medium">{site.url}</span>
                  </p>
                  {site.metaTags.map((tag, idx) => (
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

          {activeTab === 'geo' && <GeoTab siteId={siteId} t={t} canEdit={canEdit} />}
        </div>
      </Card>
    </div>
  );
}
