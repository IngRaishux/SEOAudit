// Tremor Input [v2.0.0]
"use client"
import React from "react"
import { RiEyeFill, RiEyeOffFill, RiSearchLine } from "@remixicon/react"
import { tv, type VariantProps } from "tailwind-variants"

import { cx, focusInput, focusRing, hasErrorInput } from "../utils"

const inputStyles = tv({
  base: [
    // base
    "relative block w-full appearance-none rounded-md border px-2.5 py-2 shadow-xs outline-hidden transition sm:text-sm",
    // border color
    "border-gray-300 dark:border-gray-800",
    // text color
    "text-gray-900 dark:text-gray-50",
    // placeholder color
    "placeholder-gray-400 dark:placeholder-gray-500",
    // background color
    "bg-white dark:bg-gray-950",
    // disabled
    "disabled:border-gray-300 disabled:bg-gray-100 disabled:text-gray-400",
    "dark:disabled:border-gray-700 dark:disabled:bg-gray-800 dark:disabled:text-gray-500",
    // file
    [
      "file:-my-2 file:-ml-2.5 file:cursor-pointer file:rounded-l-[5px] file:rounded-r-none file:border-0 file:px-3 file:py-2 file:outline-hidden focus:outline-hidden disabled:pointer-events-none file:disabled:pointer-events-none",
      "file:border-solid file:border-gray-300 file:bg-gray-50 file:text-gray-500 file:hover:bg-gray-100 dark:file:border-gray-800 dark:file:bg-gray-950 dark:file:hover:bg-gray-900/20 dark:file:disabled:border-gray-700",
      "file:[border-inline-end-width:1px] file:[margin-inline-end:0.75rem]",
      "file:disabled:bg-gray-100 file:disabled:text-gray-500 dark:file:disabled:bg-gray-800",
    ],
    // focus
    focusInput,
    // invalid (optional)
    // "dark:aria-invalid:ring-red-400/20 aria-invalid:ring-2 aria-invalid:ring-red-200 aria-invalid:border-red-500 invalid:ring-2 invalid:ring-red-200 invalid:border-red-500"
    // remove search cancel button (optional)
    "[&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden",
  ],
  variants: {
    hasError: {
      true: hasErrorInput,
    },
    // number input
    enableStepper: {
      false:
        "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
    },
  },
})

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

export { Input, inputStyles, type InputProps }
