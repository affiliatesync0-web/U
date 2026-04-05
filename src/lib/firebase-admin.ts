
import * as admin from 'firebase-admin';

/**
 * Inicialización segura del SDK de Administración de Firebase.
 * Se encarga de verificar que las credenciales existan y tengan el formato correcto.
 */

const rawKey = process.env.FIREBASE_PRIVATE_KEY;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const projectId = process.env.FIREBASE_PROJECT_ID || "studio-9886993662-50a10";

// Limpiar la clave privada para asegurar que los saltos de línea sean correctos
const privateKey = rawKey ? rawKey.replace(/\\n/g, '\n') : undefined;

// Verificar si la credencial parece ser un certificado válido de Google
const hasValidCredentials = !!(privateKey && clientEmail && privateKey.includes('BEGIN PRIVATE KEY'));

function getAdminApp() {
  if (admin.apps.length > 0) return admin.apps[0];

  try {
    if (hasValidCredentials) {
      console.log("Iniciando Firebase Admin con certificado explícito...");
      return admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        } as admin.ServiceAccount),
      });
    } else {
      // Intento de inicialización por defecto (Solo funciona si hay credenciales de Google Cloud en el entorno)
      console.warn("ADMIN_INIT: No hay credenciales explícitas válidas. Usando inicialización por defecto.");
      return admin.initializeApp();
    }
  } catch (error) {
    console.error("ADMIN_INIT_ERROR: No se pudo inicializar Firebase Admin.", error);
    return null;
  }
}

const adminApp = getAdminApp();

// Exportamos las instancias solo si la app se inicializó correctamente
export const adminAuth = adminApp ? admin.auth(adminApp) : null;
export const adminDb = adminApp ? admin.firestore(adminApp) : null;
