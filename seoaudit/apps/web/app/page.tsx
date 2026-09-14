'use client';

import { Button } from '@/components/Button';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

export const dynamic = 'force-dynamic';

export default function Home() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-black dark:to-zinc-900">
      {/* Hero Section */}
      <div className="max-w-4xl mx-auto px-4 py-24">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold mb-4 text-zinc-900 dark:text-white">
            Website SEO Analysis Made Simple
          </h2>
          <p className="text-xl text-zinc-600 dark:text-zinc-400 mb-8">
            Crawl your website, identify SEO issues, and get actionable suggestions to improve your ranking.
          </p>
          {session ? (
            <div className="flex gap-4 justify-center">
              <Link href="/crawler">
                <Button className="px-8 py-3 bg-blue-600 text-white hover:bg-blue-700 text-lg">
                  Start Crawling
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button className="px-8 py-3 bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-300 dark:hover:bg-zinc-700 text-lg">
                  View Dashboard
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex gap-4 justify-center">
              <Link href="/register">
                <Button className="px-8 py-3 bg-blue-600 text-white hover:bg-blue-700 text-lg">
                  Get Started Free
                </Button>
              </Link>
              <Link href="/login">
                <Button className="px-8 py-3 bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-300 dark:hover:bg-zinc-700 text-lg">
                  Sign In
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div className="text-3xl mb-3">🔍</div>
            <h3 className="text-lg font-semibold mb-2">Deep Site Analysis</h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              Automatically crawl your entire website and analyze every page for SEO issues.
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div className="text-3xl mb-3">💡</div>
            <h3 className="text-lg font-semibold mb-2">Smart Suggestions</h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              Get AI-powered recommendations to fix issues and improve your SEO performance.
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="text-lg font-semibold mb-2">Multi-Organization</h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              Manage multiple websites and organizations in a single dashboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
