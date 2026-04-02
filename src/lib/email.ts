'use server';

import nodemailer from 'nodemailer';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Obtiene la configuración SMTP desde la base de datos Firestore.
 */
async function getTransporter() {
  const { firestore } = initializeFirebase();
  
  try {
    const configDoc = await getDoc(doc(firestore, 'site_config', 'settings'));
    const config = configDoc.exists() ? configDoc.data() : {};

    // Valores por defecto o los configurados en el panel
    const user = config.smtp_user || 'affiliatesync0@gmail.com';
    const pass = config.smtp_password || 'wagrmuphptnevpin';
    const host = config.smtp_host || 'smtp.gmail.com';
    const port = parseInt(config.smtp_port) || 465;
    const fromEmail = config.smtp_from_email || user;
    const fromName = config.smtp_from_name || 'Sync Connect';

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true para puerto 465, false para otros como 587
      auth: {
        user,
        pass,
      },
    });

    return { transporter, fromEmail, fromName };
  } catch (error) {
    console.error('Error al obtener configuración SMTP desde Firestore:', error);
    throw error;
  }
}

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

    console.log('Email enviado: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('Error enviando email:', error);
    return { success: false, error: error.message };
  }
}

export async function testEmailConfig(toEmail: string) {
  return await sendEmail({
    to: toEmail,
    subject: 'Prueba de Configuración SMTP',
    text: 'Si recibes este correo, la configuración de tu servidor de correo es correcta.'
  });
}
