
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
    const handleError = (error: FirestorePermissionError) => {
      // Extraemos información útil del error
      const path = error.request?.path || "desconocida";
      const method = error.request?.method || "operación";

      toast({
        variant: "destructive",
        title: "Error de Permisos",
        description: `No se pudo realizar la acción [${method}] en [${path}]. Verifica tu sesión.`,
      });
      
      console.warn("Firestore Access Denied:", path, method);
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, [toast]);

  return null;
}
