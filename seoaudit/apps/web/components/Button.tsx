'use client';

import React from 'react';
import { Slot } from '@radix-ui/react-slot';

interface ButtonProps extends React.ComponentPropsWithoutRef<'button'> {
  asChild?: boolean;
  isLoading?: boolean;
  loadingText?: string;
  variant?: 'primary' | 'secondary' | 'light' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
}

const variantMap = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  light: 'btn-ghost btn-outline',
  ghost: 'btn-ghost',
  destructive: 'btn-error',
};

const sizeMap = {
  sm: 'btn-sm',
  md: 'btn-md',
  lg: 'btn-lg',
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      asChild,
      isLoading = false,
      loadingText,
      className = '',
      disabled,
      variant = 'primary',
      size = 'md',
      children,
      ...props
    },
    forwardedRef,
  ) => {
    const Component = asChild ? Slot : 'button';

    const baseClasses = 'btn gap-2';
    const variantClass = variantMap[variant] || variantMap.primary;
    const sizeClass = sizeMap[size] || sizeMap.md;
    const disabledClass = disabled || isLoading ? 'btn-disabled' : '';
    const loadingClass = isLoading ? 'loading' : '';

    const finalClassName = `${baseClasses} ${variantClass} ${sizeClass} ${disabledClass} ${loadingClass} ${className}`.trim();

    return (
      <Component
        ref={forwardedRef}
        className={finalClassName}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <span className="sr-only">
              {loadingText ? loadingText : 'Loading'}
            </span>
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

export { Button, type ButtonProps };
