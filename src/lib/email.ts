'use server';

import nodemailer from 'nodemailer';

/**
 * Servicio de envío de correos electrónicos vía Gmail SMTP.
 * Requiere GMAIL_USER y GMAIL_PASS (Contraseña de Aplicación) en .env
 */
export async function sendEmail({ to, subject, text, html }: { to: string, subject: string, text: string, html?: string }) {
  const user = process.env.GMAIL_USER || 'tu-gmail@gmail.com';
  const pass = process.env.GMAIL_PASS || 'tu-password-de-aplicacion';

  // Configuración del transporte para Gmail
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: user,
      pass: pass,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: `"Sync Connect Notifications" <${user}>`,
      to,
      subject,
      text,
      html: html || text.replace(/\n/g, '<br>'),
    });

    console.log('Message sent: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
}
