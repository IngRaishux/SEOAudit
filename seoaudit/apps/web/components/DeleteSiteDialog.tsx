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

interface DeleteSiteDialogProps {
  siteId: string;
  siteUrl: string;
  orgId: string;
}

export function DeleteSiteDialog({
  siteId,
  siteUrl,
  orgId,
}: DeleteSiteDialogProps) {
  const router = useRouter();
  const lang = useCurrentLanguage();
  const { t } = useI18n(lang);

  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/sites/${siteId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || t('deleteSiteDialog.deletedError'));
      }
      setIsOpen(false);
      router.replace(`/dashboard?org=${orgId}`);
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : t('common.error')
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium">
          {t('sites.delete')}
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('deleteSiteDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('deleteSiteDialog.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mb-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {t('deleteSiteDialog.willDelete')} <strong>{siteUrl}</strong>
          </p>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded p-3">
            <p className="text-sm text-red-800 dark:text-red-200">
              {t('deleteSiteDialog.warning')}
            </p>
          </div>
          {error && (
            <div className="text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <button className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded hover:bg-zinc-300 dark:hover:bg-zinc-700 text-sm font-medium">
              {t('common.cancel')}
            </button>
          </DialogClose>
          <button
            onClick={handleDelete}
            disabled={isLoading}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {isLoading ? t('deleteSiteDialog.deleting') : t('deleteSiteDialog.deleteButton')}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}