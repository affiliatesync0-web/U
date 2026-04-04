'use server';

import nodemailer from 'nodemailer';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

/**
 * Credenciales por defecto (Backup). 
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
      // Validar campos mínimos
      if (data.smtp_user && data.smtp_password) {
        return {
          host: data.smtp_host || 'smtp.gmail.com',
          port: parseInt(data.smtp_port || '465'),
          user: data.smtp_user.trim(),
          pass: data.smtp_password.trim(),
          fromName: data.smtp_from_name || 'Sync Connect',
          fromEmail: data.smtp_user.trim() // Gmail requiere que el From sea el mismo usuario
        };
      }
    }
  } catch (error) {
    console.error("Error al obtener la configuración de correo:", error);
  }
  return {
    host: DEFAULT_SMTP.smtp_host,
    port: parseInt(DEFAULT_SMTP.smtp_port),
    user: DEFAULT_SMTP.smtp_user,
    pass: DEFAULT_SMTP.smtp_password,
    fromName: DEFAULT_SMTP.smtp_from_name,
    fromEmail: DEFAULT_SMTP.smtp_user
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
      auth: {
        user: config.user,
        pass: config.pass,
      },
      // Configuración de autenticación estricta para Gmail
      authMethod: 'LOGIN',
      tls: {
        rejectUnauthorized: false
      },
      pool: true
    });

    const emailHtml = html || `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <div style="background-color: #ff5d1b; padding: 40px; text-align: center;">
          <h1 style="margin: 0; color: #ffffff; font-size: 24px; text-transform: uppercase; letter-spacing: 2px; font-weight: 900;">Sync Connect</h1>
        </div>
        <div style="padding: 40px; line-height: 1.6; color: #334155; font-size: 16px;">
          ${text.split('\n').map(line => `<p style="margin-bottom: 10px;">${line}</p>`).join('')}
        </div>
        <div style="background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
          <p style="margin: 0; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">&copy; ${new Date().getFullYear()} ${config.fromName}</p>
          <p style="margin-top: 5px; opacity: 0.5;">Enviado vía Sync Connect Engine</p>
        </div>
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"${config.fromName}" <${config.user}>`,
      to,
      subject,
      text,
      html: emailHtml,
    });

    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("DETALLE DE ERROR SMTP:", error);
    
    let userFriendlyError = "Error de conexión con el servidor.";
    if (error.code === 'EAUTH' || error.responseCode === 535) {
      userFriendlyError = "Credenciales rechazadas. Asegúrate de usar una 'Contraseña de Aplicación' de 16 dígitos de Google, no tu clave normal.";
    } else if (error.code === 'ETIMEDOUT') {
      userFriendlyError = "Tiempo de espera agotado. Revisa el puerto (465 para SSL).";
    } else {
      userFriendlyError = error.message || "Error desconocido en el servidor de correos.";
    }

    return { success: false, error: userFriendlyError };
  }
}

/**
 * Genera y envía un código de recuperación de contraseña de 6 dígitos.
 */
export async function sendPasswordResetCode(email: string) {
  const { firestore } = initializeFirebase();
  const cleanEmail = email.toLowerCase().trim();
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); 

  try {
    await setDoc(doc(firestore, 'password_resets', cleanEmail), {
      code,
      expiresAt,
      email: cleanEmail,
      createdAt: new Date().toISOString()
    });

    const result = await sendEmail({
      to: cleanEmail,
      subject: `[${code}] Tu Código de Seguridad Sync`,
      text: `Tu código es: ${code}\n\nUsa este código para restablecer tu contraseña en Sync Connect. Válido por 15 minutos.`,
      html: `
        <div style="font-family: 'Inter', sans-serif; max-width: 500px; margin: auto; padding: 40px; border: 1px solid #e2e8f0; border-radius: 32px; text-align: center; background-color: #ffffff; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
          <div style="margin-bottom: 30px;">
            <span style="background-color: #fff1eb; color: #ff5d1b; padding: 10px 20px; border-radius: 100px; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px;">Seguridad Sync</span>
          </div>
          <h2 style="color: #0f172a; font-size: 24px; font-weight: 900; margin-bottom: 10px;">Recuperar Contraseña</h2>
          <p style="color: #64748b; font-size: 14px; margin-bottom: 30px;">Usa el código de 6 dígitos para validar tu identidad:</p>
          <div style="background: #f8fafc; padding: 30px; border-radius: 24px; border: 2px dashed #e2e8f0; margin: 20px 0;">
            <span style="font-family: 'Courier New', monospace; font-size: 42px; font-weight: 900; letter-spacing: 12px; color: #ff5d1b;">${code}</span>
          </div>
          <p style="font-size: 11px; color: #94a3b8; margin-top: 30px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Válido por 15 minutos</p>
        </div>
      `
    });

    return result;
  } catch (error: any) {
    console.error("RESET CODE ERROR:", error);
    return { success: false, error: "Error al generar el código de seguridad." };
  }
}

export async function testEmailConfig(email: string) {
  return await sendEmail({
    to: email,
    subject: '🔔 Prueba de Conexión Sync Connect',
    text: 'Configuración de correo exitosa. Tu sistema ya puede enviar notificaciones.'
  });
}
