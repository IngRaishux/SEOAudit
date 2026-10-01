'use client';

import React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { RiLoader2Fill } from '@remixicon/react';

import { cx } from '../utils';

type ButtonVariant = 'primary' | 'secondary' | 'light' | 'ghost' | 'destructive' | 'neutral';
type ButtonSize = 'sm' | 'md' | 'lg';

const variantClassMap: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  light: 'btn-outline',
  ghost: 'btn-ghost',
  destructive: 'btn-error',
  neutral: 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-300 dark:hover:bg-zinc-700',
};

const sizeClassMap: Record<ButtonSize, string> = {
  sm: 'btn-sm',
  md: '',
  lg: 'btn-lg',
};

function buttonVariants({
  variant = 'primary',
  size = 'md',
}: { variant?: ButtonVariant; size?: ButtonSize } = {}) {
  return cx('btn', variantClassMap[variant], sizeClassMap[size]);
}

interface ButtonProps extends React.ComponentPropsWithoutRef<'button'> {
  asChild?: boolean;
  isLoading?: boolean;
  loadingText?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      asChild,
      isLoading = false,
      loadingText,
      className,
      disabled,
      variant = 'primary',
      size = 'md',
      icon,
      iconPosition = 'left',
      children,
      ...props
    }: ButtonProps,
    forwardedRef,
  ) => {
    const Component = asChild ? Slot : 'button';

    const content = isLoading ? (
      <>
        <RiLoader2Fill
          className="size-4 shrink-0 animate-spin"
          aria-hidden="true"
        />
        <span className="sr-only">{loadingText ? loadingText : 'Loading'}</span>
        {loadingText ? loadingText : children}
      </>
    ) : icon ? (
      <span className="flex items-center gap-2">
        {iconPosition === 'left' && icon}
        {children}
        {iconPosition === 'right' && icon}
      </span>
    ) : (
      children
    );

    return (
      <Component
        ref={forwardedRef}
        className={cx(buttonVariants({ variant, size }), className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {content}
      </Component>
    );
  },
);

Button.displayName = 'Button';

export { Button, buttonVariants, type ButtonProps, type ButtonVariant, type ButtonSize };
