'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useI18n, useCurrentLanguage, setLanguage } from '@/lib/i18n/useI18n';
import type { Language } from '@/lib/i18n/ui';

export default function UserSettingsPage() {
  const { data: session } = useSession();
  const currentLang = useCurrentLanguage();
  const { t } = useI18n(currentLang);

  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [language, setLanguageState] = useState<Language>(currentLang);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLanguageState(currentLang);
  }, [currentLang]);

  if (!session?.user) {
    redirect('/login');
  }

  const handleSave = async () => {
    try {
      // Guardar idioma
      setLanguage(language);

      const res = await fetch('/api/user/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme,
          language,
          emailNotifications,
          weeklyReport,
        }),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        // Recargar la página para aplicar el idioma
        window.location.reload();
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="max-w-2xl mx-auto p-8">
        <h1 className="text-4xl font-bold mb-8">{t('userSettings.title')}</h1>

        <div className="space-y-6">
          {/* User Information */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-xl font-semibold">{t('common.email')}</h2>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                    {t('common.name')}
                  </p>
                  <p className="text-zinc-900 dark:text-white font-medium">
                    {session.user.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                    {t('common.email')}
                  </p>
                  <p className="text-zinc-900 dark:text-white font-medium">
                    {session.user.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                    {t('common.organizations')}
                  </p>
                  <p className="text-zinc-900 dark:text-white font-medium">
                    {session.user.organizations?.length || 0}{' '}
                    {t('common.organization')}
                    {(session.user.organizations?.length || 0) !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-xl font-semibold">
                {t('userSettings.preferences')}
              </h2>
            </div>

            <div className="p-6 space-y-6">
              {/* Language */}
              <div>
                <label className="block text-sm font-medium text-zinc-900 dark:text-white mb-2">
                  {t('userSettings.language')}
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguageState(e.target.value as Language)}
                  className="px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                >
                  <option value="es">Español</option>
                  <option value="en">English</option>
                </select>
              </div>

              {/* Theme */}
              <div>
                <label className="block text-sm font-medium text-zinc-900 dark:text-white mb-2">
                  {t('userSettings.theme')}
                </label>
                <select
                  value={theme}
                  onChange={(e) =>
                    setTheme(e.target.value as 'light' | 'dark' | 'system')
                  }
                  className="px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                >
                  <option value="system">System</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>

              {/* Email Notifications */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-zinc-900 dark:text-white mb-1">
                    {t('userSettings.emailNotifications')}
                  </label>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {t('common.email')}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                  className="w-4 h-4"
                />
              </div>

              {/* Weekly Report */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-zinc-900 dark:text-white mb-1">
                    {t('userSettings.weeklyReport')}
                  </label>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {t('common.email')}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={weeklyReport}
                  onChange={(e) => setWeeklyReport(e.target.checked)}
                  className="w-4 h-4"
                />
              </div>

              {/* Save Button */}
              <div className="pt-4">
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  {t('userSettings.saveSettings')}
                </button>
                {saved && (
                  <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                    ✓ {t('userSettings.saved')}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
