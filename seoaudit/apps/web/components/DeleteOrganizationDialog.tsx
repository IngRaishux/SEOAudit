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

interface DeleteOrganizationDialogProps {
  organizationId: string;
  organizationName: string;
}

export function DeleteOrganizationDialog({
  organizationId,
  organizationName,
}: DeleteOrganizationDialogProps) {
  const router = useRouter();
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
        throw new Error(data.error || 'Failed to delete organization');
      }

      setIsOpen(false);
      // Replace history to prevent back button from returning to deleted org
      router.replace('/organizations');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium">
          Delete Organization
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Organization</DialogTitle>
          <DialogDescription>
            This action cannot be undone. Please be certain.
          </DialogDescription>
        </DialogHeader>

        {!isConfirming ? (
          <div className="space-y-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              This will permanently delete <strong>{organizationName}</strong> and
              all associated sites and suggestions.
            </p>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded p-3">
              <p className="text-sm text-red-800 dark:text-red-200">
                ⚠️ All data will be lost. This cannot be reversed.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Type <strong>{organizationName}</strong> to confirm deletion:
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
              Cancel
            </button>
          </DialogClose>
          {!isConfirming ? (
            <button
              onClick={() => setIsConfirming(true)}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleDelete}
              disabled={!canDelete || isLoading}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {isLoading ? 'Deleting...' : 'Delete Organization'}
            </button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
