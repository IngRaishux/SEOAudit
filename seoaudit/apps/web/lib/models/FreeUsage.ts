import mongoose from 'mongoose';

/** Uso diario de las herramientas gratuitas por visitante (hash de la IP, nunca la IP). */
export interface IFreeUsage {
  visitor: string;
  /** Día UTC 'YYYY-MM-DD'. */
  day: string;
  crawlPages: number;
  suggestions: number;
  /** Mongo borra el documento al pasar esta fecha (índice TTL). */
  expiresAt: Date;
}

const freeUsageSchema = new mongoose.Schema<IFreeUsage>({
  visitor: { type: String, required: true },
  day: { type: String, required: true },
  crawlPages: { type: Number, default: 0 },
  suggestions: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true },
});

freeUsageSchema.index({ visitor: 1, day: 1 }, { unique: true });
freeUsageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default (mongoose.models.FreeUsage as mongoose.Model<IFreeUsage>) ||
  mongoose.model<IFreeUsage>('FreeUsage', freeUsageSchema);
