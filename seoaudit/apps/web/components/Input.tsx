'use client';

import React from 'react';
import { RiEyeFill, RiEyeOffFill, RiSearchLine } from '@remixicon/react';

interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  hasError?: boolean;
  enableStepper?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'input-sm',
  md: 'input-md',
  lg: 'input-lg',
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className = '',
      hasError = false,
      enableStepper = true,
      type,
      size = 'md',
      ...props
    },
    forwardedRef,
  ) => {
    const [typeState, setTypeState] = React.useState(type);

    const isPassword = type === 'password';
    const isSearch = type === 'search';

    const baseClasses = 'input input-bordered w-full';
    const sizeClass = sizeMap[size] || sizeMap.md;
    const errorClass = hasError ? 'input-error' : '';
    const disableStepper = enableStepper
      ? ''
      : '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none';

    const finalClassName = `${baseClasses} ${sizeClass} ${errorClass} ${disableStepper} ${className}`.trim();

    return (
      <div className="relative w-full">
        <input
          ref={forwardedRef}
          type={isPassword ? typeState : type}
          className={finalClassName}
          {...props}
        />

        {isSearch && (
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
            <RiSearchLine
              className="size-5"
              aria-hidden="true"
            />
          </div>
        )}

        {isPassword && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <button
              aria-label="Toggle password visibility"
              className="btn btn-ghost btn-sm btn-circle"
              type="button"
              onClick={() => {
                setTypeState(typeState === 'password' ? 'text' : 'password');
              }}
              tabIndex={-1}
            >
              <span className="sr-only">
                {typeState === 'password' ? 'Show password' : 'Hide password'}
              </span>
              {typeState === 'password' ? (
                <RiEyeFill aria-hidden="true" className="size-5" />
              ) : (
                <RiEyeOffFill aria-hidden="true" className="size-5" />
              )}
            </button>
          </div>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';

export { Input, type InputProps };
