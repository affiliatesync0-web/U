'use server';

import { adminAuth, adminDb } from './firebase-admin';

const ADMIN_EMAIL = 'affiliatesync0@gmail.com';

/**
 * nuclearResetSystem - ELIMINA TODO EL CONTENIDO DEL SISTEMA
 * Borra Firestore y Auth, excepto la cuenta administrativa principal.
 */
export async function nuclearResetSystem() {
  if (!adminAuth || !adminDb) {
    return { success: false, error: 'Admin SDK not initialized.' };
  }

  try {
    // 1. Limpiar colecciones de Firestore
    const collections = ['affiliates', 'buyers', 'sales', 'notifications', 'private_messages', 'user_sites', 'app_releases', 'sales_lab'];
    
    for (const colName of collections) {
      const snapshot = await adminDb.collection(colName).get();
      const batch = adminDb.batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      console.log(`Firestore: Colección ${colName} vaciada.`);
    }

    // 2. Limpiar usuarios de Firebase Auth (excepto Admin)
    let nextPageToken;
    do {
      const listUsersResult = await adminAuth.listUsers(1000, nextPageToken);
      const uidsToDelete = listUsersResult.users
        .filter(user => user.email?.toLowerCase().trim() !== ADMIN_EMAIL)
        .map(user => user.uid);
      
      if (uidsToDelete.length > 0) {
        await adminAuth.deleteUsers(uidsToDelete);
        console.log(`Auth: ${uidsToDelete.length} usuarios eliminados.`);
      }
      
      nextPageToken = listUsersResult.pageToken;
    } while (nextPageToken);

    return { success: true };
  } catch (error: any) {
    console.error('NUCLEAR RESET ERROR:', error);
    return { success: false, error: error.message || 'Fallo desconocido.' };
  }
}

/**
 * Acción de servidor para cambiar la contraseña de un usuario de forma automática.
 */
export async function adminResetUserPassword(email: string, newPassword: string) {
  if (!adminAuth) {
    return { 
      success: false, 
      error: 'ERROR DE SERVIDOR: El sistema no tiene permisos administrativos activos.' 
    };
  }

  try {
    const cleanEmail = email.toLowerCase().trim();
    const user = await adminAuth.getUserByEmail(cleanEmail);
    await adminAuth.updateUser(user.uid, {
      password: newPassword,
    });
    return { success: true };
  } catch (error: any) {
    console.error('ERROR EN ACCIÓN RESET_PASSWORD:', error);
    return { success: false, error: error.message || 'Fallo desconocido.' };
  }
}

/**
 * Genera un enlace de restablecimiento de contraseña para un usuario.
 * Se personaliza para que apunte directamente a nuestra página de reset-password.
 */
export async function adminGenerateResetLink(email: string) {
  if (!adminAuth) {
    return { success: false, error: 'No hay conexión con el SDK administrativo.' };
  }
  try {
    const cleanEmail = email.toLowerCase().trim();
    const firebaseLink = await adminAuth.generatePasswordResetLink(cleanEmail);
    const url = new URL(firebaseLink);
    const oobCode = url.searchParams.get('oobCode');
    if (!oobCode) throw new Error("No se pudo generar el código de seguridad.");
    
    const isDev = process.env.NODE_ENV === 'development';
    const baseUrl = isDev ? 'http://localhost:9002' : 'https://syncconnect.ni'; 
    const customLink = `${baseUrl}/auth/reset-password?oobCode=${oobCode}`;
    return { success: true, link: customLink, oobCode };
  } catch (error: any) {
    console.error('ERROR GENERATING LINK:', error);
    return { success: false, error: error.code === 'auth/user-not-found' ? 'USUARIO_NO_EXISTE' : error.message };
  }
}

/**
 * Acción de servidor para eliminar permanentemente a un usuario de Firebase Authentication.
 */
export async function adminDeleteUser(uid: string) {
  if (!adminAuth) {
    return { 
      success: false, 
      error: 'ERROR DE SERVIDOR: El sistema no tiene permisos administrativos activos.' 
    };
  }
  try {
    await adminAuth.deleteUser(uid);
    return { success: true };
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') return { success: true };
    return { success: false, error: error.message || 'No se pudo eliminar el acceso.' };
  }
}
