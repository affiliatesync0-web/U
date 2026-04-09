"use client"

import { useState } from 'react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Loader2, 
  ExternalLink, 
  GraduationCap, 
  RefreshCw, 
  ShieldCheck, 
  Globe, 
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Lock
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function AffiliateAcademyPage() {
  const [isLoading, setIsLoading] = useState(true);
  const academyUrl = "https://syncacademy.systeme.io/es/login?redirectUrl=https%3A%2F%2Fsyncacademy.systeme.io%2Fschool%2Fcourse%2Fsyncacademy";

  const handleRefresh = () => {
    setIsLoading(true);
    const iframe = document.getElementById('academy-iframe') as HTMLIFrameElement;
    if (iframe) iframe.src = academyUrl;
  };

  return (
    <DashboardShell role="affiliate">
      <div className="h-[calc(100vh-140px)] flex flex-col gap-6">
        
        {/* Encabezado del Navegador */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          <div className="space-y-1">
            <h1 className="text-3xl font-headline font-black text-slate-900 tracking-tight flex items-center gap-3 uppercase italic">
              Academia <span className="text-primary">Sync</span>
            </h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" /> Formación Oficial en Tiempo Real
            </p>
          </div>
          
          <Button 
            asChild 
            variant="outline" 
            className="h-10 px-5 rounded-xl font-black text-[10px] uppercase tracking-widest gap-2 border-slate-200 hover:bg-slate-50"
          >
            <a href={academyUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5" /> Abrir en Ventana Nueva
            </a>
          </Button>
        </div>

        {/* Estructura del Navegador Integrado (Estilo Chrome) */}
        <Card className="flex-1 border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden flex flex-col ring-1 ring-slate-100">
          
          {/* Barra de Direcciones / Chrome Tab Bar */}
          <div className="bg-slate-100/80 p-3 flex items-center gap-3 border-b border-slate-200">
            <div className="flex items-center gap-1.5 px-2">
              <div className="h-3 w-3 rounded-full bg-red-400/50" />
              <div className="h-3 w-3 rounded-full bg-amber-400/50" />
              <div className="h-3 w-3 rounded-full bg-green-400/50" />
            </div>
            
            <div className="flex items-center gap-1 ml-2">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400" disabled>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400" disabled>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-slate-600 hover:bg-white rounded-lg transition-all"
                onClick={handleRefresh}
              >
                <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              </Button>
            </div>

            <div className="flex-1 flex items-center bg-white rounded-xl h-9 px-4 border border-slate-200/60 shadow-sm gap-2 overflow-hidden">
              <Lock className="h-3 w-3 text-green-500 shrink-0" />
              <span className="text-[10px] font-bold text-slate-400 truncate select-none">
                https://syncacademy.systeme.io/official-training
              </span>
            </div>

            <div className="flex items-center gap-3 px-3">
               <div className="hidden sm:flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-200/50 px-3 py-1 rounded-lg">
                 <ShieldCheck className="h-3 w-3 text-primary" />
                 Encrypted
               </div>
            </div>
          </div>

          {/* Contenedor del Iframe */}
          <CardContent className="flex-1 p-0 relative bg-slate-50">
            {isLoading && (
              <div className="absolute inset-0 z-20 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                <div className="relative">
                  <div className="h-16 w-16 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
                  <GraduationCap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary/40" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">Cargando Aula Virtual...</p>
              </div>
            )}
            
            <iframe 
              id="academy-iframe"
              src={academyUrl}
              className="w-full h-full border-none"
              onLoad={() => setIsLoading(false)}
              title="Sync Academy Training"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />

            {/* Overlay informativo inferior */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
               <div className="bg-slate-900/90 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 shadow-2xl flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-primary animate-ping" />
                  <span className="text-[9px] font-black text-white uppercase tracking-widest">Sesión de entrenamiento activa</span>
               </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}
