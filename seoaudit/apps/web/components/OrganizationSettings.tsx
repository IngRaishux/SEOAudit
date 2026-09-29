'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@seo-optimizer/ui';
import { useI18n, useCurrentLanguage } from '@/lib/i18n/useI18n';
import { toastError, toastSuccess } from '@/lib/toast';

interface OrganizationSettingsProps {
  organizationId: string;
  organizationName: string;
}

export function OrganizationSettings({
  organizationId,
  organizationName,
}: OrganizationSettingsProps) {
  const router = useRouter();
  const lang = useCurrentLanguage();
  const { t } = useI18n(lang);

  const [name, setName] = useState(organizationName);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toastError(t('validation.required'), t('common.error'));
      return;
    }

    if (name === organizationName) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);

    try {
      const res = await fetch(`/api/organizations/${organizationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        const data = await res.json();
        toastError(data.error || t('errors.serverError'), t('common.error'));
        setIsSaving(false);
        return;
      }

      toastSuccess(t('organizationSettings.updateSuccess'), t('common.success'));
      setIsEditing(false);
      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (err) {
      toastError(err instanceof Error ? err.message : t('errors.serverError'), t('common.error'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {isEditing ? (
        <div className="space-y-3">
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('common.organization')}
            disabled={isSaving}
          />
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="primary"
              onClick={handleSave}
              isLoading={isSaving}
            >
              {isSaving ? t('common.loading') : t('common.save')}
            </Button>
            <Button
              variant="light"
              onClick={() => {
                setIsEditing(false);
                setName(organizationName);
              }}
              disabled={isSaving}
            >
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm text-base-content/70 mb-1">
              {t('organizationSettings.name')}
            </p>
            <p className="text-lg font-semibold text-base-content">
              {name}
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => setIsEditing(true)}
          >
            {t('common.edit')}
          </Button>
        </div>
      )}
    </div>
  );
}
