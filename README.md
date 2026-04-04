
# Sync Connect - Plataforma de Afiliados (Estilo Hotmart)

Esta es la versión profesional de **Sync Connect**, una plataforma optimizada para el mercado de Nicaragua con un diseño premium inspirado en **Hotmart**.

## 🛠️ Tecnologías Utilizadas
- **Next.js (App Router)**: Máximo rendimiento y SEO.
- **Firebase (Auth, Firestore, Storage)**: Gestión segura de usuarios, base de datos y archivos de video.
- **Genkit (IA)**: Inteligencia Artificial para descripciones de productos automáticas.
- **ShadCN UI & Tailwind**: Interfaz moderna con soporte de Modo Claro/Oscuro.
- **Nodemailer**: Envío de correos transaccionales y códigos de seguridad vía SMTP.

## 🚀 Guía de Despliegue en Vercel

### 1. Variables de Entorno (Environment Variables)
Al subir a Vercel, asegúrate de configurar las siguientes variables en el dashboard de Vercel > Settings > Environment Variables:

- `GEMINI_API_KEY`: Tu clave de Google AI para el asistente de copywriting.
- `NEXT_PUBLIC_FIREBASE_API_KEY`: (Opcional, si no usas el config.ts).

### 2. Configuración de Correo (Gmail SMTP)
El sistema está diseñado para usar el correo administrativo que tú mismo configures desde el panel de **Diseño**.

**Pasos críticos:**
1. Ve a tu cuenta de Google > Seguridad.
2. Activa la **Verificación en 2 pasos**.
3. Busca la opción **Contraseñas de Aplicación**.
4. Genera una clave de 16 dígitos para "Correo".
5. Pega esa clave en tu panel administrativo de Sync Connect.

### 3. Recuperación de Contraseña (Firebase Console)
Para que los correos de restablecimiento automáticos de Firebase funcionen con tu Gmail:
👉 **[Configurar SMTP en Consola de Firebase](https://console.firebase.google.com/project/studio-9886993662-50a10/authentication/emails)**

**Datos a ingresar:**
- **SMTP Server**: `smtp.gmail.com`
- **Port**: `465` (SSL)
- **Username**: Tu correo Gmail.
- **Password**: Tu contraseña de aplicación de 16 dígitos.

---
© 2024 Sync Connect. Desarrollado para escalar negocios digitales en Nicaragua.
