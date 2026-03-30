
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
      <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f1f5f9; border-radius: 16px; overflow: hidden; background-color: #ffffff;">
        <div style="background-color: #FF5D1B; padding: 40px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -1px;">Sync Connect</h1>
          <p style="color: rgba(255,255,255,0.8); margin-top: 5px; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px;">Network Nicaragua</p>
        </div>
        <div style="padding: 40px; color: #334155; line-height: 1.6;">
          <h2 style="color: #0f172a; margin-top: 0; font-size: 20px; font-weight: 800;">${subject}</h2>
          <div style="font-size: 15px; color: #475569; white-space: pre-wrap;">${html || text.replace(/\n/g, '<br>')}</div>
          
          <div style="margin-top: 40px; padding: 20px; background-color: #f8fafc; rounded: 12px; border: 1px solid #f1f5f9;">
            <p style="margin: 0; font-size: 13px; font-weight: bold; color: #64748b;">¿Necesitas ayuda?</p>
            <p style="margin: 5px 0 0 0; font-size: 12px; color: #94a3b8;">Responde a este correo o contáctanos por WhatsApp oficial.</p>
          </div>

          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #f1f5f9; font-size: 11px; color: #94a3b8; text-align: center;">
            <p style="margin-bottom: 5px;">Has recibido este mensaje porque eres parte de la red <strong>Sync Connect</strong>.</p>
            <p style="margin: 0;">&copy; 2024 Sync Connect Nicaragua. Todos los derechos reservados.</p>
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
        'X-Priority': '3', // Normal priority
        'List-Unsubscribe': `<mailto:${gmailUser}?subject=unsubscribe>`,
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
    subject: "Prueba de Conexión Segura",
    text: "Felicidades. Tu conexión con Sync Connect ha sido verificada correctamente. Tus correos ahora llegarán de forma segura a tus destinatarios."
  });
}
