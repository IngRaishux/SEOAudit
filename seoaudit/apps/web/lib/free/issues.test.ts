import { describe, expect, it } from 'vitest';
import { pageIssues } from './issues';

const ok = {
  statusCode: 200,
  title: 'Hotel frente al mar en Acapulco con alberca y desayuno', // 55
  description: 'Habitaciones con vista a la bahía, alberca infinita y desayuno incluido a pasos de la playa. Reserva directo y obtén la mejor tarifa.', // ~135
  h1: ['Hotel Brisa Marina'],
};

describe('pageIssues', () => {
  it('una página correcta no tiene problemas', () => {
    expect(pageIssues(ok)).toEqual([]);
  });

  it('sin title, sin description y sin H1 (los vacíos cuentan como ausentes)', () => {
    expect(pageIssues({ ...ok, title: null, description: '  ', h1: [' '] })).toEqual(['missing-title', 'missing-description', 'missing-h1']);
  });

  it('longitudes fuera del rango de la vista previa SERP', () => {
    expect(pageIssues({ ...ok, title: 'Inicio' })).toEqual(['title-length']);
    expect(pageIssues({ ...ok, title: 'x'.repeat(71) })).toEqual(['title-length']);
    expect(pageIssues({ ...ok, description: 'Corta.' })).toEqual(['description-length']);
    expect(pageIssues({ ...ok, description: 'x'.repeat(171) })).toEqual(['description-length']);
  });

  it('varios H1 y estado distinto de 200', () => {
    expect(pageIssues({ ...ok, h1: ['Uno', 'Dos'] })).toEqual(['multiple-h1']);
    expect(pageIssues({ ...ok, statusCode: 404 })).toEqual(['status']);
  });

  it('caso de la spec: sin description y con dos H1', () => {
    expect(pageIssues({ ...ok, description: null, h1: ['A', 'B'] })).toEqual(['missing-description', 'multiple-h1']);
  });
});
