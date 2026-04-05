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
      // Validamos que existan los datos críticos
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
  
  // Backup oficial solo si no hay nada configurado (para que el sistema no muera)
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
 * Optimizado para Vercel y Gmail.
 */
export async function sendEmail({ to, subject, text, html }: { to: string, subject: string, text: string, html?: string }) {
  try {
    const config = await getSmtpConfig();
    const isSecure = config.port === 465;

    // Crear transportador con pool para estabilidad en serverless
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

    // CRÍTICO: El remitente DEBE ser el mismo que el usuario autenticado para Gmail
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
    
    let errorMsg = error.message || "Error desconocido.";
    if (error.responseCode === 535) {
      errorMsg = "Contraseña de aplicación inválida o Gmail denegó el acceso.";
    } else if (error.code === 'EENVELOPE') {
      errorMsg = "El correo de destino o el remitente no son válidos.";
    }

    return { success: false, error: errorMsg };
  }
}

/**
 * Genera y envía un código de recuperación.
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

    return await sendEmail({
      to: cleanEmail,
      subject: `[${code}] Código de Acceso Sync`,
      text: `Tu código es: ${code}. Válido por 15 minutos.`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 40px; border: 1px solid #e2e8f0; border-radius: 32px; text-align: center; background-color: #ffffff;">
          <h2 style="color: #0f172a; font-size: 24px; font-weight: 900; margin-bottom: 10px;">Código de Seguridad</h2>
          <p style="color: #64748b; font-size: 14px; margin-bottom: 30px;">Copia este código para restablecer tu acceso:</p>
          <div style="background: #f8fafc; padding: 30px; border-radius: 24px; border: 2px dashed #e2e8f0; margin: 20px 0;">
            <span style="font-family: monospace; font-size: 42px; font-weight: 900; letter-spacing: 10px; color: #ff5d1b;">${code}</span>
          </div>
          <p style="font-size: 11px; color: #94a3b8; margin-top: 30px; font-weight: 700;">ESTE CÓDIGO EXPIRA EN 15 MINUTOS</p>
        </div>
      `
    });
  } catch (error: any) {
    return { success: false, error: "Fallo al generar el registro de seguridad." };
  }
}

export async function testEmailConfig(email: string) {
  return await sendEmail({
    to: email,
    subject: '🔔 Prueba de Conexión Sync Connect',
    text: '¡Configuración Exitosa! Los correos de tu plataforma ahora funcionan correctamente.'
  });
}
