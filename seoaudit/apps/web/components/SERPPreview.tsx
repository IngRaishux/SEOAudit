'use client';

import { useMemo } from 'react';
import { useI18n, useCurrentLanguage } from '@/lib/i18n/useI18n';
import { Card, CardHeader, CardTitle, CardContent } from './Card';

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
    if (len < limit.titleMin || len > limit.titleMax) return 'error';
    if (len < limit.titleIdeal || len > limit.titleIdeal) return 'warning';
    return 'success';
  };

  const getDescStatus = (len: number, isMobile: boolean) => {
    const limit = isMobile ? limits.mobile : limits.desktop;
    if (len < limit.descMin || len > limit.descMax) return 'error';
    if (len < limit.descIdeal || len > limit.descIdeal) return 'warning';
    return 'success';
  };

  const titleLen = title.length;
  const descLen = description.length;
  const truncatedTitle = (text: string, max: number) => text.length > max ? text.substring(0, max) + '...' : text;

  const getStatusBadgeClass = (status: string) => {
    return status === 'success' ? 'badge-success' :
           status === 'warning' ? 'badge-warning' : 'badge-error';
  };

  const getStatusTextClass = (status: string) => {
    return status === 'success' ? 'text-success' :
           status === 'warning' ? 'text-warning' : 'text-error';
  };

  const getStatusBgClass = (status: string) => {
    return status === 'success' ? 'bg-success/10' :
           status === 'warning' ? 'bg-warning/10' : 'bg-error/10';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('serpPreview.title')}</CardTitle>
          <p className="text-sm text-base-content/70 mt-2">{t('serpPreview.subtitle')}</p>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Desktop Preview */}
          <div>
            <h4 className="text-sm font-semibold text-base-content mb-4">🖥️ {t('serpPreview.desktop')}</h4>
            <div className={`p-4 rounded-lg border border-base-300 ${getStatusBgClass(getTitleStatus(titleLen, false))} max-w-2xl`}>
              {/* Blue underline */}
              <div className="mb-2 h-1 w-8 bg-primary rounded"></div>

              {/* URL */}
              <div className="text-xs text-success mb-1 font-medium">
                {new URL(url).hostname}
              </div>

              {/* Title */}
              <h2 className={`text-lg font-medium text-primary hover:underline cursor-pointer mb-1 break-words ${getTitleStatus(titleLen, false) !== 'success' ? getStatusTextClass(getTitleStatus(titleLen, false)) : ''}`}>
                {truncatedTitle(title, limits.desktop.titleMax)}
              </h2>

              {/* Description */}
              <p className={`text-sm text-base-content/70 break-words leading-relaxed ${getDescStatus(descLen, false) !== 'success' ? getStatusTextClass(getDescStatus(descLen, false)) : ''}`}>
                {truncatedTitle(description, limits.desktop.descMax)}
              </p>
            </div>

            {/* Desktop Metrics */}
            <div className="mt-3 grid grid-cols-2 gap-3 max-w-2xl">
              <Card className={`border-${getStatusBadgeClass(getTitleStatus(titleLen, false))}`}>
                <CardContent className="pt-4">
                  <p className="text-xs font-semibold text-base-content">{t('serpPreview.titleLabel')}</p>
                  <p className={`text-sm font-medium ${getStatusTextClass(getTitleStatus(titleLen, false))}`}>
                    {titleLen}/{limits.desktop.titleIdeal}
                  </p>
                  <p className="text-xs text-base-content/70 mt-1">
                    {titleLen < limits.desktop.titleMin ? t('serpPreview.tooShort') : titleLen > limits.desktop.titleMax ? t('serpPreview.tooLong') : t('serpPreview.optimal')}
                  </p>
                </CardContent>
              </Card>

              <Card className={`border-${getStatusBadgeClass(getDescStatus(descLen, false))}`}>
                <CardContent className="pt-4">
                  <p className="text-xs font-semibold text-base-content">{t('serpPreview.descriptionLabel')}</p>
                  <p className={`text-sm font-medium ${getStatusTextClass(getDescStatus(descLen, false))}`}>
                    {descLen}/{limits.desktop.descIdeal}
                  </p>
                  <p className="text-xs text-base-content/70 mt-1">
                    {descLen < limits.desktop.descMin ? t('serpPreview.tooShort') : descLen > limits.desktop.descMax ? t('serpPreview.tooLong') : t('serpPreview.optimal')}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Mobile Preview */}
          <div>
            <h4 className="text-sm font-semibold text-base-content mb-4">📱 {t('serpPreview.mobile')}</h4>
            <div className={`p-3 rounded-lg border border-base-300 ${getStatusBgClass(getTitleStatus(titleLen, true))} max-w-sm`}>
              {/* Blue underline */}
              <div className="mb-2 h-0.5 w-6 bg-primary rounded"></div>

              {/* URL */}
              <div className="text-xs text-success mb-0.5 font-medium">
                {new URL(url).hostname}
              </div>

              {/* Title */}
              <h2 className={`text-base font-medium text-primary hover:underline cursor-pointer mb-1 break-words ${getTitleStatus(titleLen, true) !== 'success' ? getStatusTextClass(getTitleStatus(titleLen, true)) : ''}`}>
                {truncatedTitle(title, limits.mobile.titleMax)}
              </h2>

              {/* Description */}
              <p className={`text-xs text-base-content/70 break-words leading-relaxed ${getDescStatus(descLen, true) !== 'success' ? getStatusTextClass(getDescStatus(descLen, true)) : ''}`}>
                {truncatedTitle(description, limits.mobile.descMax)}
              </p>
            </div>

            {/* Mobile Metrics */}
            <div className="mt-3 grid grid-cols-2 gap-3 max-w-sm">
              <Card className={`border-${getStatusBadgeClass(getTitleStatus(titleLen, true))}`}>
                <CardContent className="pt-4">
                  <p className="text-xs font-semibold text-base-content">{t('serpPreview.titleLabel')}</p>
                  <p className={`text-sm font-medium ${getStatusTextClass(getTitleStatus(titleLen, true))}`}>
                    {titleLen}/{limits.mobile.titleIdeal}
                  </p>
                  <p className="text-xs text-base-content/70 mt-1">
                    {titleLen < limits.mobile.titleMin ? t('serpPreview.tooShort') : titleLen > limits.mobile.titleMax ? t('serpPreview.tooLong') : t('serpPreview.optimal')}
                  </p>
                </CardContent>
              </Card>

              <Card className={`border-${getStatusBadgeClass(getDescStatus(descLen, true))}`}>
                <CardContent className="pt-4">
                  <p className="text-xs font-semibold text-base-content">{t('serpPreview.descriptionLabel')}</p>
                  <p className={`text-sm font-medium ${getStatusTextClass(getDescStatus(descLen, true))}`}>
                    {descLen}/{limits.mobile.descIdeal}
                  </p>
                  <p className="text-xs text-base-content/70 mt-1">
                    {descLen < limits.mobile.descMin ? t('serpPreview.tooShort') : descLen > limits.mobile.descMax ? t('serpPreview.tooLong') : t('serpPreview.optimal')}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
