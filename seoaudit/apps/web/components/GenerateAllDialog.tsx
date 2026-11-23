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
import { toastError, toastWarning } from '@/lib/toast';
import { RiMagicLine } from '@remixicon/react';

interface GenerateAllDialogProps {
  siteId: string;
  pageCount: number;
}

export function GenerateAllDialog({ siteId, pageCount }: GenerateAllDialogProps) {
  const router = useRouter();
  const lang = useCurrentLanguage();
  const { t } = useI18n(lang);

  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateAll = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/sites/${siteId}/generate-all`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('generateAll.error'));
      }

      if (data.alreadyRunning) {
        toastWarning(t('generateAll.alreadyRunning'));
      }

      setIsOpen(false);
      router.push(`/sites/${siteId}/generate-all?jobId=${data.jobId}`);
    } catch (error) {
      toastError(
        error instanceof Error ? error.message : t('common.error'),
        t('common.error')
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          icon={<RiMagicLine className="size-4" />}
        >
          {t('generateAll.button')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('generateAll.dialogTitle')}</DialogTitle>
          <DialogDescription>
            {t('generateAll.dialogDescription').replace(
              '{{count}}',
              String(pageCount)
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="neutral" size="sm">
              {t('common.cancel')}
            </Button>
          </DialogClose>
          <Button
            onClick={handleGenerateAll}
            isLoading={isLoading}
            loadingText={t('generateAll.starting')}
            variant="primary"
            size="sm"
            icon={<RiMagicLine className="size-4" />}
          >
            {t('generateAll.confirmButton')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
