import type { PageRow, StatusTone } from './rows';

type Translate = (path: string) => string;

export type ExportFormat = 'pdf' | 'xlsx';

export interface ExportMeta {
  siteUrl: string;
  lang: 'es' | 'en';
  /** Fecha de exportación; se inyecta para poder probar el nombre del archivo. */
  date?: Date;
}

/** Columnas exportadas, en el orden de la tabla y sin la columna Acción. */
export const EXPORT_COLUMNS = ['url', 'title', 'description', 'languages', 'headings', 'status'] as const;
export type ExportColumn = (typeof EXPORT_COLUMNS)[number];

const HEADER_KEYS: Record<ExportColumn, string> = {
  url: 'common.url',
  title: 'siteDetails.pageTitle',
  description: 'siteDetails.description',
  languages: 'siteDetails.hreflang.column',
  headings: 'pages.headings',
  status: 'common.status',
};

export function exportHeaders(t: Translate): string[] {
  return EXPORT_COLUMNS.map((column) => t(HEADER_KEYS[column]));
}

/** Celdas de texto de una fila, en el orden de EXPORT_COLUMNS. */
export function exportCells(row: PageRow): string[] {
  return [
    row.url,
    row.title ?? '—',
    row.description ?? '—',
    row.languagesText,
    row.headingsCount > 0 ? String(row.headingsCount) : '—',
    row.statusCode !== null ? String(row.statusCode) : '—',
  ];
}

function localDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function siteHost(siteUrl: string): string {
  try {
    return new URL(siteUrl).hostname.replace(/^www\./, '');
  } catch {
    return siteUrl.replace(/^https?:\/\//, '').replace(/[^a-zA-Z0-9.-]+/g, '-');
  }
}

/** paginas-ejemplo.com-2026-11-26.pdf (pages-… en inglés). */
export function buildExportFileName(siteUrl: string, date: Date, lang: 'es' | 'en', format: ExportFormat): string {
  const prefix = lang === 'en' ? 'pages' : 'paginas';
  return `${prefix}-${siteHost(siteUrl)}-${localDate(date)}.${format}`;
}

function download(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

// Mismos tonos que los distintivos badge-success / badge-error / badge-info de la tabla
const STATUS_COLORS: Record<StatusTone, [number, number, number]> = {
  success: [34, 197, 94],
  error: [239, 68, 68],
  info: [14, 165, 233],
};
const HEADER_FILL: [number, number, number] = [229, 231, 235];

/** PDF horizontal con el formato de la tabla. jsPDF se carga solo al exportar. */
export async function buildPagesPdf(rows: PageRow[], meta: ExportMeta, t: Translate): Promise<Blob> {
  const [{ jsPDF }, { autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  const date = meta.date ?? new Date();
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const title = `${t('siteDetails.export.pdfTitle')}: ${meta.siteUrl}`;
  const subtitle = `${date.toLocaleDateString(meta.lang === 'en' ? 'en-US' : 'es-MX')} · ${rows.length} ${t('siteDetails.export.pagesCount')}`;
  const statusIndex = EXPORT_COLUMNS.indexOf('status');

  autoTable(doc, {
    head: [exportHeaders(t)],
    body: rows.map(exportCells),
    startY: 64,
    margin: { top: 64, left: 28, right: 28, bottom: 32 },
    showHead: 'everyPage',
    styles: { fontSize: 8, cellPadding: 4, overflow: 'linebreak', valign: 'top', textColor: [31, 41, 55] },
    headStyles: { fillColor: HEADER_FILL, textColor: [31, 41, 55], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: {
      0: { cellWidth: 160, textColor: [37, 99, 235] },
      1: { cellWidth: 140 },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 120 },
      4: { cellWidth: 70, halign: 'center' },
      5: { cellWidth: 55, halign: 'center' },
    },
    didParseCell: (data) => {
      if (data.section !== 'body' || data.column.index !== statusIndex) return;
      const row = rows[data.row.index];
      if (!row || row.statusCode === null) return;
      data.cell.styles.fillColor = STATUS_COLORS[row.statusTone];
      data.cell.styles.textColor = [255, 255, 255];
      data.cell.styles.fontStyle = 'bold';
    },
    didDrawPage: () => {
      doc.setFontSize(13);
      doc.setTextColor(31, 41, 55);
      doc.text(title, 28, 32);
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      doc.text(subtitle, 28, 48);
      const pageNumber = doc.getNumberOfPages();
      doc.text(String(pageNumber), doc.internal.pageSize.getWidth() - 28, doc.internal.pageSize.getHeight() - 14, {
        align: 'right',
      });
    },
  });

  return doc.output('blob');
}

/** XLSX con una fila por página y valores completos. exceljs se carga solo al exportar. */
export async function buildPagesXlsx(rows: PageRow[], meta: ExportMeta, t: Translate): Promise<Blob> {
  const { default: ExcelJS } = await import('exceljs');
  const date = meta.date ?? new Date();
  const workbook = new ExcelJS.Workbook();
  workbook.created = date;
  const sheet = workbook.addWorksheet(t('siteDetails.export.sheetName'), {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  const widths = [60, 40, 60, 30, 14, 10, 80];
  sheet.columns = [...exportHeaders(t), t('siteDetails.export.headingsList')].map((header, i) => ({
    header,
    width: widths[i],
  }));

  for (const row of rows) {
    sheet.addRow([
      row.url,
      row.title ?? '',
      row.description ?? '',
      row.languagesText,
      row.headingsCount,
      row.statusCode ?? '',
      row.headings.join(' | '),
    ]);
  }

  const header = sheet.getRow(1);
  header.font = { bold: true };
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } };
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: sheet.columnCount } };

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/** Genera el archivo en el formato pedido y lo descarga en el navegador. */
export async function exportPages(format: ExportFormat, rows: PageRow[], meta: ExportMeta, t: Translate): Promise<void> {
  const date = meta.date ?? new Date();
  const blob = format === 'pdf' ? await buildPagesPdf(rows, { ...meta, date }, t) : await buildPagesXlsx(rows, { ...meta, date }, t);
  download(blob, buildExportFileName(meta.siteUrl, date, meta.lang, format));
}
