import { SERP_LIMITS } from '@/lib/seo/serpLimits';
import type { FreePageSummary } from './types';

export type PageIssue =
  | 'status'
  | 'missing-title'
  | 'title-length'
  | 'missing-description'
  | 'description-length'
  | 'missing-h1'
  | 'multiple-h1';

const { titleMin, titleMax, descMin, descMax } = SERP_LIMITS.desktop;

/** Problemas básicos de una página, con los mismos rangos (escritorio) que la vista previa SERP. */
export function pageIssues(page: Pick<FreePageSummary, 'statusCode' | 'title' | 'description' | 'h1'>): PageIssue[] {
  const issues: PageIssue[] = [];
  if (page.statusCode !== 200) issues.push('status');

  const title = page.title?.trim() ?? '';
  if (!title) issues.push('missing-title');
  else if (title.length < titleMin || title.length > titleMax) issues.push('title-length');

  const description = page.description?.trim() ?? '';
  if (!description) issues.push('missing-description');
  else if (description.length < descMin || description.length > descMax) issues.push('description-length');

  const h1 = page.h1.filter((text) => text.trim() !== '');
  if (h1.length === 0) issues.push('missing-h1');
  else if (h1.length > 1) issues.push('multiple-h1');

  return issues;
}
