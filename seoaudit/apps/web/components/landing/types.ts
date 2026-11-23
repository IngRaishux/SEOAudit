import type { Language, translations } from '@/lib/i18n/ui';

export type HomeTexts = (typeof translations)[Language]['home'];

export interface SectionProps {
  texts: HomeTexts;
  lang: Language;
}
