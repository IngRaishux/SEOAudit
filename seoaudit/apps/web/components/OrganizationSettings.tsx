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
        <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 rounded-md bg-green-50 border border-green-200 text-green-700 text-sm">
          ✓ {t('organizationSettings.updateSuccess')}
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
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {isSaving ? t('common.loading') : t('common.save')}
            </Button>
            <Button
              onClick={() => {
                setIsEditing(false);
                setName(organizationName);
                setError(null);
              }}
              disabled={isSaving}
              className="bg-zinc-200 text-zinc-900 hover:bg-zinc-300"
            >
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
              {t('organizationSettings.name')}
            </p>
            <p className="text-lg font-semibold text-zinc-900 dark:text-white">
              {name}
            </p>
          </div>
          <Button
            onClick={() => setIsEditing(true)}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            {t('common.edit')}
          </Button>
        </div>
      )}
    </div>
  );
}
