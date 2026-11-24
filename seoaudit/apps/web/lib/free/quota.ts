/** Día natural UTC del cupo: 'YYYY-MM-DD'. */
export function utcDay(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** Momento en que se renueva el cupo: la siguiente medianoche UTC. */
export function resetsAt(now: Date = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
}

/** Lo que queda de un cupo, nunca negativo. */
export function remaining(used: number, limit: number): number {
  return Math.max(0, limit - Math.max(0, used));
}
