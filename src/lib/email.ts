'use server';

import nodemailer from 'nodemailer';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Servicio de envío de correos electrónicos vía Gmail SMTP.
 * Utiliza por defecto la cuenta affiliatesync0@gmail.com configurada por el usuario.
 */
export async function sendEmail({ to, subject, text, html }: { to: string, subject: string, text: string, html?: string }) {
  try {
    const { firestore } = initializeFirebase();
    
    // Intentamos obtener configuración dinámica desde Firestore
    const userDoc = await getDoc(doc(firestore, 'site_config', 'gmail-user'));
    const passDoc = await getDoc(doc(firestore, 'site_config', 'gmail-pass'));

    // Credenciales fijas proporcionadas por el usuario como fallback y default
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
    console.error('CRITICAL ERROR: Email service failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Función para probar la configuración de correo desde el panel administrativo.
 */
export async function testEmailConfig(targetEmail: string) {
  return sendEmail({
    to: targetEmail,
    subject: "Sync Connect - Prueba de Conexión SMTP",
    text: "¡Felicidades! Tu conexión con Gmail (affiliatesync0@gmail.com) es exitosa. Todos los correos de bienvenida y ventas saldrán ahora desde esta cuenta."
  });
}
