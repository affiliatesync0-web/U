
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

### 1. Variables de Entorno Críticas
Para que el cambio de contraseñas automático funcione en Vercel, debes configurar estas variables en el Dashboard de Vercel:

- `FIREBASE_PROJECT_ID`: `studio-9886993662-50a10`
- `FIREBASE_CLIENT_EMAIL`: (Lo obtienes al generar la clave de cuenta de servicio en Firebase)
- `FIREBASE_PRIVATE_KEY`: (La clave privada completa, incluyendo `-----BEGIN PRIVATE KEY-----`)
- `GEMINI_API_KEY`: Tu clave de Google AI.

### 2. Configuración de Correo (Gmail SMTP)
El sistema está diseñado para usar el correo administrativo que tú mismo configures desde el panel de **Identidad**.

**Pasos críticos:**
1. Ve a tu cuenta de Google > Seguridad.
2. Activa la **Verificación en 2 pasos**.
3. Busca la opción **Contraseñas de Aplicación**.
4. Genera una clave de 16 dígitos para "Correo".
5. Pega esa clave en tu panel administrativo de Sync Connect.

### 3. Generar Cuenta de Servicio (Para automatizar claves)
1. Ve a la [Consola de Firebase](https://console.firebase.google.com/).
2. Ajustes del proyecto > Cuentas de servicio.
3. Haz clic en **"Generar nueva clave privada"**.
4. Abre el archivo JSON descargado y copia los valores a las variables de entorno de Vercel mencionadas arriba.

---
© 2024 Sync Connect. Desarrollado para escalar negocios digitales en Nicaragua.
