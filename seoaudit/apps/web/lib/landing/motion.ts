/** Valor final de un contador: solo si el texto son dígitos ("7"); null si no se debe contar ("JSON-LD"). */
export function parseCountTarget(text: string | null | undefined): number | null {
  if (!text || !/^\d+$/.test(text)) return null;
  return Number(text);
}
