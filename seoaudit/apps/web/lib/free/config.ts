/** Límites diarios por visitante de las herramientas gratuitas. */
export const FREE_LIMITS = { crawlPages: 20, suggestions: 20 } as const;

/** Solo se activan con FREE_TOOLS_ENABLED=true: cualquier otro valor (o ninguno) las apaga. */
export function freeToolsEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return env.FREE_TOOLS_ENABLED === 'true';
}

export function turnstileSiteKey(env: Record<string, string | undefined> = process.env): string | null {
  return env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || null;
}
