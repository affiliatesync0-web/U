
# Sync Connect - Plataforma de Afiliados (Estilo Hotmart)

Esta es la versión profesional de **Sync Connect**, una plataforma optimizada para el mercado de Nicaragua con un diseño premium inspirado en **Hotmart**.

## 🛠️ Tecnologías Utilizadas
- **Next.js (App Router)**: Máximo rendimiento y SEO.
- **Firebase (Auth & Firestore)**: Gestión segura de usuarios y base de datos en tiempo real.
- **Genkit (IA)**: Inteligencia Artificial para el bot de ventas de WhatsApp y descripciones de productos.
- **ShadCN UI & Tailwind**: Interfaz moderna, minimalista y responsiva.
- **Nodemailer**: Envío de correos transaccionales vía Gmail SMTP.

## 🚀 Guía de Configuración de Correo (Gmail)

El sistema está pre-configurado para usar el correo **affiliatesync0@gmail.com**.

### 1. Correos de Bienvenida y Ventas (SMTP)
Se utiliza el servidor SMTP de Gmail con las siguientes credenciales:
- **Usuario**: `affiliatesync0@gmail.com`
- **Contraseña de Aplicación**: `wagrmuphptnevpin`

### 2. Recuperación de Contraseña (Firebase Console)
Para que los correos de restablecimiento de contraseña salgan desde tu Gmail personalizado, debes configurar el servidor SMTP manualmente en Firebase siguiendo este enlace:

👉 **[Configurar SMTP en Consola de Firebase](https://console.firebase.google.com/project/studio-9886993662-50a10/authentication/emails)**

**Pasos:**
1. Haz clic en el enlace de arriba.
2. Selecciona el template **Password Reset**.
3. Haz clic en el icono de edición (lápiz).
4. Haz clic en **"Configure SMTP server"**.
5. Ingresa los siguientes datos:
   - **SMTP Server**: `smtp.gmail.com`
   - **Port**: `465` (SSL)
   - **Username**: `affiliatesync0@gmail.com`
   - **Password**: `wagrmuphptnevpin`
6. Guarda los cambios.

---
© 2024 Sync Connect. Desarrollado para escalar negocios digitales.
