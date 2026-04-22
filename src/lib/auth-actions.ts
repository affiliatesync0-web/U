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
 * Genera un enlace de restablecimiento de contraseña para un usuario.
 * Se personaliza para que apunte directamente a nuestra página de reset-password.
 */
export async function adminGenerateResetLink(email: string) {
  if (!adminAuth) {
    return { success: false, error: 'No hay conexión con el SDK administrativo.' };
  }
  try {
    const cleanEmail = email.toLowerCase().trim();
    // 1. Generar el enlace oficial de Firebase
    const firebaseLink = await adminAuth.generatePasswordResetLink(cleanEmail);
    
    // 2. Extraer el oobCode
    const url = new URL(firebaseLink);
    const oobCode = url.searchParams.get('oobCode');
    
    if (!oobCode) throw new Error("No se pudo generar el código de seguridad.");
    
    // 3. Construir nuestro link personalizado que apunta a nuestra propia UI
    // En producción esto debería usar la URL real, en dev usamos localhost
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
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
    console.log(`Usuario eliminado de Auth: ${uid}`);
    return { success: true };
  } catch (error: any) {
    console.error('ERROR EN ACCIÓN DELETE_USER:', error);
    if (error.code === 'auth/user-not-found') {
      return { success: true };
    }
    return { success: false, error: error.message || 'No se pudo eliminar el acceso del usuario.' };
  }
}
