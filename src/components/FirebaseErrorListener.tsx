
'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

/**
 * Componente que escucha errores de permisos de Firestore a nivel global.
 * Proporciona detalles técnicos para facilitar el soporte.
 */
export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handleError = (error: any) => {
      // Intentamos extraer información útil, manejando tanto el error personalizado como el de Firebase
      const path = error.request?.path || "colección desconocida";
      const method = error.request?.method || "operación";
      const technicalMsg = error.message || "Error desconocido en el servidor de datos.";

      toast({
        variant: "destructive",
        title: "Error de Datos",
        description: `Error al [${method}] en [${path}]. Detalle: ${technicalMsg}`,
      });
      
      console.warn("Firestore access error context:", path, method, technicalMsg);
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, [toast]);

  return null;
}
