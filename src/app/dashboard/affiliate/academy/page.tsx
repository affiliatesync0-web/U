
"use client"

import { useEffect } from 'react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  ExternalLink, 
  GraduationCap, 
  ArrowRight,
  ShieldCheck, 
  Loader2
} from 'lucide-react'

export default function AffiliateAcademyPage() {
  const academyUrl = "https://syncacademy.systeme.io/es/login?redirectUrl=https%3A%2F%2Fsyncacademy.systeme.io%2Fschool%2Fcourse%2Fsyncacademy";

  useEffect(() => {
    // Redirección automática al cargar la página si el usuario llega aquí
    const timer = setTimeout(() => {
      window.open(academyUrl, '_blank');
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <DashboardShell role="affiliate">
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center space-y-10">
        
        <div className="space-y-4">
          <div className="h-24 w-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center text-primary shadow-inner mx-auto animate-bounce">
            <GraduationCap className="h-12 w-12" />
          </div>
          <h1 className="text-4xl md:text-6xl font-headline font-black text-slate-900 tracking-tight uppercase italic">
            Academia <span className="text-primary">Sync</span>
          </h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.4em]">Entrenamiento Oficial</p>
        </div>

        <Card className="max-w-xl border-none shadow-2xl rounded-[3.5rem] bg-white overflow-hidden ring-1 ring-slate-100 p-10 md:p-14">
          <CardContent className="p-0 space-y-8">
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Accediendo a la Plataforma</h3>
              <p className="text-slate-500 font-medium leading-relaxed">
                Estamos preparándolo todo para tu sesión de entrenamiento. Serás redirigido automáticamente a la academia externa en 2 segundos.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <Button 
                asChild 
                className="h-20 px-10 rounded-[2rem] bg-primary hover:bg-primary/90 text-white font-black text-lg uppercase tracking-widest shadow-2xl shadow-primary/30 transition-all hover:scale-105"
              >
                <a href={academyUrl} target="_blank" rel="noopener noreferrer">
                  ENTRAR AHORA <ArrowRight className="ml-3 h-6 w-6" />
                </a>
              </Button>
              
              <div className="flex items-center justify-center gap-3 py-4 opacity-50">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-widest">Redirigiendo...</span>
              </div>
            </div>

            <div className="pt-8 border-t flex items-center justify-center gap-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
              <ShieldCheck className="h-4 w-4 text-green-500" />
              Conexión Protegida por Sync Connect
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}
