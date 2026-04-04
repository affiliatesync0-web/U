'use server';

import nodemailer from 'nodemailer';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Obtiene la configuración SMTP desde la colección site_config en Firestore.
 * Esta es la fuente de verdad controlada desde el panel de administración.
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
 * Envía un correo electrónico utilizando la configuración SMTP guardada por el administrador.
 */
export async function sendEmail({ to, subject, text, html }: { to: string, subject: string, text: string, html?: string }) {
  const config = await getSmtpConfig();

  // Si no hay configuración en la DB, no podemos enviar
  if (!config || !config.smtp_user || !config.smtp_password) {
    console.error("Configuración SMTP no encontrada en la base de datos.");
    return { success: false, error: "Configuración de correo no disponible. Por favor configúrala en el panel admin." };
  }

  const transporter = nodemailer.createTransport({
    host: config.smtp_host || 'smtp.gmail.com',
    port: parseInt(config.smtp_port) || 465,
    secure: config.smtp_port == '465', // SSL para el puerto 465
    auth: {
      user: config.smtp_user,
      pass: config.smtp_password,
    },
  });

  const fromName = config.smtp_from_name || 'Sync Connect';
  const fromEmail = config.smtp_from_email || config.smtp_user;

  // Plantilla visual elegante para todos los correos
  const emailHtml = html || `
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; background-color: #ffffff;">
      <div style="background-color: #ff5d1b; padding: 40px; text-align: center;">
        <h1 style="margin: 0; color: #ffffff; font-size: 24px; text-transform: uppercase; letter-spacing: 2px;">Sync Connect</h1>
      </div>
      <div style="padding: 40px; line-height: 1.6; color: #334155; font-size: 16px;">
        ${text.split('\n').map(line => `<p style="margin-bottom: 10px;">${line}</p>`).join('')}
      </div>
      <div style="background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
        <p style="margin: 0;">&copy; ${new Date().getFullYear()} ${fromName}</p>
        <p style="margin: 5px 0 0;">Este correo fue enviado automáticamente desde tu plataforma Sync Connect.</p>
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
    console.error('Error SMTP:', error);
    return { success: false, error: error.message };
  }
}

export async function testEmailConfig(email: string) {
  return await sendEmail({
    to: email,
    subject: 'Prueba de Conexión Exitosa',
    text: 'Si recibes este mensaje, tu configuración de Gmail en el panel de Sync Connect es correcta. Todos los avisos de nuevos afiliados y ventas se enviarán desde esta cuenta.'
  });
}
