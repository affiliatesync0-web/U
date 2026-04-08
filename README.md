
# Sync Connect - Plataforma de Afiliados (Estilo Hotmart)

Esta es la versión profesional de **Sync Connect**, una plataforma optimizada para el mercado de Nicaragua con un diseño premium inspirado en **Hotmart**.

## 🛠️ Tecnologías Utilizadas
- **Next.js (App Router)**: Máximo rendimiento y SEO.
- **Firebase (Auth, Firestore, Storage)**: Gestión segura de usuarios, base de datos y archivos de video.
- **Genkit (IA)**: Inteligencia Artificial para descripciones de productos automáticas.
- **ShadCN UI & Tailwind**: Interfaz moderna con soporte de Modo Claro/Oscuro.
- **Nodemailer**: Envío de correos transaccionales y códigos de seguridad vía SMTP.

## 🚀 Guía de Configuración Crítica (IMPORTANTE)

### 1. Habilitar Registro por Email
Si tus usuarios ven el error `auth/admin-restricted-operation`, es porque el registro está bloqueado en tu consola.
1. Ve a **Consola de Firebase** > **Authentication** -> **Sign-in method**.
2. Haz clic en **"Agregar nuevo proveedor"**.
3. Selecciona **Correo electrónico/contraseña**.
4. **Habilita la primera opción** (Correo electrónico/contraseña).
5. **MUY IMPORTANTE**: Asegúrate de que la casilla que permite el registro de nuevos usuarios esté activa.
6. Haz clic en **Guardar**.

### 2. Activar Subida de Videos (Storage) - Error de Región
Si ves el mensaje "La ubicación de tus datos se estableció en una región que no admite buckets sin costo":
1. Ve a **Consola de Firebase** > **Storage**.
2. Haz clic en **"Comenzar"** o **"Crea un bucket"**.
3. Elige la ubicación **`us-central1`** (Estados Unidos) para asegurar la capa gratuita.
4. Selecciona **"Comenzar en modo de prueba"**.
5. Una vez activo, ve a la pestaña **"Rules"** (Reglas) y pega el contenido del archivo `storage.rules`.

### 3. Variables de Entorno
Configura estas variables para habilitar todas las funciones administrativas:
- `FIREBASE_PROJECT_ID`: `studio-9886993662-50a10`
- `FIREBASE_CLIENT_EMAIL`: Tu cuenta de servicio de Firebase.
- `FIREBASE_PRIVATE_KEY`: Tu clave privada de Firebase.
- `GEMINI_API_KEY`: Tu clave de Google AI.

---
© 2024 Sync Connect. Desarrollado para escalar negocios digitales en Nicaragua.
