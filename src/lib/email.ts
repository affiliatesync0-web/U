
'use server';

import nodemailer from 'nodemailer';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Obtiene la configuración SMTP desde la base de datos Firestore.
 * Se espera que exista un documento en 'site_config/settings' con los campos:
 * smtp_host, smtp_port, smtp_user, smtp_password, smtp_from_email, smtp_from_name
 */
async function getTransporter() {
  const { firestore } = initializeFirebase();
  try {
    const configDoc = await getDoc(doc(firestore, 'site_config', 'settings'));
    
    // Si no existe configuración en la BD, usamos valores por defecto (deberías configurarlos en el panel)
    const config = configDoc.exists() ? configDoc.data() : {
      smtp_host: 'smtp.gmail.com',
      smtp_port: 465,
      smtp_user: 'affiliatesync0@gmail.com',
      smtp_password: 'wagrmuphptnevpin',
      smtp_from_email: 'affiliatesync0@gmail.com',
      smtp_from_name: 'Sync Connect'
    };

    return {
      transporter: nodemailer.createTransport({
        host: config.smtp_host || 'smtp.gmail.com',
        port: parseInt(config.smtp_port) || 465,
        secure: parseInt(config.smtp_port) === 465,
        auth: {
          user: config.smtp_user,
          pass: config.smtp_password,
        },
      }),
      fromEmail: config.smtp_from_email || config.smtp_user,
      fromName: config.smtp_from_name || 'Sync Connect'
    };
  } catch (error) {
    console.error('Error al obtener configuración SMTP:', error);
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
