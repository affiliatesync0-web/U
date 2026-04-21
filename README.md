# Sync Connect - Plataforma de Afiliados Elite

Esta es la infraestructura tecnológica de **Sync Connect**, una plataforma optimizada para el mercado de Nicaragua con un diseño premium y funcionalidades de alto rendimiento.

## 🛠️ Tecnologías del Ecosistema
- **Motor de Aplicación**: Estructura de alto rendimiento para gestión de rutas y SEO.
- **Firebase (Auth, Firestore, Storage)**: Gestión segura de usuarios, base de datos y archivos multimedia.
- **Genkit (IA)**: Inteligencia Artificial para descripciones de productos y asistencia de ventas.
- **ShadCN UI & Tailwind**: Interfaz moderna con soporte de Modo Claro/Oscuro.
- **Nodemailer**: Envío de correos transaccionales y notificaciones premium.

## 🚀 Guía de Configuración Crítica

### 1. Habilitar Métodos de Autenticación
Si ves errores de autenticación:
1. Ve a **Consola de Firebase** > **Authentication**.
2. **Sign-in method**: Habilita **Google**, **Email/Password** y **Teléfono**.
3. **DOMINIOS AUTORIZADOS**:
   - Añade `localhost`.
   - Añade el dominio de despliegue (ej: `affiliatesync.vercel.app`).

### 2. Variables de Entorno
Configura estas variables para habilitar todas las funciones:
- `FIREBASE_PROJECT_ID`: `studio-9886993662-50a10`
- `FIREBASE_CLIENT_EMAIL`: Cuenta de servicio.
- `FIREBASE_PRIVATE_KEY`: Clave privada de Firebase.
- `GEMINI_API_KEY`: Tu clave de Google AI.

---
© 2024 Sync Connect. Tecnología diseñada para escalar negocios digitales en Nicaragua.
