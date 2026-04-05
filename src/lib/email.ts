
'use server';

import nodemailer from 'nodemailer';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

/**
 * Obtiene la configuración SMTP desde Firestore.
 * Prioriza siempre lo configurado por el usuario en el panel.
 */
async function getSmtpConfig() {
  const { firestore } = initializeFirebase();
  try {
    const configDoc = await getDoc(doc(firestore, 'site_config', 'settings'));
    if (configDoc.exists()) {
      const data = configDoc.data();
      if (data.smtp_user && data.smtp_password) {
        return {
          host: (data.smtp_host || 'smtp.gmail.com').trim(),
          port: parseInt(data.smtp_port || '465'),
          user: data.smtp_user.trim(),
          pass: data.smtp_password.trim(),
          fromName: data.smtp_from_name || 'Sync Connect',
        };
      }
    }
  } catch (error) {
    console.error("Error al obtener la configuración de correo:", error);
  }
  
  return {
    host: 'smtp.gmail.com',
    port: 465,
    user: 'affiliatesync0@gmail.com',
    pass: 'wagrmuphptnevpin', 
    fromName: 'Sync Connect'
  };
}

/**
 * Envía un correo electrónico utilizando la configuración SMTP activa.
 */
export async function sendEmail({ to, subject, text, html }: { to: string, subject: string, text: string, html?: string }) {
  try {
    const config = await getSmtpConfig();
    const isSecure = config.port === 465;

    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: isSecure,
      pool: true,
      maxConnections: 1,
      auth: {
        user: config.user,
        pass: config.pass,
      },
      tls: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2'
      }
    });

    const fromAddress = `"${config.fromName}" <${config.user}>`;

    const emailHtml = html || `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; background-color: #ffffff;">
        <div style="background-color: #ff5d1b; padding: 40px; text-align: center;">
          <h1 style="margin: 0; color: #ffffff; font-size: 24px; text-transform: uppercase; font-weight: 900;">Sync Connect</h1>
        </div>
        <div style="padding: 40px; line-height: 1.6; color: #334155; font-size: 16px;">
          ${text.split('\n').map(line => `<p style="margin-bottom: 10px;">${line}</p>`).join('')}
        </div>
        <div style="background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
          <p style="margin: 0; font-weight: bold;">&copy; ${new Date().getFullYear()} ${config.fromName}</p>
        </div>
      </div>
    `;

    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      text,
      html: emailHtml,
    });

    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("DETALLE DE ERROR SMTP:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Envía una nueva contraseña generada por el administrador.
 */
export async function sendNewPasswordAdmin({ to, name, newPassword }: { to: string, name: string, newPassword: string }) {
  return await sendEmail({
    to,
    subject: '🔐 Tus nuevas credenciales de acceso - Sync Connect',
    text: `Hola ${name},\n\nUn administrador ha restablecido tu contraseña de acceso por seguridad.\n\nNUEVOS DATOS DE ACCESO:\n- Email: ${to}\n- Contraseña: ${newPassword}\n\nInicia sesión aquí: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/auth/login\n\nTe recomendamos cambiar esta contraseña una vez que ingreses a tu panel.`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 40px; border: 1px solid #e2e8f0; border-radius: 32px; background-color: #ffffff; text-align: center;">
        <div style="margin-bottom: 30px;">
          <span style="font-size: 40px;">🔐</span>
        </div>
        <h2 style="color: #0f172a; font-size: 22px; font-weight: 900; margin-bottom: 10px; text-transform: uppercase;">Nueva Contraseña</h2>
        <p style="color: #64748b; font-size: 14px; margin-bottom: 30px;">Tus credenciales han sido actualizadas por el administrador:</p>
        <div style="background: #f8fafc; padding: 25px; border-radius: 20px; border: 1px solid #e2e8f0; margin-bottom: 30px;">
          <p style="margin: 0 0 10px 0; font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Tu nueva clave es:</p>
          <span style="font-family: monospace; font-size: 32px; font-weight: 900; color: #ff5d1b;">${newPassword}</span>
        </div>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || '#'}/auth/login" style="display: block; background-color: #0f172a; color: white; padding: 18px; border-radius: 16px; text-decoration: none; font-weight: 900; font-size: 12px; letter-spacing: 1px; text-transform: uppercase;">INICIAR SESIÓN AHORA</a>
        <p style="font-size: 10px; color: #94a3b8; margin-top: 30px; font-weight: 700;">POR SEGURIDAD, NO COMPARTAS ESTOS DATOS CON NADIE.</p>
      </div>
    `
  });
}
