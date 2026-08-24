import { getServerSession } from 'next-auth/next';
import { handler } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function DashboardPage() {
  const session = await getServerSession(handler);

  if (!session || !session.user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-4xl font-bold mb-8">Dashboard</h1>

        <div className="grid grid-cols-1 gap-4">
          <div className="p-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-semibold mb-2">Your Sites</h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              No sites yet. Start by crawling a website.
            </p>
            <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">
              Go to crawler →
            </Link>
          </div>

          <div className="p-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-semibold mb-2">Account Info</h2>
            <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-2">
              <li>Email: {session.user.email}</li>
              <li>ID: {session.user.id}</li>
              {session.user.organizationName && (
                <li>Organization: {session.user.organizationName}</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
