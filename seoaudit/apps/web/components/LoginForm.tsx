'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useI18n, useCurrentLanguage } from '@/lib/i18n/useI18n';

export function LoginForm() {
  const router = useRouter();
  const lang = useCurrentLanguage();
  const { t } = useI18n(lang);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(t('auth.invalidCredentials'));
      } else if (result?.ok) {
        router.push('/organizations');
      }
    } catch (err) {
      setError(t('errors.serverError'));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setIsLoading(true);
    try {
      await signIn('google', { callbackUrl: '/organizations' });
    } catch (err) {
      setError(t('errors.serverError'));
      console.error(err);
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-zinc-700">
            {t('auth.email')}
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            disabled={isLoading}
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-zinc-700">
            {t('auth.password')}
          </label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            disabled={isLoading}
            required
          />
        </div>

        {error && (
          <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? t('common.loading') : t('auth.signIn')}
        </Button>
      </form>

      <div className="mt-4">
        <Button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full bg-white border border-zinc-300 text-zinc-900 hover:bg-zinc-50"
        >
          {isLoading ? t('common.loading') : t('auth.continueWithGoogle')}
        </Button>
      </div>

      <p className="mt-6 text-center text-sm text-zinc-600">
        {t('auth.dontHaveAccount')}{' '}
        <Link href="/register" className="font-semibold text-blue-600 hover:text-blue-700">
          {t('auth.registerHere')}
        </Link>
      </p>
    </div>
  );
}
