
# Sync Connect - Plataforma de Afiliados (Estilo Hotmart)

Esta es la versión profesional de **Sync Connect**, una plataforma optimizada para el mercado de Nicaragua con un diseño premium inspirado en **Hotmart**.

## 🛠️ Tecnologías Utilizadas
- **Framework Moderno**: Máximo rendimiento y SEO.
- **Firebase (Auth & Firestore)**: Gestión segura de usuarios y base de datos en tiempo real.
- **Genkit (IA)**: Inteligencia Artificial para el bot de ventas de WhatsApp y descripciones de productos.
- **ShadCN UI & Tailwind**: Interfaz moderna, minimalista y responsiva.

## 🚀 Guía de Instalación Local (Después de Descargar el ZIP)

Una vez que tengas el archivo `.zip` y lo extraigas en tu computadora, sigue estos pasos:

### 1. Instalar dependencias
Abre una terminal en la carpeta del proyecto y ejecuta:
```bash
npm install
```

### 2. Configurar Variables de Entorno
Crea un archivo llamado `.env.local` en la raíz del proyecto y copia los valores de tu consola de Firebase:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id
GEMINI_API_KEY=tu_api_key_de_google_ai
```

### 3. Configurar Reglas de Firebase
Asegúrate de copiar el contenido del archivo `firestore.rules` a la sección de "Rules" en tu consola de Firebase Firestore para que los permisos funcionen correctamente.

### 4. Iniciar Servidor de Desarrollo
```bash
npm run dev
```
Visita `http://localhost:9002` en tu navegador para ver la aplicación funcionando.

## 📁 Estructura de Roles
- **Administrador**: Gestión total de productos, red de afiliados, directorio de compradores y diseño del sitio.
- **Afiliado**: Acceso al marketplace, registro de ventas con voucher y configuración del bot de IA.
- **Comprador**: Panel exclusivo para ver el catálogo y sus compras realizadas (sin acceso a herramientas de venta).

---
© 2024 Sync Connect. Desarrollado para escalar negocios digitales con tecnología de punta.
