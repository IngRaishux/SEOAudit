'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { redirect } from 'next/navigation';

interface SiteSettings {
  siteId: string;
  crawlFrequency: 'daily' | 'weekly' | 'monthly' | 'manual';
  maxPages: number;
  followRobots: boolean;
  checkSSL: boolean;
  trackMetrics: boolean;
  excludePatterns: string[];
}

export default function SiteSettingsPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const resolvedParams = params;
  const [siteId, setSiteId] = useState<string>('');
  const [siteName, setSiteName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState<SiteSettings>({
    siteId: '',
    crawlFrequency: 'manual',
    maxPages: 1000,
    followRobots: true,
    checkSSL: true,
    trackMetrics: true,
    excludePatterns: [],
  });
  const [newPattern, setNewPattern] = useState('');

  useEffect(() => {
    const loadSiteSettings = async () => {
      const resolvedParams = await params;
      setSiteId(resolvedParams.siteId);

      try {
        const res = await fetch(`/api/sites/${resolvedParams.siteId}`);
        if (res.ok) {
          const data = await res.json();
          setSiteName(data.site.title || data.site.url);

          // Try to load site-specific settings
          const settingsRes = await fetch(`/api/site-settings/${resolvedParams.siteId}`);
          if (settingsRes.ok) {
            const settingsData = await settingsRes.json();
            setSettings({ ...settings, ...settingsData });
          }
        }
      } catch (error) {
        console.error('Error loading site settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSiteSettings();
  }, [params]);

  if (!session?.user) {
    redirect('/login');
  }

  if (loading) {
    return <div className="text-zinc-600 dark:text-zinc-400">Loading...</div>;
  }

  const handleSave = async () => {
    try {
      const res = await fetch(`/api/site-settings/${siteId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handleAddPattern = () => {
    if (newPattern.trim()) {
      setSettings({
        ...settings,
        excludePatterns: [...(settings.excludePatterns || []), newPattern],
      });
      setNewPattern('');
    }
  };

  const handleRemovePattern = (index: number) => {
    setSettings({
      ...settings,
      excludePatterns: settings.excludePatterns.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 text-sm font-medium"
      >
        ← Back to Sites
      </button>

      {/* Site Information */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-semibold">{siteName}</h2>
        </div>
      </div>

      {/* Crawl Settings */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-semibold">Crawl Settings</h2>
        </div>

        <div className="p-6 space-y-6">
          {/* Crawl Frequency */}
          <div>
            <label className="block text-sm font-medium text-zinc-900 dark:text-white mb-2">
              Crawl Frequency
            </label>
            <select
              value={settings.crawlFrequency}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  crawlFrequency: e.target.value as SiteSettings['crawlFrequency'],
                })
              }
              className="px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white w-full"
            >
              <option value="manual">Manual</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          {/* Max Pages */}
          <div>
            <label className="block text-sm font-medium text-zinc-900 dark:text-white mb-2">
              Maximum Pages to Crawl
            </label>
            <input
              type="number"
              value={settings.maxPages}
              onChange={(e) =>
                setSettings({ ...settings, maxPages: parseInt(e.target.value) || 0 })
              }
              className="px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white w-full"
            />
            <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
              Crawl will stop after reaching this limit
            </p>
          </div>

          {/* Follow Robots.txt */}
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-zinc-900 dark:text-white">
                Follow robots.txt
              </label>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                Respect robots.txt rules during crawling
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.followRobots}
              onChange={(e) =>
                setSettings({ ...settings, followRobots: e.target.checked })
              }
              className="w-4 h-4"
            />
          </div>

          {/* Check SSL */}
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-zinc-900 dark:text-white">
                Check SSL Certificate
              </label>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                Validate SSL certificates during crawling
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.checkSSL}
              onChange={(e) =>
                setSettings({ ...settings, checkSSL: e.target.checked })
              }
              className="w-4 h-4"
            />
          </div>

          {/* Track Metrics */}
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-zinc-900 dark:text-white">
                Track Performance Metrics
              </label>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                Collect Core Web Vitals and performance data
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.trackMetrics}
              onChange={(e) =>
                setSettings({ ...settings, trackMetrics: e.target.checked })
              }
              className="w-4 h-4"
            />
          </div>
        </div>
      </div>

      {/* Exclusion Patterns */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-semibold">Exclusion Patterns</h2>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            URLs matching these patterns will be excluded from crawling (e.g., /admin/*, /api/*)
          </p>

          {/* Add Pattern */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newPattern}
              onChange={(e) => setNewPattern(e.target.value)}
              placeholder="e.g., /admin/*, /api/*"
              className="flex-1 px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
            />
            <button
              onClick={handleAddPattern}
              className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Add
            </button>
          </div>

          {/* Patterns List */}
          <div className="space-y-2">
            {settings.excludePatterns?.map((pattern, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700"
              >
                <code className="text-sm text-zinc-900 dark:text-white">{pattern}</code>
                <button
                  onClick={() => handleRemovePattern(index)}
                  className="text-red-600 dark:text-red-400 hover:text-red-700 text-sm font-medium"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Save Settings
        </button>
        {saved && (
          <p className="text-sm text-green-600 dark:text-green-400 py-2">
            ✓ Settings saved successfully
          </p>
        )}
      </div>
    </div>
  );
}
