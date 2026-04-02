import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

/**
 * Obtiene la configuración SMTP desde la tabla SiteConfig
 */
async function getSmtpConfig() {
  const configs = await prisma.siteConfig.findMany({
    where: {
      key: {
        in: [
          "smtp_host",
          "smtp_port",
          "smtp_user",
          "smtp_password",
          "smtp_from_email",
          "smtp_from_name",
        ],
      },
    },
  });

  const configMap = configs.reduce((acc, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {} as Record<string, string>);

  return {
    host: configMap["smtp_host"],
    port: parseInt(configMap["smtp_port"] || "587"),
    user: configMap["smtp_user"],
    pass: configMap["smtp_password"],
    fromEmail: configMap["smtp_from_email"],
    fromName: configMap["smtp_from_name"] || "Soporte",
  };
}

/**
 * Crea un transportador de nodemailer dinámicamente con los datos de la DB
 */
async function createTransporter() {
  const config = await getSmtpConfig();

  if (!config.host || !config.user || !config.pass) {
    console.warn("Configuración SMTP incompleta en la base de datos. Usando configuración por defecto si existe.");
  }

  return {
    transporter: nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465, // true para 465, false para otros
      auth: {
        user: config.user,
        pass: config.pass,
      },
    }),
    from: `"${config.fromName}" <${config.fromEmail}>`,
  };
}

export const sendPasswordResetEmail = async (email: string, token: string) => {
  const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/new-password?token=${token}`;
  
  const { transporter, from } = await createTransporter();

  await transporter.sendMail({
    from: from,
    to: email,
    subject: "Restablece tu contraseña",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <h2 style="color: #1a202c;">Restablecer contraseña</h2>
        <p>Has solicitado restablecer tu contraseña en nuestro sitio.</p>
        <p>Haz clic en el siguiente botón para elegir una nueva contraseña. Este enlace expirará en 1 hora.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" 
             style="background-color: #3182ce; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Restablecer Contraseña
          </a>
        </div>
        <p>Si no solicitaste este cambio, puedes ignorar este correo de forma segura.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #718096;">Si tienes problemas con el botón, copia y pega este enlace en tu navegador:</p>
        <p style="font-size: 12px; color: #3182ce;">${resetLink}</p>
      </div>
    `,
  });
};

export const sendVerificationEmail = async (email: string, token: string) => {
  const confirmLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/new-verification?token=${token}`;

  const { transporter, from } = await createTransporter();

  await transporter.sendMail({
    from: from,
    to: email,
    subject: "Confirma tu correo electrónico",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <h2 style="color: #1a202c;">Verificación de cuenta</h2>
        <p>Gracias por registrarte. Por favor, confirma tu dirección de correo electrónico haciendo clic en el botón de abajo:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${confirmLink}" 
             style="background-color: #3182ce; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Confirmar Correo
          </a>
        </div>
        <p>Si no creaste esta cuenta, no es necesario realizar ninguna acción adicional.</p>
      </div>
    `,
  });
};
