'use server';

import nodemailer from 'nodemailer';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Motor de correos optimizado para evitar SPAM.
 * Implementa plantillas profesionales y cabeceras de confianza.
 */
export async function sendEmail({ to, subject, text, html }: { to: string, subject: string, text: string, html?: string }) {
  try {
    const { firestore } = initializeFirebase();
    
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

    // Plantilla HTML profesional para mejorar reputación ante filtros de SPAM
    const professionalHtml = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #FF5D1B; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Sync Connect</h1>
        </div>
        <div style="padding: 40px; color: #1e293b; line-height: 1.6;">
          <h2 style="color: #0f172a; margin-top: 0;">${subject}</h2>
          <div style="white-space: pre-wrap;">${html || text.replace(/\n/g, '<br>')}</div>
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #64748b; text-align: center;">
            <p>Este es un mensaje transaccional enviado por <strong>Sync Connect Nicaragua</strong>.</p>
            <p>Si no esperabas este correo, por favor ignóralo.</p>
            <p style="margin-top: 10px;">&copy; 2024 Sync Connect. Todos los derechos reservados.</p>
          </div>
        </div>
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"Sync Connect" <${gmailUser}>`,
      to,
      subject: `[Sync Connect] ${subject}`,
      text, // Fallback para dispositivos antiguos
      html: professionalHtml,
      headers: {
        'X-Entity-Ref-ID': Date.now().toString(),
        'X-Priority': '3', // Normal priority para no parecer urgente/spam
      }
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
    subject: "Verificación de Conexión Exitosa",
    text: "Felicidades. Tu conexión con Sync Connect ha sido verificada correctamente. Tus correos ahora llegarán de forma segura a tus destinatarios."
  });
}
