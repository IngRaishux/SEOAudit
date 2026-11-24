import connectMongoose from '@/lib/db/mongoose';
import FreeUsage from '@/lib/models/FreeUsage';
import { FREE_LIMITS } from '@/lib/free/config';

const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export interface FreeUsageCounts {
  crawlPages: number;
  suggestions: number;
}

function isDuplicateKey(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: number }).code === 11000;
}

/** Documento del día, creado si no existe. Dos creaciones simultáneas no fallan: se relee. */
async function ensureUsage(visitor: string, day: string) {
  await connectMongoose();
  for (let attempt = 0; ; attempt++) {
    try {
      return await FreeUsage.findOneAndUpdate(
        { visitor, day },
        { $setOnInsert: { crawlPages: 0, suggestions: 0, expiresAt: new Date(Date.parse(day) + TWO_DAYS_MS) } },
        { upsert: true, new: true },
      ).lean();
    } catch (error) {
      if (!isDuplicateKey(error) || attempt >= MAX_ATTEMPTS) throw error;
    }
  }
}

export async function getUsage(visitor: string, day: string): Promise<FreeUsageCounts> {
  await connectMongoose();
  const usage = await FreeUsage.findOne({ visitor, day }).lean();
  return { crawlPages: usage?.crawlPages ?? 0, suggestions: usage?.suggestions ?? 0 };
}

/**
 * Reserva todas las páginas de rastreo que le quedan al visitante y devuelve cuántas.
 * Compare-and-swap sobre el valor leído: dos reservas simultáneas no pueden pasar del límite.
 */
export async function reserveCrawl(visitor: string, day: string, limit: number = FREE_LIMITS.crawlPages): Promise<number> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const usage = await ensureUsage(visitor, day);
    const used = usage?.crawlPages ?? 0;
    const available = limit - used;
    if (available <= 0) return 0;
    const updated = await FreeUsage.findOneAndUpdate(
      { visitor, day, crawlPages: used },
      { $inc: { crawlPages: available } },
      { new: true },
    ).lean();
    if (updated) return available;
  }
  return 0;
}

/** Devuelve las páginas reservadas que no se llegaron a rastrear. */
export async function settleCrawl(visitor: string, day: string, unused: number): Promise<void> {
  if (unused <= 0) return;
  await connectMongoose();
  await FreeUsage.updateOne({ visitor, day }, { $inc: { crawlPages: -unused } });
}

/** Reserva una sugerencia si queda cupo; false si está agotado. */
export async function reserveSuggestion(visitor: string, day: string, limit: number = FREE_LIMITS.suggestions): Promise<boolean> {
  await ensureUsage(visitor, day);
  const updated = await FreeUsage.findOneAndUpdate(
    { visitor, day, suggestions: { $lt: limit } },
    { $inc: { suggestions: 1 } },
    { new: true },
  ).lean();
  return updated !== null;
}

/** Devuelve una sugerencia reservada cuya generación falló. */
export async function releaseSuggestion(visitor: string, day: string): Promise<void> {
  await connectMongoose();
  await FreeUsage.updateOne({ visitor, day, suggestions: { $gt: 0 } }, { $inc: { suggestions: -1 } });
}
