'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@seo-optimizer/ui';
import { RiErrorWarningLine, RiGoogleFill, RiShieldCheckLine } from '@remixicon/react';
import { FormField } from '@/components/auth/FormField';
import { validateRegistration, type RegistrationValues } from '@/lib/auth/validation';
import { useI18n, useCurrentLanguage } from '@/lib/i18n/useI18n';

const FIELD_ORDER: (keyof RegistrationValues)[] = ['name', 'email', 'password', 'confirmPassword'];

type Values = RegistrationValues & { organizationName: string };

export function RegisterForm() {
  const router = useRouter();
  const lang = useCurrentLanguage();
  const { t } = useI18n(lang);

  const [values, setValues] = useState<Values>({
    name: '',
    email: '',
    organizationName: '',
    password: '',
    confirmPassword: '',
  });
  // Los errores de campo solo se muestran tras el primer intento de envío; luego se recalculan en vivo
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  // Correo ya registrado según el servidor; se descarta en cuanto el usuario cambia el correo
  const [emailTakenFor, setEmailTakenFor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // Durante la petición los campos están deshabilitados y no aceptan foco: se mueve al terminar
  const focusAfterLoading = useRef<string | null>(null);

  useEffect(() => {
    if (isLoading || !focusAfterLoading.current) return;
    document.getElementById(focusAfterLoading.current)?.focus();
    focusAfterLoading.current = null;
  }, [isLoading]);

  const errors = submitted ? validateRegistration(values) : {};
  const emailError =
    errors.email ?? (emailTakenFor !== null && emailTakenFor === values.email ? 'auth.userAlreadyExists' : undefined);
  const update = (field: keyof Values) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((prev) => ({ ...prev, [field]: e.target.value }));

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
    setFormError(null);
    setEmailTakenFor(null);

    const currentErrors = validateRegistration(values);
    const firstInvalid = FIELD_ORDER.find((field) => currentErrors[field]);
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus();
      return;
    }

    setIsLoading(true);
    try {
      const email = values.email.trim();
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: values.name.trim(),
          email,
          password: values.password,
          organizationName: values.organizationName.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        if (data.code === 'EMAIL_IN_USE') {
          setEmailTakenFor(values.email);
          focusAfterLoading.current = 'email';
        } else {
          setFormError('errors.serverError');
        }
        return;
      }

      const signInResult = await signIn('credentials', { email, password: values.password, redirect: false });
      if (signInResult?.ok && !signInResult.error) {
        router.push('/organizations');
      } else {
        setFormError('errors.serverError');
      }
    } catch (err) {
      console.error(err);
      setFormError('errors.serverError');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleSignUp() {
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
          id="name"
          type="text"
          autoComplete="name"
          label={t('auth.name')}
          placeholder={t('auth.namePlaceholder')}
          value={values.name}
          onChange={update('name')}
          error={errors.name && t(errors.name)}
          disabled={isLoading}
        />
        <FormField
          id="email"
          type="email"
          autoComplete="email"
          label={t('auth.email')}
          placeholder={t('auth.emailPlaceholder')}
          value={values.email}
          onChange={update('email')}
          error={emailError && t(emailError)}
          disabled={isLoading}
        />
        <FormField
          id="organizationName"
          type="text"
          autoComplete="organization"
          label={t('common.organization')}
          optionalLabel={t('auth.optional')}
          placeholder={t('auth.organizationPlaceholder')}
          value={values.organizationName}
          onChange={update('organizationName')}
          disabled={isLoading}
        />
        <FormField
          id="password"
          type="password"
          autoComplete="new-password"
          label={t('auth.password')}
          placeholder="••••••••"
          value={values.password}
          onChange={update('password')}
          error={errors.password && t(errors.password)}
          hint={t('auth.passwordHint')}
          disabled={isLoading}
        />
        <FormField
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          label={t('auth.confirmPassword')}
          placeholder="••••••••"
          value={values.confirmPassword}
          onChange={update('confirmPassword')}
          error={errors.confirmPassword && t(errors.confirmPassword)}
          disabled={isLoading}
        />

        <Button
          type="submit"
          isLoading={isLoading}
          loadingText={t('common.loading')}
          className="w-full mt-2"
          icon={<RiShieldCheckLine className="size-4" aria-hidden="true" />}
        >
          {t('auth.signUp')}
        </Button>
      </form>

      <div className="divider text-sm text-base-content/60 my-0">{t('auth.or')}</div>

      <button type="button" onClick={handleGoogleSignUp} disabled={isLoading} className="btn btn-outline w-full">
        <RiGoogleFill className="size-4" aria-hidden="true" />
        {t('auth.continueWithGoogle')}
      </button>

      <p className="text-center text-sm text-base-content/70">
        {t('auth.alreadyHaveAccount')}{' '}
        <Link href="/login" className="link link-hover font-semibold text-base-content">
          {t('auth.loginHere')}
        </Link>
      </p>
    </div>
  );
}
