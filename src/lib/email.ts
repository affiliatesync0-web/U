'use server';

import nodemailer from 'nodemailer';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

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
  
  // Fallback seguro si no hay nada configurado aún
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
 * Envía el correo de recuperación de contraseña personalizado.
 */
export async function sendPasswordResetEmailCustom({ to, oobCode }: { to: string, oobCode: string }) {
  const resetLink = `https://affiliatesync.vercel.app/auth/reset-password?oobCode=${oobCode}`;
  
  return await sendEmail({
    to,
    subject: '🔑 Recupera tu acceso - Sync Connect',
    text: `Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para continuar: ${resetLink}`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 40px; border: 1px solid #e2e8f0; border-radius: 32px; background-color: #ffffff; text-align: center;">
        <div style="margin-bottom: 30px;">
          <span style="font-size: 40px;">🔑</span>
        </div>
        <h2 style="color: #0f172a; font-size: 24px; font-weight: 900; margin-bottom: 10px; text-transform: uppercase;">Restablecer Clave</h2>
        <p style="color: #64748b; font-size: 15px; margin-bottom: 30px; line-height: 1.6;">
          Recibimos una solicitud para cambiar tu contraseña en <strong>Sync Connect</strong>. Si no fuiste tú, puedes ignorar este correo.
        </p>
        
        <div style="margin-bottom: 30px;">
          <a href="${resetLink}" style="display: inline-block; background-color: #ff5d1b; color: #ffffff; padding: 18px 36px; border-radius: 18px; text-decoration: none; font-weight: 900; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 10px 20px rgba(255,93,27,0.2);">
            ESTABLECER NUEVA CONTRASEÑA
          </a>
        </div>

        <p style="color: #94a3b8; font-size: 12px; font-weight: 500;">
          Este enlace expirará en 1 hora por seguridad.
        </p>
        
        <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #f1f5f9; text-align: center;">
          <p style="font-size: 10px; color: #cbd5e1; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">© ${new Date().getFullYear()} SYNC CONNECT ACADEMY</p>
        </div>
      </div>
    `
  });
}

/**
 * Envía una notificación de pago realizado a un afiliado.
 */
export async function sendPaymentNotification({ to, name, amount, bank }: { to: string, name: string, amount: number, bank: string }) {
  return await sendEmail({
    to,
    subject: `💰 Comisiones Pagadas - Sync Connect`,
    text: `¡Hola ${name}! Te informamos que hemos procesado un pago de comisiones por valor de $${amount.toFixed(2)}.\n\nEl depósito se ha realizado a tu cuenta en ${bank}.\n\n¡Felicidades por tus resultados!`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 40px; border: 1px solid #e2e8f0; border-radius: 32px; background-color: #ffffff; text-align: center;">
        <div style="margin-bottom: 30px;">
          <span style="font-size: 40px;">💰</span>
        </div>
        <h2 style="color: #0f172a; font-size: 24px; font-weight: 900; margin-bottom: 10px; text-transform: uppercase; letter-spacing: -0.5px;">¡Pago Enviado!</h2>
        <p style="color: #64748b; font-size: 15px; margin-bottom: 30px;">Hola <strong>${name}</strong>, tus ganancias han sido transferidas con éxito.</p>
        
        <div style="background: #f0fdf4; padding: 30px; border-radius: 24px; border: 1px solid #bbf7d0; margin-bottom: 30px;">
          <p style="margin: 0 0 10px 0; font-size: 10px; font-weight: 900; color: #16a34a; text-transform: uppercase; letter-spacing: 1px;">Monto Total Depositado</p>
          <span style="font-size: 36px; font-weight: 900; color: #166534;">$${amount.toFixed(2)}</span>
          <p style="margin: 15px 0 0 0; font-size: 11px; font-weight: 700; color: #16a34a;">BANCO: ${bank.toUpperCase()}</p>
        </div>

        <p style="color: #94a3b8; font-size: 13px; font-weight: 500; line-height: 1.6;">
          Tu saldo en plataforma se ha reseteado. Sigue escalando tu negocio digital con Sync Connect.
        </p>
        
        <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #f1f5f9;">
          <p style="font-size: 10px; color: #cbd5e1; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">© ${new Date().getFullYear()} SYNC CONNECT ACADEMY</p>
        </div>
      </div>
    `
  });
}

/**
 * Envía un correo de prueba para verificar la configuración SMTP.
 */
export async function testEmailConfig(to: string) {
  return await sendEmail({
    to,
    subject: '🧪 Prueba de Conexión Sync Connect',
    text: `¡Éxito! Si estás leyendo esto, la configuración de tu servidor de correo en Sync Connect funciona perfectamente.\n\nEnviado el: ${new Date().toLocaleString()}`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 40px; border: 1px solid #e2e8f0; border-radius: 32px; background-color: #ffffff; text-align: center;">
        <div style="margin-bottom: 30px;">
          <span style="font-size: 40px;">🧪</span>
        </div>
        <h2 style="color: #0f172a; font-size: 22px; font-weight: 900; margin-bottom: 10px; text-transform: uppercase;">Prueba de Conexión</h2>
        <p style="color: #64748b; font-size: 14px; margin-bottom: 30px;">La configuración de tu servidor SMTP es correcta y ya puedes enviar notificaciones automáticas.</p>
        <div style="background: #f0fdf4; padding: 25px; border-radius: 20px; border: 1px solid #bbf7d0; margin-bottom: 30px;">
          <p style="margin: 0; font-size: 12px; font-weight: 900; color: #166534; text-transform: uppercase; letter-spacing: 1px;">Estado: CONECTADO</p>
        </div>
        <p style="font-size: 10px; color: #94a3b8; margin-top: 30px; font-weight: 700;">ENVIADO EL: ${new Date().toLocaleString()}</p>
      </div>
    `
  });
}

/**
 * Envía una nueva contraseña generada por el administrador.
 */
export async function sendNewPasswordAdmin({ to, name, newPassword }: { to: string, name: string, newPassword: string }) {
  return await sendEmail({
    to,
    subject: '🔐 Tus nuevas credenciales de acceso - Sync Connect',
    text: `Hola ${name},\n\nUn administrador ha restablecido tu contraseña de acceso por seguridad.\n\nNUEVOS DATOS DE ACCESO:\n- Email: ${to}\n- Contraseña: ${newPassword}\n\nTe recomendamos cambiar esta contraseña una vez que ingreses a tu panel.`,
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
        <p style="font-size: 10px; color: #94a3b8; margin-top: 30px; font-weight: 700;">POR SEGURIDAD, NO COMPARTAS ESTOS DATOS CON NADIE.</p>
      </div>
    `
  });
}
