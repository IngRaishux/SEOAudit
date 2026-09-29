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
  Button,
} from '@seo-optimizer/ui';
import { useI18n, useCurrentLanguage } from '@/lib/i18n/useI18n';
import { RiDeleteBinLine } from '@remixicon/react';

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
        <Button
          variant="destructive"
          size="sm"
          icon={<RiDeleteBinLine className="size-4" />}
        >
          {t('organizationSettings.deleteOrganization')}
        </Button>
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
            <Button variant="neutral" size="sm">
              {t('common.cancel')}
            </Button>
          </DialogClose>
          {!isConfirming ? (
            <Button
              onClick={() => setIsConfirming(true)}
              variant="destructive"
              size="sm"
            >
              {t('common.edit')}
            </Button>
          ) : (
            <Button
              onClick={handleDelete}
              disabled={!canDelete || isLoading}
              isLoading={isLoading}
              loadingText={t('deleteOrgDialog.deleting')}
              variant="destructive"
              size="sm"
              icon={<RiDeleteBinLine className="size-4" />}
            >
              {t('deleteOrgDialog.deleteButton')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
