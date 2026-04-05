
'use server';

import { adminAuth } from './firebase-admin';

/**
 * Acción de servidor para cambiar la contraseña de un usuario de forma automática.
 */
export async function adminResetUserPassword(email: string, newPassword: string) {
  // 1. Verificar si el Admin SDK está disponible
  if (!adminAuth) {
    return { 
      success: false, 
      error: 'ERROR DE CONFIGURACIÓN: El servidor no tiene acceso administrativo. Asegúrate de configurar FIREBASE_PRIVATE_KEY y FIREBASE_CLIENT_EMAIL en Vercel.' 
    };
  }

  try {
    const cleanEmail = email.toLowerCase().trim();
    
    // 2. Intentar obtener el usuario
    const user = await adminAuth.getUserByEmail(cleanEmail);
    
    // 3. Aplicar cambio de contraseña
    await adminAuth.updateUser(user.uid, {
      password: newPassword,
    });

    console.log(`Contraseña actualizada en Firebase Auth para: ${cleanEmail}`);
    return { success: true };
  } catch (error: any) {
    console.error('ERROR EN ACCIÓN RESET_PASSWORD:', error);
    
    if (error.code === 'auth/user-not-found') {
      return { 
        success: false, 
        error: 'El usuario no existe en el sistema de Autenticación de Firebase (aunque aparezca en Firestore).' 
      };
    }

    return { 
      success: false, 
      error: `Error de Firebase: ${error.message || 'Fallo desconocido al actualizar clave.'}` 
    };
  }
}
