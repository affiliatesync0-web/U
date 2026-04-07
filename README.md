
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

### 2. Activar Subida de Videos (Storage)
Para que puedas subir videos desde tu dispositivo:
1. Ve a **Consola de Firebase** > **Storage** (en el menú lateral).
2. Haz clic en el botón **"Comenzar"** (Get Started).
3. Selecciona **"Comenzar en modo de prueba"** (esto permite subir archivos inmediatamente).
4. Elige una ubicación de servidor (se recomienda `us-central1`).
5. Una vez activo, ve a la pestaña **"Rules"** (Reglas) dentro de Storage y pega el contenido del archivo `storage.rules` de este proyecto.

### 3. Variables de Entorno
Configura estas variables para habilitar todas las funciones administrativas:
- `FIREBASE_PROJECT_ID`: `studio-9886993662-50a10`
- `FIREBASE_CLIENT_EMAIL`: Tu cuenta de servicio de Firebase.
- `FIREBASE_PRIVATE_KEY`: Tu clave privada de Firebase (asegúrate de incluir los saltos de línea `\n`).
- `GEMINI_API_KEY`: Tu clave de Google AI para las funciones de asistente de ventas.

### 4. Configuración de Gmail (SMTP)
Para que las notificaciones de ventas y recuperación de contraseñas funcionen:
1. Ve a tu **Panel de Administrador** -> **Diseño**.
2. Configura los datos de tu Gmail en la sección **SMTP**.
3. Es **OBLIGATORIO** usar una "Contraseña de Aplicación" de Google (16 dígitos), no tu contraseña normal.

---
© 2024 Sync Connect. Desarrollado para escalar negocios digitales en Nicaragua.
