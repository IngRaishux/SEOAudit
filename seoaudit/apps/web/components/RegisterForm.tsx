'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Button, Input } from '@seo-optimizer/ui';
import { useI18n, useCurrentLanguage } from '@/lib/i18n/useI18n';
import { toastError } from '@/lib/toast';
import { RiShieldCheckLine, RiGoogleFill } from '@remixicon/react';

export function RegisterForm() {
  const router = useRouter();
  const lang = useCurrentLanguage();
  const { t } = useI18n(lang);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (password !== confirmPassword) {
      toastError(t('validation.required'), t('common.error'));
      return;
    }

    if (password.length < 6) {
      toastError(t('auth.passwordMinLength'), t('common.error'));
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          organizationName: organizationName || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toastError(data.error || t('errors.serverError'), t('common.error'));
        return;
      }

      const signInResult = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (signInResult?.ok) {
        router.push('/organizations');
      } else {
        toastError(t('errors.serverError'), t('common.error'));
      }
    } catch (err) {
      toastError(t('errors.serverError'), t('common.error'));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleSignUp() {
    setIsLoading(true);
    try {
      await signIn('google', { callbackUrl: '/organizations', redirect: true });
    } catch (err) {
      toastError(t('errors.serverError'), t('common.error'));
      console.error(err);
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-zinc-700">
            {t('auth.name')}
          </label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            disabled={isLoading}
            required
          />
        </div>

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
          <label htmlFor="organizationName" className="block text-sm font-medium text-zinc-700">
            {t('common.organization')}{' '}
            <span className="text-zinc-500 text-xs">(optional)</span>
          </label>
          <Input
            id="organizationName"
            type="text"
            value={organizationName}
            onChange={(e) => setOrganizationName(e.target.value)}
            placeholder="My Company"
            disabled={isLoading}
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

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-zinc-700">
            {t('auth.password')} ({t('common.close')})
          </label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            disabled={isLoading}
            required
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full"
          icon={<RiShieldCheckLine className="size-4" />}
        >
          {isLoading ? t('common.loading') : t('auth.signUp')}
        </Button>
      </form>

      <div className="mt-4">
        <Button
          type="button"
          onClick={handleGoogleSignUp}
          disabled={isLoading}
          className="w-full bg-white border border-zinc-300 text-zinc-900 hover:bg-zinc-50"
          icon={<RiGoogleFill className="size-4" />}
        >
          {isLoading ? t('common.loading') : t('auth.continueWithGoogle')}
        </Button>
      </div>

      <p className="mt-6 text-center text-sm text-zinc-600">
        {t('auth.alreadyHaveAccount')}{' '}
        <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700">
          {t('auth.loginHere')}
        </Link>
      </p>
    </div>
  );
}
