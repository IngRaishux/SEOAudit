'use client';

import { useRef, useState } from 'react';
import { RiDownloadLine, RiFileExcel2Line, RiFilePdf2Line } from '@remixicon/react';
import type { PageRow } from '@/lib/sitePages/rows';
import type { ExportFormat } from '@/lib/sitePages/export';
import { toastError } from '@/lib/toast';

type Translate = (path: string) => string;

interface ExportPagesMenuProps {
  /** Todas las filas de la vista, no solo las del bloque visible del paginador. */
  rows: PageRow[];
  siteUrl: string;
  lang: 'es' | 'en';
  t: Translate;
}

export function ExportPagesMenu({ rows, siteUrl, lang, t }: ExportPagesMenuProps) {
  const [exporting, setExporting] = useState(false);
  const detailsRef = useRef<HTMLDetailsElement>(null);

  async function handleExport(format: ExportFormat) {
    detailsRef.current?.removeAttribute('open');
    setExporting(true);
    try {
      // El módulo (y con él jsPDF o exceljs) se descarga solo al exportar
      const { exportPages } = await import('@/lib/sitePages/export');
      await exportPages(format, rows, { siteUrl, lang }, t);
    } catch (error) {
      console.error('Export failed:', error);
      toastError(t('siteDetails.export.error'));
    } finally {
      setExporting(false);
    }
  }

  if (exporting) {
    return (
      <button type="button" className="btn btn-sm btn-outline" disabled>
        <span className="loading loading-spinner loading-xs" />
        {t('siteDetails.export.exporting')}
      </button>
    );
  }

  return (
    <details ref={detailsRef} className="dropdown dropdown-end">
      <summary className="btn btn-sm btn-outline">
        <RiDownloadLine className="size-4" />
        {t('siteDetails.export.button')}
      </summary>
      <ul className="dropdown-content menu bg-base-100 rounded-box z-20 w-48 p-2 shadow border border-base-300">
        <li>
          <button type="button" onClick={() => handleExport('pdf')}>
            <RiFilePdf2Line className="size-4" />
            {t('siteDetails.export.pdf')}
          </button>
        </li>
        <li>
          <button type="button" onClick={() => handleExport('xlsx')}>
            <RiFileExcel2Line className="size-4" />
            {t('siteDetails.export.xlsx')}
          </button>
        </li>
      </ul>
    </details>
  );
}
