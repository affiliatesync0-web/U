'use server';

import nodemailer from 'nodemailer';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

const { firestore } = initializeFirebase();

async function getTransporter() {
  try {
    // Obtenemos la configuración desde la colección site_config
    const configDoc = await getDoc(doc(firestore, 'site_config', 'settings'));
    
    if (!configDoc.exists()) {
      throw new Error('Configuración SMTP no encontrada en la base de datos.');
    }

    const config = configDoc.data();

    return nodemailer.createTransport({
      host: config.smtp_host || 'smtp.gmail.com',
      port: parseInt(config.smtp_port) || 465,
      secure: parseInt(config.smtp_port) === 465, // true para 465, false para otros como 587
      auth: {
        user: config.smtp_user,
        pass: config.smtp_password,
      },
    });
  } catch (error) {
    console.error('Error al configurar el transportador:', error);
    throw error;
  }
}

export async function sendEmail({ to, subject, text, html }: { to: string, subject: string, text: string, html?: string }) {
  try {
    const transporter = await getTransporter();
    
    // Obtenemos los datos de remitente de la misma configuración
    const configDoc = await getDoc(doc(firestore, 'site_config', 'settings'));
    const config = configDoc.data() || {};
    
    const fromEmail = config.smtp_from_email || config.smtp_user;
    const fromName = config.smtp_from_name || 'Sync Connect';

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
