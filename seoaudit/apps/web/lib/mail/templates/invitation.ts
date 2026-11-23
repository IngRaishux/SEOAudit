import { t, type Language } from '@/lib/i18n/ui';
import { formatMessage } from '@/lib/i18n/format';
import type { AssignableRole } from '@/lib/auth/permissions';

export interface InvitationEmailData {
  inviterName: string;
  organizationName: string;
  role: AssignableRole;
  link: string;
  expiresAt: Date;
}

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

export function invitationEmail(data: InvitationEmailData, lang: Language) {
  const tr = (key: string) => t(lang, `team.email.${key}`);
  const date = new Intl.DateTimeFormat(lang === 'es' ? 'es-MX' : 'en-US', { dateStyle: 'long', timeZone: 'UTC' }).format(
    data.expiresAt
  );
  const values = {
    inviter: data.inviterName,
    org: data.organizationName,
    role: t(lang, `team.roles.${data.role}`),
    date,
  };
  const htmlValues = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, escapeHtml(v)]));

  const subject = formatMessage(tr('subject'), values);
  const text = [
    formatMessage(tr('body'), values),
    '',
    `${tr('cta')}: ${data.link}`,
    '',
    formatMessage(tr('expires'), values),
    tr('ignore'),
  ].join('\n');

  const link = escapeHtml(data.link);
  const html = `<!doctype html>
<html lang="${lang}">
  <body style="margin:0;padding:24px;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#18181b;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;">
      <tr><td style="padding:32px;">
        <h1 style="margin:0 0 16px;font-size:20px;">${formatMessage(escapeHtml(tr('heading')), htmlValues)}</h1>
        <p style="margin:0 0 24px;font-size:15px;line-height:1.5;">${formatMessage(escapeHtml(tr('body')), htmlValues)}</p>
        <p style="margin:0 0 24px;">
          <a href="${link}" style="display:inline-block;padding:12px 20px;background:#4f46e5;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:bold;">${escapeHtml(tr('cta'))}</a>
        </p>
        <p style="margin:0 0 8px;font-size:13px;color:#52525b;">${formatMessage(escapeHtml(tr('expires')), htmlValues)}</p>
        <p style="margin:0 0 16px;font-size:13px;color:#52525b;">${escapeHtml(tr('ignore'))}</p>
        <p style="margin:0;font-size:12px;color:#71717a;">${escapeHtml(tr('linkFallback'))}<br><a href="${link}" style="color:#4f46e5;word-break:break-all;">${link}</a></p>
      </td></tr>
    </table>
  </body>
</html>`;

  return { subject, html, text };
}
