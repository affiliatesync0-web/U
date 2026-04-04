'use server';

import nodemailer from 'nodemailer';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

/**
 * Credenciales por defecto (Backup) extraídas del README.
 * Se usan si el administrador aún no ha configurado el panel.
 */
const DEFAULT_SMTP = {
  smtp_host: 'smtp.gmail.com',
  smtp_port: '465',
  smtp_user: 'affiliatesync0@gmail.com',
  smtp_password: 'wagrmuphptnevpin',
  smtp_from_name: 'Sync Connect',
  smtp_from_email: 'affiliatesync0@gmail.com'
};

/**
 * Obtiene la configuración SMTP desde Firestore o usa la por defecto.
 */
async function getSmtpConfig() {
  const { firestore } = initializeFirebase();
  try {
    const configDoc = await getDoc(doc(firestore, 'site_config', 'settings'));
    if (configDoc.exists()) {
      const data = configDoc.data();
      // Validar que tenga los campos mínimos necesarios
      if (data.smtp_user && data.smtp_password) {
        return data;
      }
    }
  } catch (error) {
    console.error("Error al obtener la configuración de correo:", error);
  }
  return DEFAULT_SMTP;
}

/**
 * Envía un correo electrónico utilizando la configuración SMTP activa.
 */
export async function sendEmail({ to, subject, text, html }: { to: string, subject: string, text: string, html?: string }) {
  try {
    const config = await getSmtpConfig();

    const transporter = nodemailer.createTransport({
      host: config.smtp_host || 'smtp.gmail.com',
      port: parseInt(config.smtp_port || '465'),
      secure: config.smtp_port === '465' || config.smtp_port === 465,
      auth: {
        user: config.smtp_user,
        pass: config.smtp_password,
      },
      // Aumentar tiempo de espera para evitar errores de red lenta
      connectionTimeout: 10000, 
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

    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      text,
      html: emailHtml,
    });

    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("SMTP SEND ERROR:", error);
    return { success: false, error: error.message || "Error desconocido al enviar el correo." };
  }
}

/**
 * Genera y envía un código de recuperación de contraseña de 6 dígitos.
 */
export async function sendPasswordResetCode(email: string) {
  const { firestore } = initializeFirebase();
  const cleanEmail = email.toLowerCase().trim();
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 min de validez

  try {
    // 1. Guardar el código en la base de datos de forma segura
    await setDoc(doc(firestore, 'password_resets', cleanEmail), {
      code,
      expiresAt,
      email: cleanEmail,
      createdAt: new Date().toISOString()
    });

    // 2. Intentar enviar el correo
    const result = await sendEmail({
      to: cleanEmail,
      subject: `[${code}] Tu Código de Seguridad - Sync Connect`,
      text: `Has solicitado restablecer tu contraseña. Tu código de seguridad es: ${code}\n\nEste código expirará en 15 minutos.\n\nSi no solicitaste este cambio, puedes ignorar este correo de forma segura.`,
      html: `
        <div style="font-family: 'Inter', sans-serif; max-width: 500px; margin: auto; padding: 40px; border: 1px solid #e2e8f0; border-radius: 32px; text-align: center; background-color: #ffffff; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
          <div style="margin-bottom: 30px;">
            <span style="background-color: #fff1eb; color: #ff5d1b; padding: 10px 20px; border-radius: 100px; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px;">Seguridad Sync</span>
          </div>
          <h2 style="color: #0f172a; font-size: 24px; font-weight: 900; margin-bottom: 10px;">Recuperar Contraseña</h2>
          <p style="color: #64748b; font-size: 14px; margin-bottom: 30px;">Usa el siguiente código de 6 dígitos para validar tu identidad en la plataforma:</p>
          <div style="background: #f8fafc; padding: 30px; border-radius: 24px; border: 2px dashed #e2e8f0; margin: 20px 0;">
            <span style="font-family: 'Courier New', monospace; font-size: 42px; font-weight: 900; letter-spacing: 12px; color: #ff5d1b;">${code}</span>
          </div>
          <p style="font-size: 11px; color: #94a3b8; margin-top: 30px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Válido por 15 minutos</p>
          <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 30px 0;" />
          <p style="font-size: 10px; color: #cbd5e1; line-height: 1.5;">Este es un mensaje automático. Por favor no respondas a este correo.</p>
        </div>
      `
    });

    return result;
  } catch (error: any) {
    console.error("RESET CODE ERROR:", error);
    return { success: false, error: "No pudimos generar tu código de acceso. Intenta más tarde." };
  }
}

export async function testEmailConfig(email: string) {
  return await sendEmail({
    to: email,
    subject: '🔔 Prueba de Conexión Exitosa - Sync Connect',
    text: 'Si recibes este mensaje, tu configuración de correo en el panel administrativo funciona perfectamente.'
  });
}
