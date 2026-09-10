'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/Dialog';
import { useI18n, useCurrentLanguage } from '@/lib/i18n/useI18n';

interface DeleteOrganizationDialogProps {
  organizationId: string;
  organizationName: string;
}

export function DeleteOrganizationDialog({
  organizationId,
  organizationName,
}: DeleteOrganizationDialogProps) {
  const router = useRouter();
  const lang = useCurrentLanguage();
  const { t } = useI18n(lang);

  const [isOpen, setIsOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const canDelete = confirmText === organizationName;

  const handleDelete = async () => {
    if (!canDelete) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/organizations/${organizationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || t('deleteOrgDialog.deletedError'));
      }

      setIsOpen(false);
      router.replace('/organizations');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium">
          {t('organizationSettings.deleteOrganization')}
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('deleteOrgDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('deleteOrgDialog.description')}
          </DialogDescription>
        </DialogHeader>

        {!isConfirming ? (
          <div className="space-y-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {t('deleteOrgDialog.willDeleteAll')} <strong>{organizationName}</strong>
            </p>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded p-3">
              <p className="text-sm text-red-800 dark:text-red-200">
                {t('deleteOrgDialog.warning')}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 mb-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {t('deleteOrgDialog.typeToConfirm')} <strong>{organizationName}</strong>
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={organizationName}
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
              autoFocus
            />
            {error && (
              <div className="text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <button className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded hover:bg-zinc-300 dark:hover:bg-zinc-700 text-sm font-medium">
              {t('common.cancel')}
            </button>
          </DialogClose>
          {!isConfirming ? (
            <button
              onClick={() => setIsConfirming(true)}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium"
            >
              {t('common.edit')}
            </button>
          ) : (
            <button
              onClick={handleDelete}
              disabled={!canDelete || isLoading}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {isLoading ? t('deleteOrgDialog.deleting') : t('deleteOrgDialog.deleteButton')}
            </button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
