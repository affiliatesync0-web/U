
# Sync Connect - Plataforma de Afiliados (Estilo Hotmart)

Esta es la versión profesional de **Sync Connect**, una plataforma optimizada para el mercado de Nicaragua con un diseño premium inspirado en **Hotmart**.

## 🛠️ Tecnologías Utilizadas
- **Next.js (App Router)**: Máximo rendimiento y SEO.
- **Firebase (Auth, Firestore, Storage)**: Gestión segura de usuarios, base de datos y archivos de video.
- **Firebase Admin SDK**: Automatización de gestión de usuarios desde el panel administrativo.
- **Genkit (IA)**: Inteligencia Artificial para descripciones de productos automáticas.
- **ShadCN UI & Tailwind**: Interfaz moderna con soporte de Modo Claro/Oscuro.
- **Nodemailer**: Envío de correos transaccionales y códigos de seguridad vía SMTP.

## 🚀 Guía de Despliegue en Vercel

### 1. Variables de Envorno Críticas
Para que el cambio de contraseñas automático y la conexión con Firebase funcionen en Vercel, debes configurar estas variables:

- `FIREBASE_PROJECT_ID`: `studio-9886993662-50a10`
- `FIREBASE_CLIENT_EMAIL`: (Cuenta de servicio de Firebase)
- `FIREBASE_PRIVATE_KEY`: (Clave privada completa con `-----BEGIN PRIVATE KEY-----`)
- `GEMINI_API_KEY`: Tu clave de Google AI.

### 2. Configuración de Correo (Gmail SMTP)
1. Ve a tu cuenta de Google > Seguridad > Activa **Verificación en 2 pasos**.
2. Busca **Contraseñas de Aplicación** y genera una clave de 16 dígitos para "Correo".
3. Pega esa clave en tu panel administrativo de Sync Connect (Sección Identidad).

---
© 2024 Sync Connect. Desarrollado para escalar negocios digitales en Nicaragua.
