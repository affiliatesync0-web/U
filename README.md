
# Sync Connect - Plataforma de Afiliados (Estilo Hotmart)

Esta es la versión profesional de **Sync Connect**, una plataforma optimizada para el mercado de Nicaragua con un diseño premium inspirado en **Hotmart**.

## 🛠️ Tecnologías Utilizadas
- **Next.js (App Router)**: Máximo rendimiento y SEO.
- **Firebase (Auth, Firestore, Storage)**: Gestión segura de usuarios, base de datos y archivos de video.
- **Firebase Admin SDK**: Automatización de gestión de usuarios desde el panel administrativo.
- **Genkit (IA)**: Inteligencia Artificial para descripciones de productos automáticas.
- **ShadCN UI & Tailwind**: Interfaz moderna con soporte de Modo Claro/Oscuro.
- **Nodemailer**: Envío de correos transaccionales y códigos de seguridad vía SMTP.

## 🚀 Guía de Configuración Crítica

### 1. Autenticación por Teléfono (SMS)
Para que el inicio de sesión por WhatsApp funcione, debes:
1. Ir a **Consola de Firebase** > **Authentication** > **Sign-in method**.
2. Habilitar el proveedor **Teléfono**.
3. En la sección **Dominios autorizados**, añade el dominio de tu app en Vercel (ej: `sync-connect.vercel.app`).
4. Si estás probando en desarrollo, añade tu número a la lista de "Números de teléfono para pruebas" con el código `123456`.

### 2. Variables de Entorno en Vercel
Configura estas variables para la automatización administrativa:
- `FIREBASE_PROJECT_ID`: `studio-9886993662-50a10`
- `FIREBASE_CLIENT_EMAIL`: (Tu cuenta de servicio)
- `FIREBASE_PRIVATE_KEY`: (Tu clave privada completa)
- `GEMINI_API_KEY`: Tu clave de Google AI.

---
© 2024 Sync Connect. Desarrollado para escalar negocios digitales en Nicaragua.
