"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/Dialog";

interface DeleteSiteDialogProps {
  siteId: string;
  siteUrl: string;
  orgId: string;
}
export function DeleteSiteDialog({siteId, siteUrl, orgId}: DeleteSiteDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const handleDelete = async () => {
    setIsLoading(true)
    setError('')
    try {
        const response = await fetch(`/api/sites/${siteId}`,{
            method: 'DELETE',
        })
        if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete organization');
      }
      setIsOpen(false);
      // Replace history to prevent back button from returning to deleted site
      router.replace(`/dashboard?org=${orgId}`);
      // Revalidate server data to refresh the sites list
      router.refresh();
    } catch (error) {
        setError(error instanceof Error ? error.message : 'Something went wrong')
    }finally{
        setIsLoading(false)
    }
  }
 return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium">
          Delete Site
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Site</DialogTitle>
          <DialogDescription>
            This action cannot be undone. Please be certain.
          </DialogDescription>
        </DialogHeader>

        
          <div className="space-y-4 mb-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              This site will permanently delete <strong>{siteUrl}</strong> 
            </p>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded p-3">
              <p className="text-sm text-red-800 dark:text-red-200">
                ⚠️ All data will be lost. This cannot be reversed.
              </p>
            </div>
          </div>
        
        <DialogFooter>
          <DialogClose asChild>
            <button className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded hover:bg-zinc-300 dark:hover:bg-zinc-700 text-sm font-medium">
              Cancel
            </button>
          </DialogClose>
            <button
              onClick={handleDelete}
              disabled={isLoading}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {isLoading ? 'Deleting...' : 'Delete Site'}
            </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}