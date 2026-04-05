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
  smtp_password: 'wagrmuphptnevpin', // Esta es una clave de ejemplo, debe reemplazarse en el panel
  smtp_from_name: 'Sync Connect'
};

/**
 * Obtiene la configuración SMTP desde Firestore o usa la por defecto de forma segura.
 */
async function getSmtpConfig() {
  const { firestore } = initializeFirebase();
  try {
    const configDoc = await getDoc(doc(firestore, 'site_config', 'settings'));
    if (configDoc.exists()) {
      const data = configDoc.data();
      if (data.smtp_user && data.smtp_password) {
        return {
          host: (data.smtp_host || DEFAULT_SMTP.smtp_host).trim(),
          port: parseInt(data.smtp_port || DEFAULT_SMTP.smtp_port),
          user: data.smtp_user.trim(),
          pass: data.smtp_password.trim(),
          fromName: data.smtp_from_name || DEFAULT_SMTP.smtp_from_name,
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
    fromName: DEFAULT_SMTP.smtp_from_name
  };
}

/**
 * Envía un correo electrónico utilizando la configuración SMTP activa con máxima compatibilidad.
 */
export async function sendEmail({ to, subject, text, html }: { to: string, subject: string, text: string, html?: string }) {
  try {
    const config = await getSmtpConfig();
    const isSecure = config.port === 465;

    // Configuración robusta para entornos Serverless (Vercel)
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: isSecure,
      pool: true, // Mantiene la conexión abierta
      maxConnections: 1,
      maxMessages: 1,
      auth: {
        user: config.user,
        pass: config.pass,
      },
      tls: {
        rejectUnauthorized: false, // Evita errores de certificados en nubes
        minVersion: 'TLSv1.2'
      },
      connectionTimeout: 15000, 
      greetingTimeout: 10000,
      socketTimeout: 20000,
    });

    // Gmail requiere que el 'from' sea el mismo que el usuario autenticado
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
    
    let userFriendlyError = "Fallo de conexión SMTP.";
    if (error.responseCode === 535) {
      userFriendlyError = "Acceso Denegado: La contraseña de aplicación configurada en el panel es incorrecta.";
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
      userFriendlyError = "Tiempo de espera agotado. Verifica el puerto y que Gmail acepte conexiones externas.";
    } else {
      userFriendlyError = error.message || "Error desconocido en el servidor de correos.";
    }

    return { success: false, error: userFriendlyError };
  }
}

/**
 * Genera y envía un código de recuperación de contraseña utilizando el Gmail del Administrador.
 */
export async function sendPasswordResetCode(email: string) {
  const { firestore } = initializeFirebase();
  const cleanEmail = email.toLowerCase().trim();
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); 

  try {
    // Guardar código para validación posterior
    await setDoc(doc(firestore, 'password_resets', cleanEmail), {
      code,
      expiresAt,
      email: cleanEmail,
      createdAt: new Date().toISOString()
    });

    // Enviar el código
    const result = await sendEmail({
      to: cleanEmail,
      subject: `[${code}] Tu Código de Seguridad Sync`,
      text: `Tu código de recuperación es: ${code}\n\nIngrésalo en la plataforma para cambiar tu contraseña. Válido por 15 minutos.`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 40px; border: 1px solid #e2e8f0; border-radius: 32px; text-align: center; background-color: #ffffff;">
          <h2 style="color: #0f172a; font-size: 24px; font-weight: 900; margin-bottom: 10px;">Código de Seguridad</h2>
          <p style="color: #64748b; font-size: 14px; margin-bottom: 30px;">Copia este código para restablecer tu acceso:</p>
          <div style="background: #f8fafc; padding: 30px; border-radius: 24px; border: 2px dashed #e2e8f0; margin: 20px 0;">
            <span style="font-family: monospace; font-size: 42px; font-weight: 900; letter-spacing: 10px; color: #ff5d1b;">${code}</span>
          </div>
          <p style="font-size: 11px; color: #94a3b8; margin-top: 30px; font-weight: 700;">VÁLIDO POR 15 MINUTOS</p>
        </div>
      `
    });

    return result;
  } catch (error: any) {
    console.error("RESET CODE ERROR:", error);
    return { success: false, error: "Error al generar código de seguridad." };
  }
}

export async function testEmailConfig(email: string) {
  return await sendEmail({
    to: email,
    subject: '🔔 Prueba de Conexión Sync Connect',
    text: '¡Configuración Exitosa! Los correos de tu plataforma ahora funcionan correctamente.'
  });
}
