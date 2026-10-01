'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@seo-optimizer/ui';
import { useI18n, useCurrentLanguage } from '@/lib/i18n/useI18n';
import { toastError, toastSuccess } from '@/lib/toast';
import { RiSave2Line } from '@remixicon/react';

interface CreateOrganizationFormProps {
  userId: string;
}

export function CreateOrganizationForm({ userId }: CreateOrganizationFormProps) {
  const router = useRouter();
  const lang = useCurrentLanguage();
  const { t } = useI18n(lang);

  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toastError(t('validation.required'), t('common.error'));
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        toastError(data.error || t('errors.serverError'), t('common.error'));
        return;
      }

      const data = await res.json();
      toastSuccess(t('organizationSettings.createSuccess'), t('common.success'));
      router.push(`/dashboard?org=${data.organization._id}`);
    } catch (err) {
      toastError(err instanceof Error ? err.message : t('errors.serverError'), t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-2">
        <Input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('common.organization')}
          disabled={isLoading}
          className="flex-1"
        />
        <Button
          type="submit"
          disabled={isLoading || !name.trim()}
          className="bg-blue-600 text-white hover:bg-blue-700"
          icon={<RiSave2Line className="size-4" />}
        >
          {isLoading ? t('common.loading') : t('common.save')}
        </Button>
      </div>
    </form>
  );
}
