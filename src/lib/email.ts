
import nodemailer from 'nodemailer';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Envía un correo electrónico utilizando la configuración SMTP almacenada en Firestore.
 */
export async function sendEmail({ to, subject, text, html }: { to: string, subject: string, text: string, html?: string }) {
  try {
    const { firestore } = initializeFirebase();
    
    // Obtener la configuración desde la colección 'site_config' en Firestore
    const configDoc = await getDoc(doc(firestore, 'site_config', 'settings'));
    const config = configDoc.exists() ? configDoc.data() : {};

    // Valores por defecto si no existen en la base de datos
    const smtpHost = config.smtp_host || 'smtp.gmail.com';
    const smtpPort = parseInt(config.smtp_port || '465');
    const smtpUser = config.smtp_user || 'affiliatesync0@gmail.com';
    const smtpPass = config.smtp_password || 'wagrmuphptnevpin';
    const fromEmail = config.smtp_from_email || smtpUser;
    const fromName = config.smtp_from_name || 'Sync Connect';

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true para puerto 465 (SSL)
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const isSecurityEmail = subject.toLowerCase().includes('alerta') || subject.toLowerCase().includes('seguridad');

    // Diseño de plantilla HTML
    const professionalHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
        <div style="background-color: ${isSecurityEmail ? '#dc2626' : '#FF5D1B'}; padding: 40px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">${fromName}</h1>
        </div>
        <div style="padding: 30px; color: #333; line-height: 1.6;">
          <h2 style="color: #111;">${subject}</h2>
          <div style="font-size: 16px;">${html || text.replace(/\n/g, '<br>')}</div>
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #888; text-align: center;">
            <p>Este es un mensaje automático de ${fromName}.</p>
            <p>&copy; ${new Date().getFullYear()} ${fromName}. Todos los derechos reservados.</p>
          </div>
        </div>
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject: `[${fromName}] ${subject}`,
      text,
      html: professionalHtml,
    });

    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('Error enviando email:', error);
    return { success: false, error: error.message };
  }
}
