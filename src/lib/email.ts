
'use server';

import nodemailer from 'nodemailer';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Servicio de envío de correos electrónicos vía Gmail SMTP.
 * Primero intenta obtener las credenciales de Firestore (configuradas por el admin).
 * Si no existen, cae de vuelta a las variables de entorno.
 */
export async function sendEmail({ to, subject, text, html }: { to: string, subject: string, text: string, html?: string }) {
  try {
    const { firestore } = initializeFirebase();
    
    // Obtener configuración dinámica desde Firestore
    const userDoc = await getDoc(doc(firestore, 'site_config', 'gmail-user'));
    const passDoc = await getDoc(doc(firestore, 'site_config', 'gmail-pass'));

    const user = userDoc.exists() ? userDoc.data().value : (process.env.GMAIL_USER || 'tu-gmail@gmail.com');
    const pass = passDoc.exists() ? passDoc.data().value : (process.env.GMAIL_PASS || 'tu-password-de-aplicacion');

    if (!user || user.includes('tu-gmail')) {
      console.warn('Sync Connect: Gmail no está configurado correctamente en el panel administrativo.');
      return { success: false, error: 'Gmail not configured' };
    }

    // Configuración del transporte para Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: user,
        pass: pass,
      },
    });

    const info = await transporter.sendMail({
      from: `"Sync Connect Notifications" <${user}>`,
      to,
      subject,
      text,
      html: html || text.replace(/\n/g, '<br>'),
    });

    console.log('Sync Connect: Email enviado exitosamente a %s', to);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('CRITICAL ERROR: Error al enviar correo:', error);
    return { success: false, error: error.message };
  }
}
