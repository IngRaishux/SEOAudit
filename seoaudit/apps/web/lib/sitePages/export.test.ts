import { describe, expect, it } from 'vitest';
import { t as translate } from '@/lib/i18n/ui';
import { buildExportFileName, EXPORT_COLUMNS, exportCells, exportHeaders } from './export';
import type { PageRow } from './rows';

const t = (path: string) => translate('es', path);

const row: PageRow = {
  url: 'https://ejemplo.com/a',
  title: 'Inicio',
  description: null,
  languages: ['es'],
  languagesText: 'es',
  headingsCount: 3,
  headings: ['a', 'b', 'c'],
  statusCode: 404,
  statusTone: 'error',
};

describe('buildExportFileName', () => {
  const date = new Date(2026, 10, 26);

  it('usa el dominio sin www y la fecha local', () => {
    expect(buildExportFileName('https://www.ejemplo.com/ruta', date, 'es', 'pdf')).toBe('paginas-ejemplo.com-2026-11-26.pdf');
    expect(buildExportFileName('https://ejemplo.com', date, 'es', 'xlsx')).toBe('paginas-ejemplo.com-2026-11-26.xlsx');
  });

  it('prefijo en inglés', () => {
    expect(buildExportFileName('https://ejemplo.com', date, 'en', 'pdf')).toBe('pages-ejemplo.com-2026-11-26.pdf');
  });

  it('URL inválida: limpia caracteres raros', () => {
    expect(buildExportFileName('ejemplo com/x', date, 'es', 'pdf')).toBe('paginas-ejemplo-com-x-2026-11-26.pdf');
  });
});

describe('columnas exportadas', () => {
  it('siguen el orden de la tabla y no incluyen Acción', () => {
    expect(EXPORT_COLUMNS).toEqual(['url', 'title', 'description', 'languages', 'headings', 'status']);
    const headers = exportHeaders(t);
    expect(headers).toEqual(['URL', t('siteDetails.pageTitle'), 'Descripción', 'Idiomas', t('pages.headings'), t('common.status')]);
    expect(headers).not.toContain(t('sites.actions'));
  });

  it('celdas con guion para valores vacíos', () => {
    expect(exportCells(row)).toEqual(['https://ejemplo.com/a', 'Inicio', '—', 'es', '3', '404']);
    expect(exportCells({ ...row, title: null, headingsCount: 0, statusCode: null })).toEqual([
      'https://ejemplo.com/a',
      '—',
      '—',
      'es',
      '—',
      '—',
    ]);
  });
});

describe('archivos generados', () => {
  const rows: PageRow[] = Array.from({ length: 37 }, (_, i) => ({
    url: `https://ejemplo.com/pagina-${i + 1}`,
    title: `Página ${i + 1} — Hotel en Cancún`,
    description: i % 5 === 0 ? null : `Descripción larga de la página ${i + 1}. `.repeat(i % 3 === 0 ? 8 : 1).trim(),
    languages: ['es-MX', 'en-US', 'x-default'],
    languagesText: i % 4 === 0 ? 'es-MX, en-US, x-default (2 problema(s))' : 'es-MX, en-US, x-default',
    headingsCount: i % 6,
    headings: Array.from({ length: i % 6 }, (_, h) => `Encabezado ${h + 1}`),
    statusCode: i % 7 === 0 ? 404 : i % 9 === 0 ? 301 : 200,
    statusTone: i % 7 === 0 ? 'error' : i % 9 === 0 ? 'info' : 'success',
  }));
  const meta = { siteUrl: 'https://ejemplo.com', lang: 'es' as const, date: new Date(2026, 10, 26) };

  it('XLSX: encabezado + 37 filas con valores completos', async () => {
    const { buildPagesXlsx } = await import('./export');
    const blob = await buildPagesXlsx(rows, meta, t);
    const { default: ExcelJS } = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await blob.arrayBuffer());
    const sheet = workbook.getWorksheet('Páginas')!;
    expect(sheet.rowCount).toBe(38);
    expect(sheet.getRow(1).values).toEqual([
      undefined,
      'URL',
      t('siteDetails.pageTitle'),
      'Descripción',
      'Idiomas',
      t('pages.headings'),
      t('common.status'),
      'Lista de encabezados',
    ]);
    const third = sheet.getRow(4).values as unknown[];
    expect(third[3]).toBe(rows[2].description);
    expect(third[6]).toBe(200);
    expect(sheet.getRow(5).getCell(3).value).toBe(rows[3].description); // descripción larga completa
    expect(sheet.getRow(6).getCell(7).value).toBe('Encabezado 1 | Encabezado 2 | Encabezado 3 | Encabezado 4');
    if (process.env.EXPORT_SAMPLE_DIR) {
      const { writeFile } = await import('node:fs/promises');
      await writeFile(`${process.env.EXPORT_SAMPLE_DIR}/sample.xlsx`, Buffer.from(await blob.arrayBuffer()));
    }
  });

  it('PDF: genera un documento de varias hojas', async () => {
    const { buildPagesPdf } = await import('./export');
    const blob = await buildPagesPdf(rows, meta, t);
    const text = Buffer.from(await blob.arrayBuffer()).toString('latin1');
    expect(text.startsWith('%PDF-')).toBe(true);
    expect((text.match(/\/Type \/Page\b/g) ?? []).length).toBeGreaterThan(1);
    if (process.env.EXPORT_SAMPLE_DIR) {
      const { writeFile } = await import('node:fs/promises');
      await writeFile(`${process.env.EXPORT_SAMPLE_DIR}/sample.pdf`, Buffer.from(await blob.arrayBuffer()));
    }
  });
});
