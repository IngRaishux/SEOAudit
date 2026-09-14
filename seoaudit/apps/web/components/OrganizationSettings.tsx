'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useI18n, useCurrentLanguage } from '@/lib/i18n/useI18n';

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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      setError(t('validation.required'));
      return;
    }

    if (name === organizationName) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch(`/api/organizations/${organizationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || t('errors.serverError'));
        setIsSaving(false);
        return;
      }

      setSuccess(true);
      setIsEditing(false);
      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.serverError'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="alert alert-error text-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l-2-2m0 0l-2-2m2 2l2-2m-2 2l-2 2m2-2l2 2m0 0l2-2m-2 2l-2 2"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success text-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>✓ {t('organizationSettings.updateSuccess')}</span>
        </div>
      )}

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
                setError(null);
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
