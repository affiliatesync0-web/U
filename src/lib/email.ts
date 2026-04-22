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

export async function sendPasswordResetEmailCustom({ to, oobCode }: { to: string, oobCode: string }) {
  const content = `
    <div style="margin-bottom: 30px;">
      <p style="font-size: 16px; color: #475569; margin-bottom: 25px;">
        Has solicitado restablecer el acceso a tu cuenta. Utiliza el siguiente <strong>Código de Seguridad</strong> para desbloquear tu perfil en la pantalla de Sync Connect:
      </p>
      
      <div style="background-color: #131921; padding: 40px; border-radius: 24px; text-align: center; margin: 30px 0; border: 1px solid #ff9900;">
        <p style="color: #94a3b8; font-size: 10px; font-weight: 800; text-transform: uppercase; margin-bottom: 15px; letter-spacing: 2px;">CÓDIGO DE VERIFICACIÓN</p>
        <span style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 900; color: #ff9900; letter-spacing: 6px; display: block; word-break: break-all;">${oobCode}</span>
      </div>

      <p style="font-size: 14px; color: #64748b; margin-top: 30px; text-align: center;">
        Copia este código e ingrésalo manualmente en el portal para establecer tu nueva contraseña.
      </p>

      <p style="font-size: 11px; color: #94a3b8; line-height: 1.6; margin-top: 40px; border-top: 1px solid #f1f5f9; padding-top: 20px;">
        Este código es de un solo uso y expirará pronto por motivos de seguridad. Si no has solicitado este cambio, ignora este mensaje.
      </p>
    </div>
  `;

  return await sendEmail({
    to,
    subject: '🔐 Código de Seguridad: Sync Connect',
    text: `Tu código de seguridad Sync es: ${oobCode}.`,
    html: getEmailWrapper(content, "Verificación de Identidad"),
    title: "Acceso Seguro"
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