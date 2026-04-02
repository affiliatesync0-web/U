'use server';

import nodemailer from 'nodemailer';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Función servidora para obtener la configuración SMTP desde Firestore.
 * Importante: Se utiliza el SDK de cliente de Firebase pero ejecutado en entorno de servidor.
 */
async function getTransporter() {
  const { firestore } = initializeFirebase();
  
  try {
    const configDoc = await getDoc(doc(firestore, 'site_config', 'settings'));
    const config = configDoc.exists() ? configDoc.data() : {};

    // Credenciales por defecto si no hay configuración en DB
    const user = config.smtp_user || 'affiliatesync0@gmail.com';
    const pass = config.smtp_password || 'wagrmuphptnevpin';
    const host = config.smtp_host || 'smtp.gmail.com';
    const port = parseInt(config.smtp_port) || 465;
    const fromEmail = config.smtp_from_email || user;
    const fromName = config.smtp_from_name || 'Sync Connect';

    return {
      transporter: nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      }),
      fromEmail,
      fromName
    };
  } catch (error) {
    console.error('Error al obtener configuración SMTP desde Firestore:', error);
    // Fallback a configuración hardcoded en caso de error de acceso a DB
    return {
      transporter: nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: { user: 'affiliatesync0@gmail.com', pass: 'wagrmuphptnevpin' },
      }),
      fromEmail: 'affiliatesync0@gmail.com',
      fromName: 'Sync Connect'
    };
  }
}

/**
 * Envía un correo electrónico utilizando la configuración dinámica.
 */
export async function sendEmail({ to, subject, text, html }: { to: string, subject: string, text: string, html?: string }) {
  try {
    const { transporter, fromEmail, fromName } = await getTransporter();
    
    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject: `[${fromName}] ${subject}`,
      text,
      html: html || text.replace(/\n/g, '<br>'),
    });

    console.log('Email enviado correctamente:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('Error detallado al enviar email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Función para probar la conexión SMTP.
 */
export async function testEmailConfig(toEmail: string) {
  return await sendEmail({
    to: toEmail,
    subject: 'Prueba de Configuración SMTP - Sync Connect',
    text: 'Esta es una prueba del sistema de correos de Sync Connect. Si recibes esto, tu configuración es correcta.'
  });
}
