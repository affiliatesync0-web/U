'use server';

import nodemailer from 'nodemailer';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Obtiene la configuración SMTP desde Firestore.
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
    console.error("Error SMTP Config:", error);
  }
  
  return {
    host: 'smtp.gmail.com',
    port: 465,
    user: 'affiliatesync0@gmail.com',
    pass: 'wagrmuphptnevpin', 
    fromName: 'Sync Connect'
  };
}

function getEmailWrapper(content: string, title: string = "Sync Connect") {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #f1f5f9; border-radius: 32px; overflow: hidden; background-color: #ffffff; box-shadow: 0 20px 50px rgba(0,0,0,0.05);">
      <div style="background: linear-gradient(135deg, #131921 0%, #232f3e 100%); padding: 50px 40px; text-align: center;">
        <h1 style="margin: 0; color: #ff9900; font-size: 28px; font-weight: 900; letter-spacing: -1px; font-style: italic;">Sync<span style="color: #ffffff;">.Connect</span></h1>
        <p style="margin: 10px 0 0 0; color: #94a3b8; font-size: 10px; text-transform: uppercase; font-weight: 800; letter-spacing: 3px;">Elite Network System</p>
      </div>
      <div style="padding: 50px 40px; line-height: 1.8; color: #334155; font-size: 16px; background-color: #ffffff;">
        <div style="margin-bottom: 30px;">
           <h2 style="color: #0f172a; font-size: 22px; font-weight: 800; margin: 0 0 20px 0; text-transform: uppercase; letter-spacing: -0.5px;">${title}</h2>
        </div>
        ${content}
      </div>
      <div style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #f1f5f9;">
        <p style="margin: 0; font-weight: 800; font-size: 10px; color: #cbd5e1; text-transform: uppercase; letter-spacing: 1px;">&copy; ${new Date().getFullYear()} Sync Connect Nicaragua. Todos los derechos reservados.</p>
      </div>
    </div>
  `;
}

export async function sendEmail({ to, subject, text, html, title }: { to: string, subject: string, text: string, html?: string, title?: string }) {
  try {
    const config = await getSmtpConfig();
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: { user: config.user, pass: config.pass },
      tls: { rejectUnauthorized: false }
    });

    const info = await transporter.sendMail({
      from: `"${config.fromName}" <${config.user}>`,
      to,
      subject,
      text,
      html: html || getEmailWrapper(text.split('\n').map(line => `<p style="margin-bottom: 15px;">${line}</p>`).join(''), title || subject),
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function sendPasswordResetEmailCustom({ to, link }: { to: string, link: string }) {
  const content = `
    <div style="margin-bottom: 30px; text-align: center;">
      <p style="font-size: 16px; color: #475569; margin-bottom: 35px; text-align: left;">
        Has solicitado restablecer el acceso a tu cuenta en <strong>Sync Connect</strong>. Para continuar y establecer tu nueva contraseña de forma segura, haz clic en el botón de abajo:
      </p>
      
      <div style="margin: 40px 0;">
        <a href="${link}" style="background: linear-gradient(135deg, #ff9900 0%, #e68a00 100%); color: #ffffff; padding: 22px 40px; border-radius: 18px; text-decoration: none; font-weight: 900; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; display: inline-block; box-shadow: 0 10px 30px rgba(255, 153, 0, 0.3);">
          Establecer Nueva Contraseña
        </a>
      </div>

      <p style="font-size: 13px; color: #94a3b8; margin-top: 40px; text-align: left;">
        Si el botón no funciona, copia y pega el siguiente enlace en tu navegador. Recuerda que este enlace es privado y ocurre exclusivamente dentro de nuestra plataforma:
      </p>
      <p style="font-size: 11px; color: #0f172a; word-break: break-all; background: #f8fafc; padding: 15px; border-radius: 12px; margin-top: 10px; border: 1px solid #f1f5f9;">
        ${link}
      </p>

      <p style="font-size: 11px; color: #94a3b8; line-height: 1.6; margin-top: 40px; border-top: 1px solid #f1f5f9; padding-top: 20px; text-align: left;">
        Este enlace expirará pronto por motivos de seguridad. Si no has solicitado este cambio, puedes ignorar este correo de forma segura.
      </p>
    </div>
  `;

  return await sendEmail({
    to,
    subject: '🔐 Recuperación de Acceso: Sync Connect',
    text: `Usa este enlace para cambiar tu contraseña: ${link}`,
    html: getEmailWrapper(content, "Restaurar Contraseña"),
    title: "Seguridad de Cuenta"
  });
}

export async function sendAccountActivatedEmail({ to, name }: { to: string, name: string }) {
  const content = `<p>¡Hola <strong>${name}</strong>!</p><p>Tu cuenta de <strong>Socio Platinum</strong> ha sido aprobada. Ya puedes empezar a generar comisiones.</p>`;
  return await sendEmail({ to, subject: '✅ Cuenta Activada', text: 'Tu cuenta ha sido activada.', html: getEmailWrapper(content, "¡Bienvenido!"), title: "Activación Sync" });
}

export async function sendOrderConfirmedEmail({ to, name, product, isPhysical }: { to: string, name: string, product: string, isPhysical: boolean }) {
  const content = `<p>Hola ${name}, pedido registrado: <strong>${product}</strong>. ${isPhysical ? 'Tu paquete está en camino (Pago Contra Entrega).' : 'Acceso digital en validación.'}</p>`;
  return await sendEmail({ to, subject: `🛒 Pedido Confirmado - ${product}`, text: 'Pedido registrado.', html: getEmailWrapper(content, "Estado del Pedido") });
}

export async function sendPaymentNotification({ to, name, amount, bank }: { to: string, name: string, amount: number, bank: string }) {
  const content = `<div style="text-align:center;"><p>Pago de comisiones realizado:</p><h3 style="font-size:40px; color:#16a34a;">$${amount.toFixed(2)}</h3><p>BANCO: ${bank.toUpperCase()}</p></div>`;
  return await sendEmail({ to, subject: '💰 Pago de Comisiones', text: `Pago de $${amount.toFixed(2)} realizado.`, html: getEmailWrapper(content, "Liquidación Exitosa") });
}

export async function testEmailConfig(to: string) {
  return await sendEmail({ to, subject: '🧪 Prueba de Sistema', text: 'Conexión SMTP verificada.', title: "Test Ok" });
}

export async function sendNewPasswordAdmin({ to, name, newPassword }: { to: string, name: string, newPassword: string }) {
  const content = `<p>Tu nueva clave temporal es:</p><h2 style="text-align:center; letter-spacing:5px;">${newPassword}</h2>`;
  return await sendEmail({ to, subject: '🔐 Nueva Contraseña', text: `Tu clave es: ${newPassword}`, html: getEmailWrapper(content, "Seguridad") });
}
