'use client';

import { RiArrowLeftDoubleLine, RiArrowLeftSLine, RiArrowRightDoubleLine, RiArrowRightSLine } from '@remixicon/react';
import { formatMessage } from '@/lib/i18n/format';
import { PAGE_SIZE_OPTIONS, paginate } from '@/lib/pagination';

type Translate = (path: string) => string;

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: readonly number[];
  t: Translate;
  className?: string;
}

/**
 * Paginador controlado: no conoce las filas, solo el total. Quien lo usa corta los datos con
 * `paginate(page, pageSize, total)` (start/end), así que da igual si vienen del cliente o del servidor.
 */
export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
  t,
  className = '',
}: PaginationProps) {
  const state = paginate(page, pageSize, total);
  const isFirst = state.page <= 1;
  const isLast = state.page >= state.pageCount;
  const single = state.pageCount <= 1;

  return (
    <nav
      aria-label={t('pagination.label')}
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 text-sm ${className}`}
    >
      <div className="flex items-center gap-3 text-base-content/70">
        <span aria-live="polite">
          {formatMessage(t('pagination.range'), { from: state.from, to: state.to, total: state.total })}
        </span>
        <label className="flex items-center gap-2">
          <span>{t('pagination.perPage')}</span>
          <select
            className="select select-bordered select-sm"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="join">
        <button
          type="button"
          className="join-item btn btn-sm"
          onClick={() => onPageChange(1)}
          disabled={single || isFirst}
          aria-label={t('pagination.first')}
          title={t('pagination.first')}
        >
          <RiArrowLeftDoubleLine className="size-4" />
        </button>
        <button
          type="button"
          className="join-item btn btn-sm"
          onClick={() => onPageChange(state.page - 1)}
          disabled={single || isFirst}
          aria-label={t('pagination.previous')}
          title={t('pagination.previous')}
        >
          <RiArrowLeftSLine className="size-4" />
        </button>
        {state.items.map((item, index) =>
          item === 'ellipsis' ? (
            <button key={`ellipsis-${index}`} type="button" className="join-item btn btn-sm btn-disabled" tabIndex={-1}>
              …
            </button>
          ) : (
            <button
              key={item}
              type="button"
              className={`join-item btn btn-sm ${item === state.page ? 'btn-active btn-primary' : ''}`}
              onClick={() => onPageChange(item)}
              disabled={single}
              aria-current={item === state.page ? 'page' : undefined}
              aria-label={formatMessage(t('pagination.goTo'), { page: item })}
            >
              {item}
            </button>
          )
        )}
        <button
          type="button"
          className="join-item btn btn-sm"
          onClick={() => onPageChange(state.page + 1)}
          disabled={single || isLast}
          aria-label={t('pagination.next')}
          title={t('pagination.next')}
        >
          <RiArrowRightSLine className="size-4" />
        </button>
        <button
          type="button"
          className="join-item btn btn-sm"
          onClick={() => onPageChange(state.pageCount)}
          disabled={single || isLast}
          aria-label={t('pagination.last')}
          title={t('pagination.last')}
        >
          <RiArrowRightDoubleLine className="size-4" />
        </button>
      </div>
    </nav>
  );
}
