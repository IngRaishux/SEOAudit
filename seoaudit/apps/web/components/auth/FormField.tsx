import type { ComponentPropsWithoutRef } from 'react';
import { Input } from '@seo-optimizer/ui';

interface FormFieldProps extends Omit<ComponentPropsWithoutRef<typeof Input>, 'id' | 'hasError'> {
  id: string;
  label: string;
  /** Texto ya traducido del error; si existe, sustituye a la ayuda. */
  error?: string;
  hint?: string;
  optionalLabel?: string;
}

/** Campo con etiqueta y mensaje propio debajo (error o ayuda), sin validación nativa del navegador. */
export function FormField({ id, label, error, hint, optionalLabel, className = '', ...inputProps }: FormFieldProps) {
  const messageId = `${id}-message`;
  const message = error ?? hint;

  return (
    <div className="form-control w-full">
      <div className="label pb-1">
        <label htmlFor={id} className="label-text font-medium">
          {label}
        </label>
        {optionalLabel && <span className="label-text-alt text-base-content/60">{optionalLabel}</span>}
      </div>
      <Input
        id={id}
        hasError={Boolean(error)}
        aria-invalid={error ? true : undefined}
        aria-describedby={message ? messageId : undefined}
        // Placeholder atenuado: en tema oscuro se confundía con un valor ya escrito
        className={`placeholder:text-base-content/40 ${className}`.trim()}
        {...inputProps}
      />
      {message && (
        <div className="label pt-1 pb-0">
          <span id={messageId} className={`label-text-alt ${error ? 'text-error' : 'text-base-content/60'}`}>
            {message}
          </span>
        </div>
      )}
    </div>
  );
}
