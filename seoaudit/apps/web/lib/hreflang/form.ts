import type { HreflangAlternate } from './review';

/** Claves de idioma del formulario de sugerencias (formato de exportación DynamoDB). */
export const FORM_LANGUAGES = ['en-US', 'es-MX', 'x-default'] as const;
export type FormLanguage = (typeof FORM_LANGUAGES)[number];

/**
 * URLs detectadas para cada idioma del formulario: primero el código exacto (sin distinguir
 * mayúsculas) y, si no existe, el primer alterno del mismo idioma (en, en-GB -> en-US).
 */
export function alternatesToForm(alternates: HreflangAlternate[] | undefined): Partial<Record<FormLanguage, string>> {
  const result: Partial<Record<FormLanguage, string>> = {};
  if (!alternates?.length) return result;

  for (const formCode of FORM_LANGUAGES) {
    const exact = alternates.find((a) => a.hreflang.toLowerCase() === formCode.toLowerCase());
    if (exact) {
      result[formCode] = exact.href;
      continue;
    }
    if (formCode === 'x-default') continue;
    const language = formCode.split('-')[0];
    const sameLanguage = alternates.find((a) => a.hreflang.toLowerCase().split('-')[0] === language);
    if (sameLanguage) result[formCode] = sameLanguage.href;
  }
  return result;
}

interface WithAlternateLanguages {
  alternateLanguages: { M: Record<string, { S: string }> };
}

/**
 * Sobrescribe en una sugerencia (formato DynamoDB) los idiomas detectados en la página:
 * son datos reales del sitio y prevalecen sobre lo que proponga la IA.
 */
export function applyDetectedAlternates<T extends WithAlternateLanguages>(
  suggestion: T,
  alternates: HreflangAlternate[] | undefined
): T {
  const detected = alternatesToForm(alternates);
  if (Object.keys(detected).length === 0) return suggestion;
  const languages = { ...suggestion.alternateLanguages.M };
  for (const [code, href] of Object.entries(detected)) languages[code] = { S: href };
  return { ...suggestion, alternateLanguages: { ...suggestion.alternateLanguages, M: languages } };
}
