'use client';

import { useMemo } from 'react';
import { useI18n, useCurrentLanguage } from '@/lib/i18n/useI18n';

interface SERPPreviewProps {
  title: string;
  description: string;
  url: string;
}

export function SERPPreview({ title, description, url }: SERPPreviewProps) {
  const lang = useCurrentLanguage();
  const { t } = useI18n(lang);

  const limits = useMemo(() => ({
    desktop: { titleMin: 30, titleIdeal: 60, titleMax: 70, descMin: 120, descIdeal: 155, descMax: 170 },
    mobile: { titleMin: 30, titleIdeal: 55, titleMax: 60, descMin: 100, descIdeal: 120, descMax: 130 },
  }), []);

  const getTitleStatus = (len: number, isMobile: boolean) => {
    const limit = isMobile ? limits.mobile : limits.desktop;
    if (len < limit.titleMin || len > limit.titleMax) return 'red';
    if (len < limit.titleIdeal || len > limit.titleIdeal) return 'yellow';
    return 'green';
  };

  const getDescStatus = (len: number, isMobile: boolean) => {
    const limit = isMobile ? limits.mobile : limits.desktop;
    if (len < limit.descMin || len > limit.descMax) return 'red';
    if (len < limit.descIdeal || len > limit.descIdeal) return 'yellow';
    return 'green';
  };

  const titleLen = title.length;
  const descLen = description.length;
  const truncatedTitle = (text: string, max: number) => text.length > max ? text.substring(0, max) + '...' : text;
  const getStatusColor = (status: string) => {
    return status === 'green' ? 'text-green-600' : status === 'yellow' ? 'text-yellow-600' : 'text-red-600';
  };
  const getStatusBg = (status: string) => {
    return status === 'green' ? 'bg-green-50 dark:bg-green-900/20' :
           status === 'yellow' ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-red-50 dark:bg-red-900/20';
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
          <h3 className="text-xl font-semibold mb-4">{t('serpPreview.title')}</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{t('serpPreview.subtitle')}</p>
        </div>

        <div className="p-6 space-y-8">
          {/* Desktop Preview */}
          <div>
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">{t('serpPreview.desktop')}</h4>
            <div className={`p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 ${getStatusBg(getTitleStatus(titleLen, false))} max-w-2xl`}>
              {/* Green underline */}
              <div className="mb-2 h-1 w-8 bg-blue-500 rounded"></div>

              {/* URL */}
              <div className="text-xs text-green-600 dark:text-green-400 mb-1">
                {new URL(url).hostname}
              </div>

              {/* Title */}
              <h2 className={`text-lg font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer mb-1 break-words ${getTitleStatus(titleLen, false) !== 'green' ? getStatusColor(getTitleStatus(titleLen, false)) : ''}`}>
                {truncatedTitle(title, limits.desktop.titleMax)}
              </h2>

              {/* Description */}
              <p className={`text-sm text-zinc-600 dark:text-zinc-400 break-words leading-relaxed ${getDescStatus(descLen, false) !== 'green' ? getStatusColor(getDescStatus(descLen, false)) : ''}`}>
                {truncatedTitle(description, limits.desktop.descMax)}
              </p>
            </div>

            {/* Desktop Metrics */}
            <div className="mt-3 grid grid-cols-2 gap-3 max-w-2xl">
              <div className={`p-3 rounded border ${getTitleStatus(titleLen, false) === 'green' ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-900/20' : getTitleStatus(titleLen, false) === 'yellow' ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-900/20' : 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/20'}`}>
                <p className="text-xs font-semibold text-zinc-900 dark:text-white">{t('serpPreview.titleLabel')}</p>
                <p className={`text-sm font-medium ${getStatusColor(getTitleStatus(titleLen, false))}`}>
                  {titleLen}/{limits.desktop.titleIdeal}
                </p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                  {titleLen < limits.desktop.titleMin ? t('serpPreview.tooShort') : titleLen > limits.desktop.titleMax ? t('serpPreview.tooLong') : t('serpPreview.optimal')}
                </p>
              </div>

              <div className={`p-3 rounded border ${getDescStatus(descLen, false) === 'green' ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-900/20' : getDescStatus(descLen, false) === 'yellow' ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-900/20' : 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/20'}`}>
                <p className="text-xs font-semibold text-zinc-900 dark:text-white">{t('serpPreview.descriptionLabel')}</p>
                <p className={`text-sm font-medium ${getStatusColor(getDescStatus(descLen, false))}`}>
                  {descLen}/{limits.desktop.descIdeal}
                </p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                  {descLen < limits.desktop.descMin ? 'Muy corta' : descLen > limits.desktop.descMax ? 'Muy larga' : 'Óptima'}
                </p>
              </div>
            </div>
          </div>

          {/* Mobile Preview */}
          <div>
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">{t('serpPreview.mobile')}</h4>
            <div className={`p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 ${getStatusBg(getTitleStatus(titleLen, true))} max-w-sm`}>
              {/* Green underline */}
              <div className="mb-2 h-0.5 w-6 bg-blue-500 rounded"></div>

              {/* URL */}
              <div className="text-xs text-green-600 dark:text-green-400 mb-0.5">
                {new URL(url).hostname}
              </div>

              {/* Title */}
              <h2 className={`text-base font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer mb-1 break-words ${getTitleStatus(titleLen, true) !== 'green' ? getStatusColor(getTitleStatus(titleLen, true)) : ''}`}>
                {truncatedTitle(title, limits.mobile.titleMax)}
              </h2>

              {/* Description */}
              <p className={`text-xs text-zinc-600 dark:text-zinc-400 break-words leading-relaxed ${getDescStatus(descLen, true) !== 'green' ? getStatusColor(getDescStatus(descLen, true)) : ''}`}>
                {truncatedTitle(description, limits.mobile.descMax)}
              </p>
            </div>

            {/* Mobile Metrics */}
            <div className="mt-3 grid grid-cols-2 gap-3 max-w-sm">
              <div className={`p-3 rounded border ${getTitleStatus(titleLen, true) === 'green' ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-900/20' : getTitleStatus(titleLen, true) === 'yellow' ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-900/20' : 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/20'}`}>
                <p className="text-xs font-semibold text-zinc-900 dark:text-white">{t('serpPreview.titleLabel')}</p>
                <p className={`text-sm font-medium ${getStatusColor(getTitleStatus(titleLen, true))}`}>
                  {titleLen}/{limits.mobile.titleIdeal}
                </p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                  {titleLen < limits.mobile.titleMin ? t('serpPreview.tooShort') : titleLen > limits.mobile.titleMax ? t('serpPreview.tooLong') : t('serpPreview.optimal')}
                </p>
              </div>

              <div className={`p-3 rounded border ${getDescStatus(descLen, true) === 'green' ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-900/20' : getDescStatus(descLen, true) === 'yellow' ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-900/20' : 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/20'}`}>
                <p className="text-xs font-semibold text-zinc-900 dark:text-white">{t('serpPreview.descriptionLabel')}</p>
                <p className={`text-sm font-medium ${getStatusColor(getDescStatus(descLen, true))}`}>
                  {descLen}/{limits.mobile.descIdeal}
                </p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                  {descLen < limits.mobile.descMin ? `${t('serpPreview.tooShort')}` : descLen > limits.mobile.descMax ? `${t('serpPreview.tooLong')}` : `${t('serpPreview.optimal')}`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
