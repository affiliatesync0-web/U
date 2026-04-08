"use client"

import { useEffect } from 'react'
import { redirect } from 'next/navigation'
import { Loader2, GraduationCap } from 'lucide-react'

/**
 * Página de la Academia que redirige automáticamente al curso externo oficial.
 */
export default function AffiliateAcademyPage() {
  const courseUrl = "https://syncacademy.systeme.io/school/course/syncacademy";

  useEffect(() => {
    // Redirección del lado del cliente para mayor seguridad en la navegación directa
    window.location.href = courseUrl;
  }, [courseUrl]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-center p-6">
      <div className="max-w-md space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="h-24 w-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center text-primary shadow-inner mx-auto rotate-3">
          <GraduationCap className="h-12 w-12" />
        </div>
        <div className="space-y-4">
          <h1 className="text-3xl font-headline font-black text-slate-900 tracking-tight">Abriendo Academia Sync...</h1>
          <p className="text-slate-500 font-medium">Te estamos enviando a la plataforma de entrenamiento oficial de Systeme.io.</p>
        </div>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Conexión Segura Establecida</p>
        </div>
        <div className="pt-6">
          <a 
            href={courseUrl} 
            className="text-xs font-black text-primary hover:underline uppercase tracking-widest"
          >
            Si no eres redirigido, haz clic aquí
          </a>
        </div>
      </div>
    </div>
  );
}
