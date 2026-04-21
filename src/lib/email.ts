'use server';

import nodemailer from 'nodemailer';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Obtiene la configuración SMTP desde Firestore.
 * Prioriza siempre lo configurado por el usuario en el panel de diseño.
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
 * Plantilla Base HTML para todos los correos.
 */
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
        <div style="margin-top: 15px;">
           <span style="display: inline-block; padding: 4px 12px; background-color: #e2e8f0; border-radius: 10px; color: #64748b; font-size: 9px; font-weight: 900;">SISTEMA DE SEGURIDAD SSL</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Envía un correo electrónico utilizando la configuración SMTP activa.
 */
export async function sendEmail({ to, subject, text, html, title }: { to: string, subject: string, text: string, html?: string, title?: string }) {
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
      tls: {
        rejectUnauthorized: false
      }
    });

    const fromAddress = `"${config.fromName}" <${config.user}>`;
    const finalHtml = html || getEmailWrapper(text.split('\n').map(line => `<p style="margin-bottom: 15px;">${line}</p>`).join(''), title || subject);

    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      text,
      html: finalHtml,
    });

    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("DETALLE DE ERROR SMTP:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Envía el correo de recuperación de contraseña con diseño premium y botón funcional.
 */
export async function sendPasswordResetEmailCustom({ to, oobCode }: { to: string, oobCode: string }) {
  const resetLink = `https://affiliatesync.vercel.app/auth/reset-password?oobCode=${oobCode}`;
  
  const content = `
    <div style="margin-bottom: 30px;">
      <p style="font-size: 16px; color: #475569; margin-bottom: 25px;">
        Has solicitado restablecer el acceso a tu cuenta en <strong>Sync Connect Nicaragua</strong>. 
        Para garantizar la seguridad de tu perfil, hemos generado un enlace de un solo uso.
      </p>
      
      <div style="text-align: center; margin: 45px 0;">
        <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #ff9900 0%, #f3a847 100%); color: #000000; padding: 22px 45px; border-radius: 18px; text-decoration: none; font-weight: 900; font-size: 15px; text-transform: uppercase; box-shadow: 0 15px 35px rgba(255,153,0,0.3); border: 1px solid rgba(0,0,0,0.05);">
          Establecer Nueva Contraseña
        </a>
      </div>

      <p style="font-size: 14px; color: #64748b; background-color: #f8fafc; padding: 20px; border-radius: 12px; border-left: 4px solid #ff9900;">
        <strong>Nota de Seguridad:</strong> Este botón es válido por 60 minutos. Si no has solicitado este cambio, por favor ignora este correo de inmediato.
      </p>
    </div>
    
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #f1f5f9;">
      <p style="font-size: 11px; color: #94a3b8; text-align: center; line-height: 1.5;">
        Si el botón de arriba no funciona, copia y pega este enlace en tu navegador:<br>
        <span style="color: #3b82f6; word-break: break-all;">${resetLink}</span>
      </p>
    </div>
  `;

  return await sendEmail({
    to,
    subject: '🔐 Acción Requerida: Restablecer Contraseña',
    text: `Usa este enlace para cambiar tu contraseña: ${resetLink}`,
    html: getEmailWrapper(content, "Recuperación de Acceso"),
    title: "Seguridad Sync Connect"
  });
}

/**
 * Notifica al afiliado que su cuenta ha sido activada.
 */
export async function sendAccountActivatedEmail({ to, name }: { to: string, name: string }) {
  const content = `
    <p>¡Hola <strong>${name}</strong>!</p>
    <p>Tenemos el placer de informarte que tu solicitud de <strong>Socio Platinum</strong> ha sido aprobada con éxito tras la validación de tus datos.</p>
    <p>A partir de este momento, tienes acceso total al marketplace y al laboratorio de ventas para empezar a generar comisiones.</p>
    <div style="text-align: center; margin: 40px 0;">
      <a href="https://affiliatesync.vercel.app/auth/login" style="display: inline-block; background-color: #131921; color: #ffffff; padding: 20px 40px; border-radius: 16px; text-decoration: none; font-weight: 900; font-size: 14px; text-transform: uppercase;">
        Entrar al Panel Maestro
      </a>
    </div>
  `;

  return await sendEmail({
    to,
    subject: '✅ Cuenta Activada - Sync Connect',
    text: `¡Bienvenido! Tu cuenta ha sido activada.`,
    html: getEmailWrapper(content, "¡Bienvenido a la Red!"),
    title: "Activación de Cuenta"
  });
}

/**
 * Notificación de compra para el cliente.
 */
export async function sendOrderConfirmedEmail({ to, name, product, isPhysical }: { to: string, name: string, product: string, isPhysical: boolean }) {
  const content = `
    <p>Hola <strong>${name}</strong>,</p>
    <p>Hemos registrado correctamente tu pedido de: <strong>${product}</strong>.</p>
    <div style="background-color: #f1f5f9; padding: 25px; border-radius: 20px; border-left: 6px solid #ff9900; margin: 30px 0;">
       <p style="margin: 0; font-size: 14px; font-weight: 700; color: #1e293b;">
         ${isPhysical 
           ? "Tu pedido físico está siendo coordinado. Un repartidor te contactará para el pago en efectivo al recibir." 
           : "Tu acceso digital está siendo validado. Recibirás un enlace de activación en breve."}
       </p>
    </div>
    <p>Gracias por confiar en la tecnología de Sync Connect para tu formación y consumo.</p>
  `;

  return await sendEmail({
    to,
    subject: `🛒 Confirmación de Pedido - ${product}`,
    text: `Tu pedido ha sido registrado con éxito.`,
    html: getEmailWrapper(content, "Registro de Compra"),
    title: "Estado del Pedido"
  });
}

/**
 * Envía una notificación de pago realizado a un afiliado.
 */
export async function sendPaymentNotification({ to, name, amount, bank }: { to: string, name: string, amount: number, bank: string }) {
  const content = `
    <p>¡Felicidades <strong>${name}</strong>!</p>
    <p>Se ha procesado un nuevo pago de comisiones hacia tu cuenta bancaria.</p>
    <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); padding: 30px; border-radius: 24px; border: 1px solid #bbf7d0; margin: 30px 0; text-align: center;">
      <p style="margin: 0 0 10px 0; font-size: 11px; font-weight: 900; color: #16a34a; text-transform: uppercase; letter-spacing: 1px;">Monto Liquidado</p>
      <span style="font-size: 42px; font-weight: 900; color: #166534; letter-spacing: -2px;">$${amount.toFixed(2)}</span>
      <p style="margin: 15px 0 0 0; font-size: 12px; font-weight: 800; color: #16a34a;">BANCO: ${bank.toUpperCase()}</p>
    </div>
    <p>Tu saldo en plataforma se ha actualizado. ¡Sigue escalando tus resultados!</p>
  `;

  return await sendEmail({
    to,
    subject: `💰 Pago de Comisiones - Sync Connect`,
    text: `Has recibido un pago de $${amount.toFixed(2)}.`,
    html: getEmailWrapper(content, "Liquidación Exitosa"),
    title: "Notificación de Pago"
  });
}

/**
 * Envía un correo de prueba para verificar la configuración SMTP.
 */
export async function testEmailConfig(to: string) {
  const content = `
    <p>¡Éxito total! La configuración de tu servidor de correo en Sync Connect está operando correctamente.</p>
    <div style="background: #f8fafc; padding: 25px; border-radius: 20px; border: 1px solid #e2e8f0; margin: 30px 0; text-align: center;">
      <p style="margin: 0; font-size: 13px; font-weight: 800; color: #0f172a; text-transform: uppercase;">Estado: CONECTADO</p>
      <p style="margin: 5px 0 0 0; font-size: 11px; color: #64748b;">${new Date().toLocaleString()}</p>
    </div>
  `;
  return await sendEmail({
    to,
    subject: '🧪 Prueba de Sistema - Sync Connect',
    text: `Conexión SMTP verificada exitosamente.`,
    html: getEmailWrapper(content, "Test de Conectividad"),
    title: "Prueba de Servidor"
  });
}

/**
 * Envía una nueva contraseña generada por el administrador.
 */
export async function sendNewPasswordAdmin({ to, name, newPassword }: { to: string, name: string, newPassword: string }) {
  const content = `
    <p>Hola <strong>${name}</strong>,</p>
    <p>Un administrador ha restablecido tus credenciales de acceso por motivos de seguridad o mantenimiento.</p>
    <div style="background: #f1f5f9; padding: 30px; border-radius: 24px; border: 1px solid #e2e8f0; margin: 30px 0; text-align: center;">
      <p style="margin: 0 0 10px 0; font-size: 10px; font-weight: 900; color: #64748b; text-transform: uppercase;">Tu Nueva Clave Temporal</p>
      <span style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 900; color: #ff5d1b; letter-spacing: 4px;">${newPassword}</span>
    </div>
    <p style="font-size: 12px; color: #ef4444; font-weight: 700;">AVISO: Cambia esta contraseña inmediatamente después de iniciar sesión.</p>
  `;
  return await sendEmail({
    to,
    subject: '🔐 Nuevas Credenciales - Sync Connect',
    text: `Tu nueva clave es: ${newPassword}`,
    html: getEmailWrapper(content, "Acceso Restablecido"),
    title: "Seguridad de Usuario"
  });
}
