import { describe, expect, it } from 'vitest';
import { pageItems, paginate } from './pagination';

describe('paginate', () => {
  it('sin filas: una sola página vacía', () => {
    expect(paginate(1, 10, 0)).toMatchObject({ page: 1, pageCount: 1, start: 0, end: 0, from: 0, to: 0, total: 0 });
  });

  it('menos filas que el tamaño de página', () => {
    expect(paginate(1, 10, 8)).toMatchObject({ page: 1, pageCount: 1, start: 0, end: 8, from: 1, to: 8 });
  });

  it('37 filas de 10 en 10', () => {
    expect(paginate(1, 10, 37)).toMatchObject({ pageCount: 4, from: 1, to: 10 });
    expect(paginate(2, 10, 37)).toMatchObject({ start: 10, end: 20, from: 11, to: 20 });
    expect(paginate(4, 10, 37)).toMatchObject({ start: 30, end: 37, from: 31, to: 37 });
  });

  it('100 filas con distintos tamaños', () => {
    expect(paginate(1, 25, 100).pageCount).toBe(4);
    expect(paginate(2, 50, 100)).toMatchObject({ pageCount: 2, from: 51, to: 100 });
  });

  it('página fuera de rango se ajusta a la última o a la primera', () => {
    expect(paginate(9, 10, 37).page).toBe(4);
    expect(paginate(0, 10, 37).page).toBe(1);
    expect(paginate(-3, 10, 37).page).toBe(1);
  });

  it('al subir el tamaño, una página que ya no existe se ajusta', () => {
    // estaba en la página 4 de 10 en 10; con 25 por página solo hay 2
    expect(paginate(4, 25, 37)).toMatchObject({ page: 2, from: 26, to: 37 });
  });
});

describe('pageItems', () => {
  it('pocas páginas: todas, sin elipsis', () => {
    expect(pageItems(1, 1)).toEqual([1]);
    expect(pageItems(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('10 páginas en medio: elipsis a ambos lados', () => {
    expect(pageItems(5, 10)).toEqual([1, 'ellipsis', 4, 5, 6, 'ellipsis', 10]);
  });

  it('10 páginas cerca del inicio o del final: una sola elipsis', () => {
    expect(pageItems(1, 10)).toEqual([1, 2, 3, 4, 5, 'ellipsis', 10]);
    expect(pageItems(3, 10)).toEqual([1, 2, 3, 4, 5, 'ellipsis', 10]);
    expect(pageItems(10, 10)).toEqual([1, 'ellipsis', 6, 7, 8, 9, 10]);
    expect(pageItems(8, 10)).toEqual([1, 'ellipsis', 6, 7, 8, 9, 10]);
  });

  it('siempre 7 elementos o menos y siempre incluye la actual, la primera y la última', () => {
    for (let count = 1; count <= 20; count++) {
      for (let page = 1; page <= count; page++) {
        const items = pageItems(page, count);
        expect(items.length).toBeLessThanOrEqual(7);
        expect(items).toContain(page);
        expect(items[0]).toBe(1);
        expect(items[items.length - 1]).toBe(count);
      }
    }
  });
});
