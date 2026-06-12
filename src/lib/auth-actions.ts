'use server';

import { adminAuth, adminDb } from './firebase-admin';

const ADMIN_EMAIL = 'affiliatesync0@gmail.com';

/**
 * Acción de servidor para eliminar permanentemente a un usuario de Firebase Authentication.
 * Requiere que las variables de entorno del Admin SDK estén configuradas.
 */
export async function adminDeleteUser(uid: string) {
  if (!adminAuth) {
    return { 
      success: false, 
      error: 'ERROR DE SERVIDOR: El sistema no tiene permisos administrativos activos en Vercel. Configura FIREBASE_PRIVATE_KEY y FIREBASE_CLIENT_EMAIL.' 
    };
  }

  try {
    // Intentar eliminar el usuario de Authentication
    await adminAuth.deleteUser(uid);
    return { success: true };
  } catch (error: any) {
    console.error('Error al eliminar usuario en Auth:', error.code);
    
    // Si el usuario no existe en Auth, lo consideramos un éxito para poder limpiar Firestore
    if (error.code === 'auth/user-not-found') {
      return { success: true };
    }
    
    return { 
      success: false, 
      error: `Error de Firebase Admin: ${error.message}` 
    };
  }
}

/**
 * nuclearResetSystem - ELIMINA TODO EL CONTENIDO DEL SISTEMA
 */
export async function nuclearResetSystem() {
  if (!adminAuth || !adminDb) {
    return { success: false, error: 'Admin SDK not initialized.' };
  }

  try {
    const collections = ['affiliates', 'buyers', 'sales', 'notifications', 'private_messages', 'user_sites', 'app_releases', 'sales_lab'];
    
    for (const colName of collections) {
      const snapshot = await adminDb.collection(colName).get();
      const batch = adminDb.batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    }

    let nextPageToken;
    do {
      const listUsersResult = await adminAuth.listUsers(1000, nextPageToken);
      const uidsToDelete = listUsersResult.users
        .filter(user => user.email?.toLowerCase().trim() !== ADMIN_EMAIL)
        .map(user => user.uid);
      
      if (uidsToDelete.length > 0) {
        await adminAuth.deleteUsers(uidsToDelete);
      }
      
      nextPageToken = listUsersResult.pageToken;
    } while (nextPageToken);

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * adminResetUserPassword - Cambia la contraseña de un usuario
 */
export async function adminResetUserPassword(email: string, newPassword: string) {
  if (!adminAuth) return { success: false, error: 'Admin SDK not initialized.' };
  try {
    const user = await adminAuth.getUserByEmail(email.toLowerCase().trim());
    await adminAuth.updateUser(user.uid, { password: newPassword });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * adminGenerateResetLink - Genera link de recuperación
 */
export async function adminGenerateResetLink(email: string) {
  if (!adminAuth) return { success: false, error: 'Admin SDK not initialized.' };
  try {
    const firebaseLink = await adminAuth.generatePasswordResetLink(email.toLowerCase().trim());
    const url = new URL(firebaseLink);
    const oobCode = url.searchParams.get('oobCode');
    const isDev = process.env.NODE_ENV === 'development';
    const baseUrl = isDev ? 'http://localhost:9002' : 'https://syncconnect.ni'; 
    const customLink = `${baseUrl}/auth/reset-password?oobCode=${oobCode}`;
    return { success: true, link: customLink, oobCode };
  } catch (error: any) {
    return { success: false, error: error.code === 'auth/user-not-found' ? 'USUARIO_NO_EXISTE' : error.message };
  }
}
