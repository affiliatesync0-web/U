
'use server';

import nodemailer from 'nodemailer';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Motor de correos altamente optimizado para evitar la carpeta de SPAM.
 * Implementa estándares de confianza de Google y cabeceras técnicas avanzadas.
 */
export async function sendEmail({ to, subject, text, html }: { to: string, subject: string, text: string, html?: string }) {
  try {
    const { firestore } = initializeFirebase();
    
    // Obtenemos credenciales dinámicas de la base de datos (Colección site_config)
    const userDoc = await getDoc(doc(firestore, 'site_config', 'gmail-user'));
    const passDoc = await getDoc(doc(firestore, 'site_config', 'gmail-pass'));

    // Si el usuario vincula su Gmail en el panel, usamos sus datos. Si no, usamos el respaldo.
    const gmailUser = userDoc.exists() && userDoc.data().value ? userDoc.data().value : 'affiliatesync0@gmail.com';
    const gmailPass = passDoc.exists() && passDoc.data().value ? passDoc.data().value : 'wagrmuphptnevpin';

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    });

    const isSecurityEmail = subject.toLowerCase().includes('recuperación') || subject.toLowerCase().includes('recovery');

    // Diseño de plantilla HTML Premium (Aumenta la reputación ante filtros de Gmail)
    const professionalHtml = `
      <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f1f5f9; border-radius: 24px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="background-color: ${isSecurityEmail ? '#0f172a' : '#FF5D1B'}; padding: 50px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 900; letter-spacing: -1px; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">Sync Connect</h1>
          <p style="color: rgba(255,255,255,0.9); margin-top: 8px; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 3px;">Network Premium Nicaragua</p>
        </div>
        <div style="padding: 45px; color: #1e293b; line-height: 1.8;">
          <h2 style="color: #0f172a; margin-top: 0; font-size: 22px; font-weight: 800; border-left: 4px solid #FF5D1B; padding-left: 15px; margin-bottom: 25px;">${subject}</h2>
          
          ${isSecurityEmail ? `
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 25px; margin-bottom: 30px; text-align: center;">
              <p style="margin: 0; font-size: 14px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Escudo de Protección Activo</p>
              <p style="margin: 10px 0 0 0; font-size: 16px; color: #1e293b; font-weight: 500;">Estás recibiendo este protocolo porque solicitaste acceso a tu cuenta.</p>
            </div>
          ` : ''}

          <div style="font-size: 16px; color: #475569; white-space: pre-wrap;">${html || text.replace(/\n/g, '<br>')}</div>
          
          <div style="margin-top: 50px; padding: 25px; background-color: #f8fafc; border-radius: 16px; border: 1px solid #f1f5f9; text-align: center;">
            <p style="margin: 0; font-size: 14px; font-weight: bold; color: #64748b;">¿Necesitas soporte técnico?</p>
            <p style="margin: 8px 0 0 0; font-size: 13px; color: #94a3b8;">Estamos disponibles vía WhatsApp oficial o respondiendo a este correo.</p>
          </div>

          <div style="margin-top: 50px; padding-top: 30px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8; text-align: center;">
            <p style="margin-bottom: 8px;">Has recibido este mensaje automático por ser usuario registrado de <strong>Sync Connect</strong>.</p>
            <p style="margin: 0; font-weight: bold; color: #cbd5e1;">&copy; 2024 Sync Connect Nicaragua. Innovación en Marketing Digital.</p>
          </div>
        </div>
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"Sync Connect" <${gmailUser}>`,
      to,
      subject: `[Sync Connect] ${subject}`,
      text, 
      html: professionalHtml,
      headers: {
        'X-Entity-Ref-ID': Date.now().toString(),
        'X-Priority': '1',
        'List-Unsubscribe': `<mailto:${gmailUser}?subject=unsubscribe>`,
        'Importance': 'high'
      }
    });

    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('Email Error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Función para probar la configuración de correo desde el panel administrativo.
 */
export async function testEmailConfig(targetEmail: string) {
  return sendEmail({
    to: targetEmail,
    subject: "Prueba de Entregabilidad Exitosa",
    text: "Tu conexión con Sync Connect ha sido verificada. Este mensaje confirma que el motor de envíos está configurado correctamente y los correos llegarán de forma segura."
  });
}
