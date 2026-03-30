'use server';

import nodemailer from 'nodemailer';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Servicio de envío de correos electrónicos vía Gmail SMTP.
 * Configurado con las credenciales proporcionadas por el usuario.
 */
export async function sendEmail({ to, subject, text, html }: { to: string, subject: string, text: string, html?: string }) {
  try {
    const { firestore } = initializeFirebase();
    
    // Intentamos obtener configuración dinámica desde Firestore, si no existe usamos las credenciales fijas
    const userDoc = await getDoc(doc(firestore, 'site_config', 'gmail-user'));
    const passDoc = await getDoc(doc(firestore, 'site_config', 'gmail-pass'));

    const gmailUser = userDoc.exists() && userDoc.data().value ? userDoc.data().value : 'affiliatesync0@gmail.com';
    const gmailPass = passDoc.exists() && passDoc.data().value ? passDoc.data().value : 'wagrmuphptnevpin';

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    });

    const info = await transporter.sendMail({
      from: `"Sync Connect" <${gmailUser}>`,
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
    text: "¡Felicidades! La configuración de Gmail (affiliatesync0@gmail.com) funciona perfectamente. Los correos de bienvenida y ventas saldrán desde esta cuenta."
  });
}
