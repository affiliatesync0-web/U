
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
Si ves errores como `auth/admin-restricted-operation` o `Error SMS`:
1. Ve a **Consola de Firebase** > **Authentication** -> **Sign-in method**.
2. **Correo electrónico/contraseña**: Habilita y asegúrate de que el registro de nuevos usuarios esté permitido.
3. **Google**: Habilita el proveedor de Google.
4. **Teléfono (CRÍTICO)**: 
   - Habilita el proveedor **Teléfono**.
   - Si estás en modo de prueba, añade tu número personal en la sección "Números de teléfono para pruebas" con el código `123456`.
   - Asegúrate de habilitar el **reCAPTCHA invisible** si se te solicita.

### 2. Activar Subida de Videos (Storage) - Error de Región y Reglas
Si la subida de videos falla o el sistema dice "Error Desconocido":
1. Ve a **Consola de Firebase** > **Storage**.
2. Haz clic en **"Comenzar"** o **"Crea un bucket"**.
3. **UBICACIÓN CRÍTICA**: Elige **`us-central1`** (Estados Unidos). Otras regiones pueden ser lentas desde Nicaragua o no tener capa gratuita.
4. Selecciona **"Comenzar en modo de prueba"**.
5. Una vez activo, ve a la pestaña **"Rules"** (Reglas) y pega exactamente esto:
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
6. Haz clic en **Publicar**.

### 3. Variables de Envorno
Configura estas variables para habilitar todas las funciones administrativas:
- `FIREBASE_PROJECT_ID`: `studio-9886993662-50a10`
- `FIREBASE_CLIENT_EMAIL`: Tu cuenta de servicio de Firebase.
- `FIREBASE_PRIVATE_KEY`: Tu clave privada de Firebase.
- `GEMINI_API_KEY`: Tu clave de Google AI.

---
© 2024 Sync Connect. Desarrollado para escalar negocios digitales en Nicaragua.
