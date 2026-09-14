'use client';

import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outlined' | 'filled';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
}

const variantMap = {
  default: 'bg-base-100 border border-base-300',
  outlined: 'bg-transparent border border-base-300',
  filled: 'bg-base-200',
};

const shadowMap = {
  none: 'shadow-none',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
};

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    { className = '', variant = 'default', shadow = 'md', ...props },
    forwardedRef,
  ) => {
    const variantClass = variantMap[variant];
    const shadowClass = shadowMap[shadow];
    const baseClasses = 'card rounded-lg p-6';

    const finalClassName = `${baseClasses} ${variantClass} ${shadowClass} ${className}`.trim();

    return <div ref={forwardedRef} className={finalClassName} {...props} />;
  },
);

Card.displayName = 'Card';

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className = '', ...props }, forwardedRef) => (
    <div
      ref={forwardedRef}
      className={`mb-4 pb-4 border-b border-base-300 ${className}`.trim()}
      {...props}
    />
  ),
);

CardHeader.displayName = 'CardHeader';

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className = '', ...props }, forwardedRef) => (
    <h2
      ref={forwardedRef}
      className={`text-xl font-semibold text-base-content ${className}`.trim()}
      {...props}
    />
  ),
);

CardTitle.displayName = 'CardTitle';

interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  CardDescriptionProps
>(({ className = '', ...props }, forwardedRef) => (
  <p
    ref={forwardedRef}
    className={`text-sm text-base-content/70 ${className}`.trim()}
    {...props}
  />
));

CardDescription.displayName = 'CardDescription';

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className = '', ...props }, forwardedRef) => (
    <div ref={forwardedRef} className={`${className}`.trim()} {...props} />
  ),
);

CardContent.displayName = 'CardContent';

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className = '', ...props }, forwardedRef) => (
    <div
      ref={forwardedRef}
      className={`mt-4 flex gap-2 pt-4 border-t border-base-300 ${className}`.trim()}
      {...props}
    />
  ),
);

CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
export type { CardProps, CardHeaderProps, CardTitleProps, CardDescriptionProps, CardContentProps, CardFooterProps };
