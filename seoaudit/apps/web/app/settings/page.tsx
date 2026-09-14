'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useI18n, useCurrentLanguage, setLanguage } from '@/lib/i18n/useI18n';
import type { Language } from '@/lib/i18n/ui';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/Card';
import { Button } from '@/components/Button';

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
        window.location.reload();
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  return (
    <div className="min-h-screen bg-base-100">
      <div className="max-w-2xl mx-auto p-4 md:p-8">
        <h1 className="text-4xl font-bold mb-8">{t('userSettings.title')}</h1>

        <div className="space-y-6">
          {/* User Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>{t('common.email')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-base-content/70 mb-1">
                    {t('common.name')}
                  </p>
                  <p className="text-base-content font-medium">
                    {session.user.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-base-content/70 mb-1">
                    {t('common.email')}
                  </p>
                  <p className="text-base-content font-medium">
                    {session.user.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-base-content/70 mb-1">
                    {t('common.organizations')}
                  </p>
                  <p className="text-base-content font-medium">
                    {session.user.organizations?.length || 0}{' '}
                    {t('common.organization')}
                    {(session.user.organizations?.length || 0) !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preferences Card */}
          <Card>
            <CardHeader>
              <CardTitle>
                {t('userSettings.preferences')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Language */}
              <div>
                <label className="block text-sm font-medium text-base-content mb-2">
                  {t('userSettings.language')}
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguageState(e.target.value as Language)}
                  className="select select-bordered w-full"
                >
                  <option value="es">Español</option>
                  <option value="en">English</option>
                </select>
              </div>

              {/* Theme */}
              <div>
                <label className="block text-sm font-medium text-base-content mb-2">
                  {t('userSettings.theme')}
                </label>
                <select
                  value={theme}
                  onChange={(e) =>
                    setTheme(e.target.value as 'light' | 'dark' | 'system')
                  }
                  className="select select-bordered w-full"
                >
                  <option value="system">System</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>

              {/* Email Notifications */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-base-content mb-1">
                    {t('userSettings.emailNotifications')}
                  </label>
                  <p className="text-sm text-base-content/70">
                    {t('common.email')}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                  className="checkbox checkbox-primary"
                />
              </div>

              {/* Weekly Report */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-base-content mb-1">
                    {t('userSettings.weeklyReport')}
                  </label>
                  <p className="text-sm text-base-content/70">
                    {t('common.email')}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={weeklyReport}
                  onChange={(e) => setWeeklyReport(e.target.checked)}
                  className="checkbox checkbox-primary"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <Button variant="primary" onClick={handleSave}>
                {t('userSettings.saveSettings')}
              </Button>
              {saved && (
                <p className="text-sm text-success">
                  ✓ {t('userSettings.saved')}
                </p>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
