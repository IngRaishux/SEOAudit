import { describe, expect, it } from 'vitest';
import { remaining, resetsAt, utcDay } from './quota';

describe('cupo diario UTC', () => {
  it('el día es el UTC, no el local', () => {
    expect(utcDay(new Date('2026-11-10T23:59:59.999Z'))).toBe('2026-11-10');
    expect(utcDay(new Date('2026-11-11T00:00:00.000Z'))).toBe('2026-11-11');
    // 18:30 en México (UTC-6) del día 10 ya es día 11 en UTC
    expect(utcDay(new Date('2026-11-10T18:30:00-06:00'))).toBe('2026-11-11');
  });

  it('se renueva a la siguiente medianoche UTC, también a fin de mes y de año', () => {
    expect(resetsAt(new Date('2026-11-10T15:00:00Z')).toISOString()).toBe('2026-11-11T00:00:00.000Z');
    expect(resetsAt(new Date('2026-11-30T23:00:00Z')).toISOString()).toBe('2026-12-01T00:00:00.000Z');
    expect(resetsAt(new Date('2026-12-31T23:59:00Z')).toISOString()).toBe('2027-01-01T00:00:00.000Z');
  });

  it('lo restante nunca es negativo', () => {
    expect(remaining(0, 20)).toBe(20);
    expect(remaining(12, 20)).toBe(8);
    expect(remaining(25, 20)).toBe(0);
    expect(remaining(-3, 20)).toBe(20);
  });
});
