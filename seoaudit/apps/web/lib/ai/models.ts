/**
 * Cadena de modelos de Gemini con respaldo: si el modelo principal está saturado (503),
 * sin cuota (429), caído (500/504) o ya no existe (404), se intenta con el siguiente.
 */

/** Orden por defecto: el primero es el principal y los demás son respaldo. */
export const DEFAULT_MODELS = ['gemini-3.6-flash', 'gemini-3.5-flash-lite'] as const;

/** Espera entre vueltas completas a la cadena cuando todos los modelos fallaron. */
const ROUND_DELAYS_MS = [2_000];

/** El proveedor no pudo atender con ningún modelo; las rutas responden 503 con este mensaje. */
export class ModelUnavailableError extends Error {
  constructor(public readonly reason: 'overloaded' | 'quota') {
    super(
      reason === 'quota'
        ? 'Se agotó la cuota del modelo de IA. Intenta de nuevo más tarde.'
        : 'El modelo de IA está saturado en este momento. Intenta de nuevo en unos minutos.'
    );
    this.name = 'ModelUnavailableError';
  }
}

/**
 * Modelos a usar, en orden. `GEMINI_MODELS` permite cambiarlos sin desplegar código,
 * por ejemplo `GEMINI_MODELS=gemini-3.6-flash,gemini-3.5-flash`.
 */
export function modelChain(env: Record<string, string | undefined> = process.env): string[] {
  const configured = (env.GEMINI_MODELS ?? '')
    .split(',')
    .map((model) => model.trim())
    .filter(Boolean);
  return configured.length > 0 ? [...new Set(configured)] : [...DEFAULT_MODELS];
}

export function providerStatus(error: unknown): number | null {
  const status = (error as { status?: unknown })?.status;
  if (typeof status === 'number') return status;
  const match = error instanceof Error ? error.message.match(/"code":\s*(\d{3})/) : null;
  return match ? Number(match[1]) : null;
}

/** Fallos del proveedor que otro modelo puede resolver. Un 400 (prompt inválido) no. */
const FALLBACK_STATUSES = new Set([404, 429, 500, 503, 504]);

const isTimeout = (error: unknown) =>
  error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError');

/**
 * Ejecuta `call` con cada modelo de la cadena hasta que uno responda. Si todos fallan por
 * causas del proveedor, espera y da otra vuelta; al final lanza ModelUnavailableError.
 * Cualquier otro error (respuesta inválida, 400) se propaga sin probar otro modelo.
 *
 * Con `fallbackOnTimeout` un modelo que no respondió a tiempo también cede al siguiente
 * (un modelo saturado a veces responde lento en vez de dar 503). Tras un timeout no se da
 * otra vuelta: ya se consumió buena parte del tiempo de la función.
 */
export async function withModelFallback<T>(
  call: (model: string) => Promise<T>,
  {
    models = modelChain(),
    delays = ROUND_DELAYS_MS,
    fallbackOnTimeout = false,
  }: { models?: string[]; delays?: number[]; fallbackOnTimeout?: boolean } = {}
): Promise<T> {
  for (let round = 0; ; round++) {
    let allQuota = true;
    let timedOut = false;
    for (const model of models) {
      try {
        return await call(model);
      } catch (error) {
        const status = providerStatus(error);
        if (fallbackOnTimeout && isTimeout(error)) {
          timedOut = true;
          allQuota = false;
          console.warn(`Modelo ${model} no respondió a tiempo; probando el siguiente`);
          continue;
        }
        if (status === null || !FALLBACK_STATUSES.has(status)) throw error;
        if (status !== 429) allQuota = false;
        console.warn(`Modelo ${model} no disponible (${status}); probando el siguiente`);
      }
    }
    // Sin cuota en todos los modelos: esperar unos segundos no lo arregla
    if (allQuota) throw new ModelUnavailableError('quota');
    if (timedOut || round >= delays.length) throw new ModelUnavailableError('overloaded');
    await new Promise((resolve) => setTimeout(resolve, delays[round]));
  }
}
