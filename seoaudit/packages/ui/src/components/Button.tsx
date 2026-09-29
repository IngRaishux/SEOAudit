'use client';

import React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { RiLoader2Fill } from '@remixicon/react';

import { cx } from '../utils';

type ButtonVariant = 'primary' | 'secondary' | 'light' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';

const variantClassMap: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  light: 'btn-outline',
  ghost: 'btn-ghost',
  destructive: 'btn-error',
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
      children,
      ...props
    }: ButtonProps,
    forwardedRef,
  ) => {
    const Component = asChild ? Slot : 'button';

    return (
      <Component
        ref={forwardedRef}
        className={cx(buttonVariants({ variant, size }), className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <RiLoader2Fill
              className="size-4 shrink-0 animate-spin"
              aria-hidden="true"
            />
            <span className="sr-only">{loadingText ? loadingText : 'Loading'}</span>
            {loadingText ? loadingText : children}
          </>
        ) : (
          children
        )}
      </Component>
    );
  },
);

Button.displayName = 'Button';

export { Button, buttonVariants, type ButtonProps, type ButtonVariant, type ButtonSize };
