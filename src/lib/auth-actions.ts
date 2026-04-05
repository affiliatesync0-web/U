
'use server';

import { adminAuth } from './firebase-admin';

/**
 * Acción de servidor para cambiar la contraseña de un usuario de forma automática.
 */
export async function adminResetUserPassword(email: string, newPassword: string) {
  // 1. Verificar si el Admin SDK se inicializó correctamente
  if (!adminAuth) {
    return { 
      success: false, 
      error: 'ERROR DE SERVIDOR: El sistema no tiene permisos administrativos activos. Verifica tus variables FIREBASE_PRIVATE_KEY y FIREBASE_CLIENT_EMAIL.' 
    };
  }

  try {
    const cleanEmail = email.toLowerCase().trim();
    
    // 2. Intentar obtener el usuario en Firebase Auth
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
        error: 'El usuario no existe en la base de datos de autenticación de Google.' 
      };
    }

    if (error.message && error.message.includes('token')) {
      return {
        success: false,
        error: 'Fallo de conexión con Google (Token de acceso inválido). Revisa que tu Clave Privada en el servidor sea correcta.'
      };
    }

    return { 
      success: false, 
      error: `Error crítico de Firebase: ${error.message || 'Fallo desconocido.'}` 
    };
  }
}
