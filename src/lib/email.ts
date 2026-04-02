'use server';

import nodemailer from 'nodemailer';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Función para obtener la configuración SMTP desde la base de datos
 */
async function getEmailConfig() {
  const { firestore } = initializeFirebase();
  try {
    const configDoc = await getDoc(doc(firestore, 'site_config', 'settings'));
    if (configDoc.exists()) {
      return configDoc.data();
    }
  } catch (error) {
    console.error("Error al obtener config de correo:", error);
  }
  return null;
}

/**
 * Función para obtener el logo del sitio
 */
async function getSiteLogo() {
  const { firestore } = initializeFirebase();
  try {
    const logoDoc = await getDoc(doc(firestore, 'site_config', 'site-logo'));
    if (logoDoc.exists()) {
      return logoDoc.data().imageUrl;
    }
  } catch (error) {
    console.error("Error al obtener logo:", error);
  }
  return null;
}

export async function sendEmail({ to, subject, text, html }: { to: string, subject: string, text: string, html?: string }) {
  const config = await getEmailConfig();
  const siteLogo = await getSiteLogo();

  // Si no hay configuración, no podemos enviar
  if (!config || !config.smtp_user) {
    console.error("Configuración de correo no encontrada en la base de datos.");
    return { success: false, error: "Configuración de correo no disponible" };
  }

  const transporter = nodemailer.createTransport({
    host: config.smtp_host || 'smtp.gmail.com',
    port: parseInt(config.smtp_port) || 465,
    secure: config.smtp_port === '465', // true for 465, false for other ports
    auth: {
      user: config.smtp_user,
      pass: config.smtp_password,
    },
  });

  const fromName = config.smtp_from_name || 'Sync Connect';
  const fromEmail = config.smtp_from_email || config.smtp_user;

  // Si no se proporciona HTML, creamos uno básico pero elegante
  const emailHtml = html || `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
      <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-bottom: 1px solid #eee;">
        ${siteLogo ? `<img src="${siteLogo}" alt="Logo" style="max-height: 50px; margin-bottom: 10px;">` : ''}
        <h1 style="margin: 0; color: #1e293b; font-size: 20px;">${fromName}</h1>
      </div>
      <div style="padding: 30px; line-height: 1.6; color: #334155;">
        ${text.split('\n').map(line => `<p>${line}</p>`).join('')}
      </div>
      <div style="background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #eee;">
        &copy; ${new Date().getFullYear()} ${fromName}. Todos los derechos reservados.
      </div>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject: `[${fromName}] ${subject}`,
      text, // Versión en texto plano
      html: emailHtml, // Versión en HTML
    });

    console.log('Email enviado:', info.messageId);
    return { success: true };
  } catch (error: any) {
    console.error('Error al enviar email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Función para probar la configuración desde el panel
 */
export async function testEmailConfig() {
  const config = await getEmailConfig();
  if (!config) return { success: false, error: "No hay configuración" };
  
  return await sendEmail({
    to: config.smtp_user,
    subject: 'Prueba de configuración',
    text: 'Si recibes este correo, la configuración de tu servidor SMTP funciona correctamente.'
  });
}
