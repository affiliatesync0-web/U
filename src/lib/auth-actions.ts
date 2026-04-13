'use server';

import { adminAuth } from './firebase-admin';

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
    console.log(`Usuario eliminado de Auth: ${uid}`);
    return { success: true };
  } catch (error: any) {
    console.error('ERROR EN ACCIÓN DELETE_USER:', error);
    // Si el usuario no existe en Auth, lo consideramos un éxito para permitir limpiar Firestore
    if (error.code === 'auth/user-not-found') {
      return { success: true };
    }
    return { success: false, error: error.message || 'No se pudo eliminar el acceso del usuario.' };
  }
}
