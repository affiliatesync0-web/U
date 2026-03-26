# Sync Connect - Plataforma de Afiliados (Estilo Hotmart)

Este es el código fuente de **Sync Connect**, una plataforma diseñada para gestionar redes de afiliados y compradores en Nicaragua, con integración de IA para ventas por WhatsApp.

## 🚀 Cómo ejecutar localmente

Una vez descargado el proyecto, sigue estos pasos:

1.  **Instalar dependencias**:
    ```bash
    npm install
    ```

2.  **Configurar Variables de Entorno**:
    Crea un archivo `.env` en la raíz con tus credenciales de Firebase y tu API Key de Google AI (Gemini):
    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto_id
    GEMINI_API_KEY=tu_api_key_genkit
    ```

3.  **Iniciar el servidor de desarrollo**:
    ```bash
    npm run dev
    ```
    La aplicación estará disponible en `http://localhost:9002`.

## 🛠️ Tecnologías utilizadas

- **Next.js 15 (App Router)**
- **Firebase (Auth & Firestore)**
- **Genkit (IA para Bot de WhatsApp)**
- **Tailwind CSS & ShadCN UI**
- **Lucide Icons**

## 📦 Estructura del Proyecto

- `src/app`: Rutas y páginas de la aplicación.
- `src/components`: Componentes de UI reutilizables.
- `src/firebase`: Configuración y hooks de Firebase.
- `src/ai`: Flujos de inteligencia artificial y Genkit.
- `src/lib`: Utilidades, constantes y traducciones.

---
© 2024 Sync Connect. Desarrollado con tecnología de punta para el marketing digital.