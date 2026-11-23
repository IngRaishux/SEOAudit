'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@seo-optimizer/ui';
import { RiErrorWarningLine, RiGoogleFill, RiLoginBoxLine } from '@remixicon/react';
import { FormField } from '@/components/auth/FormField';
import { validateLogin, type LoginValues } from '@/lib/auth/validation';
import { useI18n, useCurrentLanguage } from '@/lib/i18n/useI18n';

const FIELD_ORDER: (keyof LoginValues)[] = ['email', 'password'];

export function LoginForm() {
  const router = useRouter();
  const lang = useCurrentLanguage();
  const { t } = useI18n(lang);

  const [values, setValues] = useState<LoginValues>({ email: '', password: '' });
  // Los errores de campo solo se muestran tras el primer intento de envío; luego se recalculan en vivo
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const errors = submitted ? validateLogin(values) : {};
  const update = (field: keyof LoginValues) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((prev) => ({ ...prev, [field]: e.target.value }));

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
    setFormError(null);

    const currentErrors = validateLogin(values);
    const firstInvalid = FIELD_ORDER.find((field) => currentErrors[field]);
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus();
      return;
    }

    setIsLoading(true);
    try {
      const result = await signIn('credentials', {
        email: values.email.trim(),
        password: values.password,
        redirect: false,
      });

      if (result?.ok && !result.error) {
        router.push('/organizations');
        return;
      }
      setFormError(result?.error ? 'auth.invalidCredentials' : 'errors.serverError');
    } catch (err) {
      console.error(err);
      setFormError('errors.serverError');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setIsLoading(true);
    try {
      await signIn('google', { callbackUrl: '/organizations', redirect: true });
    } catch (err) {
      console.error(err);
      setFormError('errors.serverError');
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      {formError && (
        <div role="alert" className="alert alert-error text-sm py-3">
          <RiErrorWarningLine className="size-5" aria-hidden="true" />
          <span>{t(formError)}</span>
        </div>
      )}

      {/* noValidate: la validación y sus mensajes son de la aplicación, iguales en todos los navegadores */}
      <form noValidate onSubmit={handleSubmit} className="space-y-3">
        <FormField
          id="email"
          type="email"
          autoComplete="email"
          label={t('auth.email')}
          placeholder={t('auth.emailPlaceholder')}
          value={values.email}
          onChange={update('email')}
          error={errors.email && t(errors.email)}
          disabled={isLoading}
        />
        <FormField
          id="password"
          type="password"
          autoComplete="current-password"
          label={t('auth.password')}
          placeholder="••••••••"
          value={values.password}
          onChange={update('password')}
          error={errors.password && t(errors.password)}
          disabled={isLoading}
        />

        <Button
          type="submit"
          isLoading={isLoading}
          loadingText={t('common.loading')}
          className="w-full mt-2"
          icon={<RiLoginBoxLine className="size-4" aria-hidden="true" />}
        >
          {t('auth.signIn')}
        </Button>
      </form>

      <div className="divider text-sm text-base-content/60 my-0">{t('auth.or')}</div>

      <button type="button" onClick={handleGoogleSignIn} disabled={isLoading} className="btn btn-outline w-full">
        <RiGoogleFill className="size-4" aria-hidden="true" />
        {t('auth.continueWithGoogle')}
      </button>

      <p className="text-center text-sm text-base-content/70">
        {t('auth.dontHaveAccount')}{' '}
        <Link href="/register" className="link link-hover font-semibold text-base-content">
          {t('auth.registerHere')}
        </Link>
      </p>
    </div>
  );
}
