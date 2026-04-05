
import * as admin from 'firebase-admin';

/**
 * Inicialización segura del SDK de Administración de Firebase.
 * Se encarga de verificar que las credenciales existan antes de intentar usarlas.
 */

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID || "studio-9886993662-50a10",
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

function getAdminApp() {
  if (admin.apps.length > 0) return admin.apps[0];

  try {
    // Solo inicializar con certificado si las variables críticas existen
    if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      });
    } else {
      // Intento de inicialización por defecto (Solo funciona en Google Cloud / Firebase Hosting nativo)
      // En Vercel o Local sin variables, esto lanzará un error que capturamos abajo.
      return admin.initializeApp();
    }
  } catch (error) {
    console.error("ADMIN_INIT_WARNING: No se pudo inicializar Firebase Admin con credenciales automáticas.");
    return null;
  }
}

const adminApp = getAdminApp();

// Exportamos las instancias solo si la app se inicializó correctamente
export const adminAuth = adminApp ? admin.auth(adminApp) : null;
export const adminDb = adminApp ? admin.firestore(adminApp) : null;
