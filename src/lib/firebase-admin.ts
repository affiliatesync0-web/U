
import * as admin from 'firebase-admin';

/**
 * Inicialización del SDK de Administración de Firebase.
 * Permite realizar cambios en usuarios sin intervención manual.
 */
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID || "studio-9886993662-50a10",
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_PRIVATE_KEY) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      });
    } else {
      // Intento de inicialización por defecto (App Hosting / Local)
      admin.initializeApp();
    }
  } catch (error) {
    console.error("Error inicializando Firebase Admin:", error);
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
