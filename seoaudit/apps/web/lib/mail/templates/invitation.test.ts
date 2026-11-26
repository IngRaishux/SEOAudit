import { describe, expect, it } from 'vitest';
import { invitationEmail } from './invitation';

const data = {
  inviterName: 'Hiram',
  organizationName: 'Hoteles <Brisas>',
  role: 'editor' as const,
  link: 'http://localhost:3000/invite/abc123',
  expiresAt: new Date('2026-11-19T10:00:00Z'),
};

describe('invitationEmail', () => {
  it('en español incluye quien invita, la organización, el rol, el vencimiento y el link', () => {
    const mail = invitationEmail(data, 'es');
    expect(mail.subject).toBe('Hiram te ha invitado a Hoteles <Brisas> en SEObab');
    for (const part of ['Hiram', 'Hoteles <Brisas>', 'Editor', '19 de noviembre de 2026', data.link]) {
      expect(mail.text).toContain(part);
    }
    expect(mail.html).toContain(`href="${data.link}"`);
    expect(mail.html).toContain('19 de noviembre de 2026');
  });

  it('en inglés usa los textos en inglés', () => {
    const mail = invitationEmail({ ...data, role: 'viewer' }, 'en');
    expect(mail.subject).toBe('Hiram has invited you to Hoteles <Brisas> on SEObab');
    expect(mail.text).toContain('as Viewer');
    expect(mail.text).toContain('November 19, 2026');
    expect(mail.text).toContain(data.link);
  });

  it('escapa el HTML de los datos', () => {
    const mail = invitationEmail(data, 'es');
    expect(mail.html).toContain('Hoteles &lt;Brisas&gt;');
    expect(mail.html).not.toContain('<Brisas>');
  });
});
