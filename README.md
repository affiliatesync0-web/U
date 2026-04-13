
# Sync Connect - Plataforma de Afiliados (Estilo Hotmart)

Esta es la versión profesional de **Sync Connect**, una plataforma optimizada para el mercado de Nicaragua con un diseño premium inspirado en **Hotmart**.

## 🛠️ Tecnologías Utilizadas
- **Next.js (App Router)**: Máximo rendimiento y SEO.
- **Firebase (Auth, Firestore, Storage)**: Gestión segura de usuarios, base de datos y archivos de video.
- **Genkit (IA)**: Inteligencia Artificial para descripciones de productos automáticas.
- **ShadCN UI & Tailwind**: Interfaz moderna con soporte de Modo Claro/Oscuro.
- **Nodemailer**: Envío de correos transaccionales y códigos de seguridad vía SMTP.

## 🚀 Guía de Configuración Crítica (IMPORTANTE)

### 1. Habilitar Métodos de Autenticación
Si ves errores como `auth/unauthorized-domain` o fallos al iniciar con Google/SMS:
1. Ve a **Consola de Firebase** > **Authentication**.
2. **Sign-in method**: Habilita **Google**, **Email/Password** y **Teléfono**.
3. **DOMINIOS AUTORIZADOS (CRÍTICO)**:
   - Ve a **Settings** -> **Authorized domains**.
   - Haz clic en **"Add domain"**.
   - Añade `localhost` (si pruebas en tu PC).
   - Añade el dominio de Vercel (ej: `affiliatesync.vercel.app`).
   - **Sin esto, tanto el login de Google como el SMS fallarán siempre por seguridad.**

### 2. Activar Subida de Videos (Storage) - Error de Región y Reglas
Si la subida de videos falla:
1. Ve a **Consola de Firebase** > **Storage**.
2. **UBICACIÓN CRÍTICA**: Elige **`us-central1`** (Estados Unidos). Otras regiones pueden ser lentas desde Nicaragua.
3. **Reglas de Seguridad**: Pega esto en la pestaña "Rules":
   ```rules
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /{allPaths=**} {
         allow read, write: if true;
       }
     }
   }
   ```
4. Haz clic en **Publicar**.

### 3. Variables de Entorno
Configura estas variables para habilitar todas las funciones administrativas:
- `FIREBASE_PROJECT_ID`: `studio-9886993662-50a10`
- `FIREBASE_CLIENT_EMAIL`: Tu cuenta de servicio de Firebase.
- `FIREBASE_PRIVATE_KEY`: Tu clave privada de Firebase.
- `GEMINI_API_KEY`: Tu clave de Google AI.

---
© 2024 Sync Connect. Desarrollado para escalar negocios digitales en Nicaragua.
