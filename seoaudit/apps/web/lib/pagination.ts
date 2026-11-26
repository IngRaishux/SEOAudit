export const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
export const DEFAULT_PAGE_SIZE = PAGE_SIZE_OPTIONS[0];

/** Elemento de la lista de números del paginador: un número de página o una elipsis. */
export type PageItem = number | 'ellipsis';

export interface PaginationState {
  /** Página actual (base 1), ajustada a [1, pageCount]. */
  page: number;
  pageCount: number;
  /** Índice (base 0) de la primera fila visible; usar con `slice(start, end)`. */
  start: number;
  /** Índice (base 0) exclusivo de la última fila visible. */
  end: number;
  /** Rango para mostrar "from–to de total" (base 1); from = 0 cuando no hay filas. */
  from: number;
  to: number;
  total: number;
  items: PageItem[];
}

/**
 * Calcula el estado del paginador. La página se ajusta al rango válido, así que si el total baja
 * o cambia el tamaño, el resultado nunca apunta a una página vacía.
 */
export function paginate(page: number, pageSize: number, total: number): PaginationState {
  const size = Math.max(1, Math.floor(pageSize));
  const safeTotal = Math.max(0, Math.floor(total));
  const pageCount = Math.max(1, Math.ceil(safeTotal / size));
  const current = Math.min(Math.max(1, Math.floor(page) || 1), pageCount);
  const start = (current - 1) * size;
  const end = Math.min(start + size, safeTotal);
  return {
    page: current,
    pageCount,
    start,
    end,
    from: safeTotal === 0 ? 0 : start + 1,
    to: end,
    total: safeTotal,
    items: pageItems(current, pageCount),
  };
}

/**
 * Números de página a mostrar: todos si son pocos; si no, la primera, la última y la actual con sus
 * vecinas, con elipsis en los huecos (1 … 4 5 6 … 10).
 */
export function pageItems(page: number, pageCount: number, siblings = 1): PageItem[] {
  // primera + última + actual + vecinas + 2 elipsis
  const maxSlots = siblings * 2 + 5;
  if (pageCount <= maxSlots) return Array.from({ length: pageCount }, (_, i) => i + 1);

  const left = Math.max(page - siblings, 2);
  const right = Math.min(page + siblings, pageCount - 1);
  // Cerca de un extremo se muestran más números en lugar de una elipsis que ocultaría uno solo
  const showLeftEllipsis = left > 3;
  const showRightEllipsis = right < pageCount - 2;

  if (!showLeftEllipsis) {
    const count = siblings * 2 + 3;
    return [...Array.from({ length: count }, (_, i) => i + 1), 'ellipsis', pageCount];
  }
  if (!showRightEllipsis) {
    const count = siblings * 2 + 3;
    return [1, 'ellipsis', ...Array.from({ length: count }, (_, i) => pageCount - count + 1 + i)];
  }
  return [1, 'ellipsis', ...Array.from({ length: right - left + 1 }, (_, i) => left + i), 'ellipsis', pageCount];
}
