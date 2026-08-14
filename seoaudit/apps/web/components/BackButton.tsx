'use client';

import { useRouter } from 'next/navigation';

export function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-200 text-zinc-700 rounded-md hover:bg-zinc-300 transition-colors text-sm font-medium dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
    >
      ← Volver a Crawleos
    </button>
  );
}
