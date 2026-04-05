
'use server';

import { adminAuth } from './firebase-admin';

/**
 * Acción de servidor para cambiar la contraseña de un usuario de forma automática.
 * Esta función es ejecutada por el administrador desde el panel.
 */
export async function adminResetUserPassword(email: string, newPassword: string) {
  try {
    const user = await adminAuth.getUserByEmail(email.toLowerCase().trim());
    
    await adminAuth.updateUser(user.uid, {
      password: newPassword,
    });

    console.log(`Contraseña actualizada automáticamente para: ${email}`);
    return { success: true };
  } catch (error: any) {
    console.error('ERROR AL ACTUALIZAR CONTRASEÑA EN FIREBASE:', error);
    
    // Si el usuario no existe en Auth pero sí en Firestore
    if (error.code === 'auth/user-not-found') {
      return { 
        success: false, 
        error: 'El usuario no existe en la base de datos de autenticación.' 
      };
    }

    return { 
      success: false, 
      error: error.message || 'Error desconocido al aplicar el cambio.' 
    };
  }
}
