
# Sync Connect - Plataforma de Afiliados (Estilo Hotmart)

Esta es la versión profesional de **Sync Connect**, una plataforma optimizada para el mercado de Nicaragua con un diseño premium inspirado en **Hotmart**.

## 🛠️ Tecnologías Utilizadas
- **Next.js (App Router)**: Máximo rendimiento y SEO.
- **Firebase (Auth & Firestore)**: Gestión segura de usuarios y base de datos en tiempo real.
- **Genkit (IA)**: Inteligencia Artificial para el bot de ventas de WhatsApp y descripciones de productos.
- **ShadCN UI & Tailwind**: Interfaz moderna, minimalista y responsiva.
- **Nodemailer**: Envío de correos transaccionales vía Gmail SMTP.

## 🚀 Guía de Instalación Local

Una vez que tengas el archivo `.zip` y lo extraigas en tu computadora, sigue estos pasos:

### 1. Instalar dependencias
Abre una terminal en la carpeta del proyecto y ejecuta:
```bash
npm install
```

### 2. Configurar Variables de Entorno
Crea un archivo llamado `.env.local` en la raíz del proyecto y copia los valores:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id
GEMINI_API_KEY=tu_api_key_de_google_ai

# CONFIGURACIÓN GMAIL (PARA ENVIAR EMAILS)
GMAIL_USER=tu-correo@gmail.com
GMAIL_PASS=tu-contraseña-de-aplicación
```

> **Importante**: Para que `GMAIL_PASS` funcione, debes tener activada la Verificación en 2 Pasos en tu cuenta de Google y generar una "Contraseña de Aplicación". [Guía oficial de Google](https://support.google.com/accounts/answer/185833).

### 3. Iniciar Servidor de Desarrollo
```bash
npm run dev
```
Visita `http://localhost:9002` en tu navegador.

## 📁 Estructura de Roles
- **Administrador**: Gestión total de productos, red de afiliados, directorio de compradores y diseño.
- **Afiliado**: Marketplace, links de divulgación, registro de ventas y bot de IA.
- **Comprador**: Catálogo y acceso a sus comprobantes de compra.

---
© 2024 Sync Connect. Desarrollado para escalar negocios digitales.
