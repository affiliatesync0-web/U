
"use client"

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Smartphone, 
  AppWindow, 
  Monitor, 
  Download, 
  Loader2, 
  ShieldCheck, 
  Zap,
  Globe,
  Star,
  ChevronRight,
  ArrowDownCircle,
  FileCode
} from 'lucide-react'
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase'
import { collection } from 'firebase/firestore'
import { Badge } from '@/components/ui/badge'

export default function AffiliateDownloadsPage() {
  const db = useFirestore()
  const releasesQuery = useMemoFirebase(() => collection(db, 'app_releases'), [db]);
  const { data: releases, isLoading } = useCollection(releasesQuery);

  return (
    <DashboardShell role="affiliate">
      <div className="space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner">
                <Smartphone className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-black uppercase text-primary tracking-[0.4em]">Multi-Platform Tools</span>
            </div>
            <h1 className="text-5xl font-headline font-black text-slate-900 leading-tight tracking-tight uppercase italic">Sync <span className="text-primary">Native App</span></h1>
            <p className="text-lg text-slate-500 font-medium max-w-2xl">Lleva tu negocio en el bolsillo. Descarga la versión optimizada para tu dispositivo.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* APP ANDROID */}
           <Card className="border-none shadow-2xl rounded-[3.5rem] bg-slate-900 text-white overflow-hidden group hover:scale-[1.02] transition-all duration-500">
             <div className="p-10 space-y-8 relative">
               <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                 <Smartphone className="h-48 w-48 text-primary" />
               </div>
               <div className="space-y-4 relative z-10">
                 <div className="h-14 w-14 bg-primary/20 rounded-2xl flex items-center justify-center text-primary shadow-2xl rotate-3 group-hover:rotate-0 transition-transform">
                   <Smartphone className="h-7 w-7" />
                 </div>
                 <h3 className="text-3xl font-headline font-black uppercase tracking-tight">Android <span className="text-primary">App</span></h3>
                 <p className="text-slate-400 text-sm font-medium leading-relaxed">Versión APK lista para instalar. Notificaciones push de ventas en tiempo real.</p>
               </div>
               
               <div className="pt-8 border-t border-white/10 space-y-4">
                  {releases?.filter(r => r.type === 'apk' || r.type === 'aab').slice(0, 1).map(rel => (
                    <Button key={rel.id} asChild className="w-full h-16 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase shadow-2xl">
                      <a href={rel.downloadUrl} target="_blank">
                        <Download className="mr-2 h-5 w-5" /> DESCARGAR .APK (v{rel.version})
                      </a>
                    </Button>
                  )) || <p className="text-[10px] font-black text-slate-600 uppercase">Versión móvil en desarrollo</p>}
               </div>
             </div>
           </Card>

           {/* APP WINDOWS */}
           <Card className="border-none shadow-2xl rounded-[3.5rem] bg-white overflow-hidden ring-1 ring-slate-100 group hover:scale-[1.02] transition-all duration-500">
             <div className="p-10 space-y-8 relative">
               <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                 <Monitor className="h-48 w-48 text-slate-900" />
               </div>
               <div className="space-y-4 relative z-10">
                 <div className="h-14 w-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 shadow-inner">
                   <Monitor className="h-7 w-7" />
                 </div>
                 <h3 className="text-3xl font-headline font-black uppercase tracking-tight">Desktop <span className="text-primary">Pro</span></h3>
                 <p className="text-slate-500 text-sm font-medium leading-relaxed">Software nativo para Windows. Optimizado para gestión masiva de prospectos.</p>
               </div>
               
               <div className="pt-8 border-t space-y-4">
                  {releases?.filter(r => r.type === 'exe').slice(0, 1).map(rel => (
                    <Button key={rel.id} asChild className="w-full h-16 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase shadow-2xl">
                      <a href={rel.downloadUrl} target="_blank">
                        <AppWindow className="mr-2 h-5 w-5 text-primary" /> INSTALAR PARA WINDOWS
                      </a>
                    </Button>
                  )) || <p className="text-[10px] font-black text-slate-300 uppercase">Próximamente versión de escritorio</p>}
               </div>
             </div>
           </Card>

           {/* VERSION WEB PWA */}
           <Card className="border-none shadow-2xl rounded-[3.5rem] bg-primary/5 border border-primary/10 overflow-hidden group hover:scale-[1.02] transition-all duration-500">
             <div className="p-10 space-y-8 relative">
               <div className="space-y-4">
                 <div className="h-14 w-14 bg-primary text-white rounded-2xl flex items-center justify-center shadow-xl -rotate-6">
                   <Globe className="h-7 w-7" />
                 </div>
                 <h3 className="text-3xl font-headline font-black text-slate-900 uppercase tracking-tight">Cloud <span className="text-primary">Sync</span></h3>
                 <p className="text-slate-500 text-sm font-medium leading-relaxed">Versión web progresiva. No requiere descarga, funciona en cualquier navegador.</p>
               </div>
               
               <div className="pt-8 border-t border-primary/10">
                  <Button variant="outline" className="w-full h-16 rounded-2xl border-primary text-primary font-black text-xs uppercase hover:bg-primary hover:text-white transition-all">
                    USAR VERSIÓN CLOUD
                  </Button>
               </div>
             </div>
           </Card>
        </div>

        <div className="p-12 bg-slate-50 rounded-[4rem] border-2 border-dashed border-slate-200 flex flex-col md:flex-row items-center justify-between gap-10">
           <div className="flex items-center gap-6">
             <div className="h-20 w-20 bg-white rounded-3xl flex items-center justify-center shadow-xl ring-1 ring-slate-100">
               <ShieldCheck className="h-10 w-10 text-green-500" />
             </div>
             <div>
               <h4 className="text-2xl font-headline font-black text-slate-900 uppercase">Seguridad Certificada</h4>
               <p className="text-slate-500 font-medium">Todos nuestros binarios están firmados digitalmente para garantizar una instalación segura y libre de virus.</p>
             </div>
           </div>
           <div className="flex gap-4">
              <Badge variant="outline" className="h-10 px-4 font-black uppercase text-[10px]">SSL PROTECTED</Badge>
              <Badge variant="outline" className="h-10 px-4 font-black uppercase text-[10px]">VERIFIED BUILD</Badge>
           </div>
        </div>
      </div>
    </DashboardShell>
  )
}
