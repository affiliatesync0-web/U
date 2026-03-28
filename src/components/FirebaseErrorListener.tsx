'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

/**
 * Componente que escucha errores de permisos de Firestore a nivel global.
 * En lugar de lanzar una excepción que active la pantalla técnica de error,
 * muestra una notificación visual amigable (Toast).
 */
export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      // Mostramos el error de forma controlada sin romper la interfaz
      toast({
        variant: "destructive",
        title: "Error de Permisos",
        description: "No tienes autorización para realizar esta operación o los datos son inválidos.",
      });
      
      // Log interno para depuración si fuera necesario
      console.warn("Firestore Access Denied:", error.request.path, error.request.method);
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, [toast]);

  return null;
}
