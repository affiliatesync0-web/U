'use server';

import nodemailer from 'nodemailer';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Obtiene la configuración SMTP desde la colección site_config en Firestore.
 */
async function getSmtpConfig() {
  const { firestore } = initializeFirebase();
  try {
    const configDoc = await getDoc(doc(firestore, 'site_config', 'settings'));
    if (configDoc.exists()) {
      return configDoc.data();
    }
  } catch (error) {
    console.error("Error al obtener la configuración de correo:", error);
  }
  return null;
}

/**
 * Envía un correo electrónico utilizando la configuración SMTP guardada.
 */
export async function sendEmail({ to, subject, text, html }: { to: string, subject: string, text: string, html?: string }) {
  const config = await getSmtpConfig();

  if (!config || !config.smtp_user || !config.smtp_password) {
    console.error("Configuración SMTP no encontrada o incompleta.");
    return { success: false, error: "Configuración de correo no disponible." };
  }

  const transporter = nodemailer.createTransport({
    host: config.smtp_host || 'smtp.gmail.com',
    port: parseInt(config.smtp_port) || 465,
    secure: config.smtp_port == '465', 
    auth: {
      user: config.smtp_user,
      pass: config.smtp_password,
    },
  });

  const fromName = config.smtp_from_name || 'Sync Connect';
  const fromEmail = config.smtp_from_email || config.smtp_user;

  const emailHtml = html || `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      <div style="background-color: #ff5d1b; padding: 40px; text-align: center;">
        <h1 style="margin: 0; color: #ffffff; font-size: 28px; text-transform: uppercase; letter-spacing: 3px; font-weight: 900;">Sync Connect</h1>
      </div>
      <div style="padding: 40px; line-height: 1.6; color: #1e293b; font-size: 16px;">
        ${text.split('\n').map(line => `<p style="margin-bottom: 15px;">${line}</p>`).join('')}
      </div>
      <div style="background-color: #f8fafc; padding: 30px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">&copy; ${new Date().getFullYear()} ${fromName}</p>
        <p style="margin: 5px 0 0;">Este es un correo automático del sistema. Por favor no respondas.</p>
      </div>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject: `${subject}`,
      text,
      html: emailHtml,
    });

    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('Error al enviar email:', error);
    return { success: false, error: error.message };
  }
}

export async function testEmailConfig(email: string) {
  return await sendEmail({
    to: email,
    subject: 'Prueba de configuración de correo - Sync Connect',
    text: 'Felicidades, la configuración de tu servidor SMTP funciona correctamente y estás listo para enviar notificaciones desde el sistema.'
  });
}
