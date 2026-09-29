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
import { RiDeleteBinLine } from "@remixicon/react"

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
        <Button
          variant="destructive"
          size="sm"
          icon={<RiDeleteBinLine className="size-4" />}
        >
          {t('sites.delete')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('deleteSiteDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('deleteSiteDialog.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mb-4">
          <p className="text-xs lg:text-sm text-zinc-600 dark:text-zinc-400 break-words">
            {t('deleteSiteDialog.willDelete')} <strong className="break-all">{siteUrl}</strong>
          </p>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded p-2 lg:p-3">
            <p className="text-xs lg:text-sm text-red-800 dark:text-red-200">
              {t('deleteSiteDialog.warning')}
            </p>
          </div>
          {error && (
            <div className="text-xs lg:text-sm text-red-600 dark:text-red-400 break-words">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="neutral" size="sm">
              {t('common.cancel')}
            </Button>
          </DialogClose>
          <Button
            onClick={handleDelete}
            isLoading={isLoading}
            loadingText={t('deleteSiteDialog.deleting')}
            variant="destructive"
            size="sm"
            icon={<RiDeleteBinLine className="size-4" />}
          >
            {t('deleteSiteDialog.deleteButton')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}