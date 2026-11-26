import { RiSearchLine } from '@remixicon/react';
import { BRAND_NAME } from '@/lib/brand';

type BrandLogoProps = {
  className?: string;
  iconClassName?: string;
  /** Oculta el texto por debajo de `sm` y deja solo el icono. */
  compact?: boolean;
};

/**
 * Logo de la marca: icono + nombre. La lupa es provisional hasta tener el SVG del cangrejo;
 * al cambiarla aquí cambian la cabecera y el pie a la vez.
 */
export function BrandLogo({ className = '', iconClassName = 'text-xl', compact = false }: BrandLogoProps) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <RiSearchLine className={iconClassName} aria-hidden="true" />
      <span className={compact ? 'hidden sm:inline' : undefined}>{BRAND_NAME}</span>
    </span>
  );
}
