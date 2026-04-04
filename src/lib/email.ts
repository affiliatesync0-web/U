'use server';

import nodemailer from 'nodemailer';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';

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
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; background-color: #ffffff;">
      <div style="background-color: #ff5d1b; padding: 40px; text-align: center;">
        <h1 style="margin: 0; color: #ffffff; font-size: 24px; text-transform: uppercase; letter-spacing: 2px;">Sync Connect</h1>
      </div>
      <div style="padding: 40px; line-height: 1.6; color: #334155; font-size: 16px;">
        ${text.split('\n').map(line => `<p style="margin-bottom: 10px;">${line}</p>`).join('')}
      </div>
      <div style="background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
        <p style="margin: 0;">&copy; ${new Date().getFullYear()} ${fromName}</p>
      </div>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      text,
      html: emailHtml,
    });
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Genera y envía un código de recuperación de contraseña.
 */
export async function sendPasswordResetCode(email: string) {
  const { firestore } = initializeFirebase();
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 min

  try {
    // Guardar código en Firestore
    await setDoc(doc(firestore, 'password_resets', email.toLowerCase().trim()), {
      code,
      expiresAt,
      email: email.toLowerCase().trim()
    });

    // Enviar correo
    return await sendEmail({
      to: email,
      subject: 'Código de Recuperación - Sync Connect',
      text: `Tu código de seguridad para restablecer tu contraseña es: ${code}\n\nEste código expirará en 15 minutos. Si no solicitaste este cambio, ignora este mensaje.`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 40px; border: 1px solid #eee; border-radius: 20px; text-align: center;">
          <h2 style="color: #333;">Recuperar Contraseña</h2>
          <p style="color: #666;">Usa el siguiente código para validar tu identidad:</p>
          <div style="background: #f4f4f4; padding: 20px; border-radius: 10px; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #ff5d1b; margin: 20px 0;">
            ${code}
          </div>
          <p style="font-size: 12px; color: #999;">Válido por 15 minutos.</p>
        </div>
      `
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function testEmailConfig(email: string) {
  return await sendEmail({
    to: email,
    subject: 'Prueba de Conexión Exitosa',
    text: 'Si recibes este mensaje, tu configuración de Gmail en el panel de Sync Connect es correcta.'
  });
}
