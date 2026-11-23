import nodemailer, { type Transporter } from 'nodemailer';

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export type SendResult = { sent: true } | { sent: false; error: string };

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  const host = process.env.SMTP_HOST;
  if (!host) return null;
  if (!transporter) {
    const user = process.env.SMTP_USER;
    transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: user ? { user, pass: process.env.SMTP_PASS || '' } : undefined,
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });
  }
  return transporter;
}

/** Envía un correo. Nunca lanza: devuelve si se envió y, si no, por qué. */
export async function sendMail(message: MailMessage): Promise<SendResult> {
  const transport = getTransporter();
  if (!transport) {
    console.info(`[mail] SMTP_HOST no configurado; no se envía "${message.subject}" a ${message.to}\n${message.text}`);
    return { sent: false, error: 'SMTP_NOT_CONFIGURED' };
  }

  try {
    await transport.sendMail({
      from: process.env.MAIL_FROM || 'SEOAudit <no-reply@localhost>',
      ...message,
    });
    return { sent: true };
  } catch (error) {
    // Un rechazo de conexión llega como AggregateError sin mensaje: se usa el código
    const code = (error as { code?: string } | null)?.code;
    const errorMessage = error instanceof Error ? error.message : String(error);
    const reason = errorMessage || code || 'SEND_FAILED';
    console.error(`[mail] Error enviando "${message.subject}" a ${message.to}:`, reason);
    return { sent: false, error: reason.slice(0, 300) };
  }
}
