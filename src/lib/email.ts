'use server';

import nodemailer from 'nodemailer';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Servicio de envío de correos electrónicos vía Gmail SMTP.
 * Optimizado para funcionar en el servidor recuperando credenciales de Firestore.
 */
export async function sendEmail({ to, subject, text, html }: { to: string, subject: string, text: string, html?: string }) {
  try {
    const { firestore } = initializeFirebase();
    
    // Obtener configuración dinámica desde Firestore
    const userDoc = await getDoc(doc(firestore, 'site_config', 'gmail-user'));
    const passDoc = await getDoc(doc(firestore, 'site_config', 'gmail-pass'));

    const user = userDoc.exists() ? userDoc.data().value : (process.env.GMAIL_USER || '');
    const pass = passDoc.exists() ? passDoc.data().value : (process.env.GMAIL_PASS || '');

    if (!user || !pass || user.includes('tu-gmail')) {
      console.warn('Sync Connect: Credenciales de Gmail no configuradas.');
      return { success: false, error: 'Configura tu Gmail en el Panel de Administración -> Diseño.' };
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: user,
        pass: pass,
      },
    });

    const info = await transporter.sendMail({
      from: `"Sync Connect" <${user}>`,
      to,
      subject,
      text,
      html: html || text.replace(/\n/g, '<br>'),
    });

    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('Error al enviar correo:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Función para probar la configuración de correo desde el panel.
 */
export async function testEmailConfig(targetEmail: string) {
  return sendEmail({
    to: targetEmail,
    subject: "Sync Connect - Prueba de Conexión",
    text: "¡Felicidades! Tu configuración de Gmail en Sync Connect funciona perfectamente. A partir de ahora, tus afiliados y compradores recibirán notificaciones automáticas desde esta cuenta."
  });
}
