'use server';

import nodemailer from 'nodemailer';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

async function getTransporter() {
  const { firestore } = initializeFirebase();
  
  try {
    const configDoc = await getDoc(doc(firestore, 'site_config', 'settings'));
    const config = configDoc.exists() ? configDoc.data() : {};

    // Valores por defecto (los que proporcionaste) o los configurados en el panel
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
    console.error('Error al obtener configuración SMTP:', error);
    throw new Error('Error al configurar el servidor de correo');
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
