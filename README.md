
# Sync Connect - Plataforma de Afiliados (Estilo Hotmart)

Esta es la versión profesional de **Sync Connect**, una plataforma optimizada para el mercado de Nicaragua con un diseño premium inspirado en **Hotmart**.

## 🛠️ Tecnologías Utilizadas
- **Next.js (App Router)**: Máximo rendimiento y SEO.
- **Firebase (Auth, Firestore, Storage)**: Gestión segura de usuarios, base de datos y archivos de video.
- **Genkit (IA)**: Inteligencia Artificial para descripciones de productos automáticas.
- **ShadCN UI & Tailwind**: Interfaz moderna con soporte de Modo Claro/Oscuro.
- **Nodemailer**: Envío de correos transaccionales y códigos de seguridad vía SMTP.

## 🚀 Guía de Configuración Crítica

### 1. Habilitar Registro por Email
Para que tus usuarios puedan crear cuentas, debes:
1. Ir a **Consola de Firebase** > **Authentication** -> **Sign-in method**.
2. Hacer clic en **"Agregar nuevo proveedor"**.
3. Seleccionar **Correo electrónico/contraseña**.
4. Habilitar la primera opción y hacer clic en **Guardar**.

### 2. Variables de Entorno
Configura estas variables para habilitar todas las funciones administrativas:
- `FIREBASE_PROJECT_ID`: `studio-9886993662-50a10`
- `FIREBASE_CLIENT_EMAIL`: Tu cuenta de servicio de Firebase.
- `FIREBASE_PRIVATE_KEY`: Tu clave privada de Firebase (asegúrate de incluir los saltos de línea `\n`).
- `GEMINI_API_KEY`: Tu clave de Google AI para las funciones de asistente de ventas.

### 3. Configuración de Gmail (SMTP)
Para que las notificaciones de ventas y recuperación de contraseñas funcionen:
1. Ve a tu **Panel de Administrador** -> **Diseño**.
2. Configura los datos de tu Gmail en la sección **SMTP**.
3. Es **OBLIGATORIO** usar una "Contraseña de Aplicación" de Google (16 dígitos), no tu contraseña normal.

---
© 2024 Sync Connect. Desarrollado para escalar negocios digitales en Nicaragua.
