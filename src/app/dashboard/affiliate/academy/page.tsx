
"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Loader2, ExternalLink, GraduationCap } from 'lucide-react'

export default function AffiliateAcademyPage() {
  const router = useRouter();
  const academyUrl = "https://syncacademy.systeme.io/es/login?redirectUrl=https%3A%2F%2Fsyncacademy.systeme.io%2Fschool%2Fcourse%2Fsyncacademy";

  useEffect(() => {
    // Redirigir de inmediato al cargar la página si entran por URL directa
    window.location.href = academyUrl;
  }, []);

  return (
    <DashboardShell role="affiliate">
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-8 text-center">
        <div className="h-24 w-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center text-primary animate-bounce">
          <GraduationCap className="h-12 w-12" />
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl font-headline font-black text-slate-900 tracking-tight uppercase italic">
            Redirigiendo a la <span className="text-primary">Academia Sync</span>
          </h1>
          <p className="text-slate-500 font-medium">Estamos conectando con el portal de capacitación oficial...</p>
        </div>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
          <a 
            href={academyUrl} 
            className="text-[10px] font-black uppercase text-primary hover:underline tracking-widest flex items-center gap-2"
          >
            ¿No fuiste redirigido? Haz clic aquí <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </DashboardShell>
  )
}
