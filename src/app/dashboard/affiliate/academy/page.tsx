
"use client"

import { useState } from 'react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GraduationCap, PlayCircle, Loader2, CheckCircle2, ChevronRight, Sparkles, ShieldCheck, Video, FileVideo, Clock, ArrowLeft, ExternalLink, Flame, MonitorSmartphone } from 'lucide-react'
import { useLanguage } from '@/components/language-context'
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase'
import { collection } from 'firebase/firestore'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export default function AffiliateAcademyPage() {
  const { t } = useLanguage()
  const db = useFirestore()
  const [view, setView] = useState<'hub' | 'course'>('hub');

  const academyQuery = useMemoFirebase(() => collection(db, 'academy_lessons'), [db]);
  const { data: lessons, isLoading } = useCollection(academyQuery);

  const courseUrl = "https://syncacademy.systeme.io/school/course/syncacademy";

  if (view === 'course') {
    return (
      <DashboardShell role="affiliate">
        <div className="h-[calc(100vh-140px)] flex flex-col gap-6 animate-in fade-in duration-500">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border shadow-sm shrink-0">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                onClick={() => setView('hub')} 
                className="h-10 rounded-xl font-black text-[10px] uppercase tracking-widest gap-2 border-slate-200 hover:bg-slate-50"
              >
                <ArrowLeft className="h-4 w-4" /> VOLVER AL HUB
              </Button>
              <div className="h-8 w-px bg-slate-100 hidden sm:block" />
              <div className="hidden sm:flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Viendo Ahora</span>
                <span className="text-sm font-black text-primary uppercase italic">Sync Academy Official</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="hidden md:inline-block text-[9px] font-black text-green-600 uppercase tracking-[0.2em] bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
                Conexión Segura Activa
              </span>
              <Button asChild variant="ghost" className="h-10 w-10 p-0 text-slate-400 hover:text-primary">
                <a href={courseUrl} target="_blank" rel="noopener noreferrer" title="Abrir en ventana externa">
                  <ExternalLink className="h-5 w-5" />
                </a>
              </Button>
            </div>
          </div>

          <div className="flex-1 bg-white rounded-[3rem] overflow-hidden border-4 border-white shadow-2xl relative ring-1 ring-slate-200">
            <iframe 
              src={courseUrl} 
              className="w-full h-full border-none"
              title="Sync Academy Course"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            
            {/* Overlay informativo discreto */}
            <div className="absolute bottom-6 right-8 pointer-events-none">
               <div className="bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-xl text-[9px] font-black text-white uppercase tracking-widest shadow-2xl flex items-center gap-2 border border-white/10">
                 <MonitorSmartphone className="h-3 w-3 text-primary" /> Modo Inmersivo Sync
               </div>
            </div>
          </div>
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell role="affiliate">
      <div className="space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner">
                <GraduationCap className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-black uppercase text-primary tracking-[0.4em]">Sync Academy Elite</span>
            </div>
            <h1 className="text-5xl font-headline font-black text-slate-900 tracking-tighter leading-none uppercase italic">Universidad de <span className="text-primary">Marketing</span></h1>
            <p className="text-lg text-slate-500 font-medium max-w-2xl leading-relaxed">Aprende las estrategias que usan los grandes para escalar negocios digitales en Nicaragua.</p>
          </div>
          
          <div className="flex items-center gap-4 bg-slate-900 p-5 rounded-[2.5rem] shadow-2xl">
             <div className="h-12 w-12 rounded-2xl bg-green-500 flex items-center justify-center text-white shadow-xl rotate-3">
               <ShieldCheck className="h-6 w-6" />
             </div>
             <div>
               <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Acceso Concedido</p>
               <p className="text-sm font-black text-white uppercase tracking-tight">Formación Vitalicia</p>
             </div>
          </div>
        </div>

        {/* SECCIÓN DESTACADA: CURSO SYNC DE MARKETING (EMBEDDED) */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary to-orange-600 rounded-[3.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          <Card className="relative border-none shadow-2xl rounded-[3.5rem] bg-white overflow-hidden ring-1 ring-slate-100">
            <div className="flex flex-col lg:flex-row">
              <div className="flex-1 p-10 md:p-14 space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-primary text-white font-black text-[10px] px-4 py-1.5 rounded-full uppercase tracking-widest border-none">OFICIAL</Badge>
                    <div className="flex items-center gap-2 text-[10px] font-black text-orange-500 uppercase tracking-widest animate-pulse">
                      <Flame className="h-3 w-3 fill-current" /> Entrenamiento Maestro
                    </div>
                  </div>
                  <h2 className="text-4xl md:text-5xl font-headline font-black text-slate-900 tracking-tight leading-[1.1]">
                    CURSO SYNC DE <span className="text-primary">MARKETING</span>
                  </h2>
                  <p className="text-slate-500 font-medium text-lg max-w-xl leading-relaxed">
                    Accede a nuestra plataforma principal de entrenamiento. Domina las ventas orgánicas, el tráfico pago y la mentalidad ganadora para facturar tus primeros $1,000 USD.
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button 
                    onClick={() => setView('course')}
                    className="h-18 px-10 rounded-[1.75rem] bg-primary hover:bg-primary/90 text-white font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 group transition-all hover:scale-[1.03]"
                  >
                    ENTRAR AL CURSO AHORA <ChevronRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                  <div className="flex items-center gap-4 px-6 py-4 bg-slate-50 rounded-[1.75rem] border border-slate-100">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Navegación Interna Habilitada</span>
                  </div>
                </div>
              </div>
              <div className="lg:w-[40%] bg-slate-900 relative overflow-hidden flex items-center justify-center min-h-[300px]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,93,27,0.2),transparent_70%)] opacity-50" />
                <GraduationCap className="h-48 w-48 text-primary opacity-10 rotate-12" />
                <div className="relative z-10 text-center space-y-4">
                  <div className="h-20 w-20 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl flex items-center justify-center mx-auto shadow-2xl rotate-3">
                    <Sparkles className="h-10 w-10 text-primary" />
                  </div>
                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Sync Academy Official</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="h-1 w-12 bg-slate-200 rounded-full" />
            <h3 className="text-xl font-headline font-black text-slate-400 uppercase tracking-widest">Lecciones de Soporte y Actualizaciones</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-12">
              {isLoading ? (
                <div className="flex justify-center py-40"><Loader2 className="animate-spin h-12 w-12 text-primary opacity-50" /></div>
              ) : !lessons || lessons.length === 0 ? (
                <Card className="border-dashed border-4 flex flex-col items-center justify-center p-32 text-center bg-white/50 rounded-[4rem] border-slate-100">
                  <Video className="h-20 w-20 text-slate-200 mb-8" />
                  <h3 className="text-2xl font-black text-slate-400">La academia está siendo actualizada.</h3>
                  <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-2">Nuevas lecciones de marketing próximamente.</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {lessons.sort((a, b) => (a.order || 0) - (b.order || 0)).map((lesson, idx) => (
                    <Dialog key={lesson.id}>
                      <DialogTrigger asChild>
                        <button className="text-left group outline-none">
                          <Card className="border-none shadow-xl rounded-[3rem] overflow-hidden bg-white ring-1 ring-slate-100 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.1)]">
                            <div className="aspect-video bg-slate-900 relative overflow-hidden flex items-center justify-center">
                              <PlayCircle className="h-16 w-16 text-white/20 group-hover:text-primary group-hover:scale-110 transition-all z-10" />
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-60" />
                              <div className="absolute bottom-6 left-8 flex items-center gap-2">
                                 <div className="h-8 w-8 rounded-xl bg-primary/20 backdrop-blur-md flex items-center justify-center text-primary font-black text-[10px] shadow-xl">
                                   {idx + 1}
                                 </div>
                                 <span className="text-[10px] font-black text-white uppercase tracking-widest">Lección Disponible</span>
                              </div>
                            </div>
                            <CardContent className="p-10 space-y-4">
                              <div className="flex items-center gap-3">
                                 <Badge className="bg-primary/10 text-primary border-none font-black text-[8px] uppercase tracking-widest px-3 py-1">Marketing Digital</Badge>
                                 <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-300 uppercase">
                                   <Clock className="h-3 w-3" /> Entrenamiento
                                 </div>
                              </div>
                              <h3 className="text-xl font-headline font-black text-slate-900 uppercase leading-tight group-hover:text-primary transition-colors">{lesson.title}</h3>
                              <p className="text-sm font-medium text-slate-500 line-clamp-2 leading-relaxed">{lesson.description}</p>
                              <div className="pt-4 flex items-center text-primary font-black text-[10px] uppercase tracking-widest gap-2">
                                 VER CLASE AHORA <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                              </div>
                            </CardContent>
                          </Card>
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-w-5xl p-0 overflow-hidden rounded-[3.5rem] border-none shadow-2xl bg-white">
                         <div className="bg-slate-900 p-10 text-white flex items-center justify-between relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12"><GraduationCap className="h-40 w-40" /></div>
                            <div className="flex items-center gap-4 relative z-10">
                               <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-xl rotate-3">
                                 <GraduationCap className="h-6 w-6" />
                               </div>
                               <div>
                                 <h2 className="text-2xl font-headline font-black uppercase tracking-tight leading-none">{lesson.title}</h2>
                                 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Módulo de Especialización • Sync Academy</p>
                               </div>
                            </div>
                         </div>
                         <div className="p-10 bg-[#F8FAFC]">
                            <div className="rounded-[3rem] overflow-hidden shadow-2xl bg-black aspect-video mb-8 ring-8 ring-white/50">
                               {lesson.videoUrl.includes('firebasestorage') ? (
                                 <video 
                                   src={lesson.videoUrl} 
                                   controls 
                                   controlsList="nodownload" 
                                   className="w-full h-full" 
                                   autoPlay 
                                   playsInline
                                 />
                               ) : (
                                 <iframe src={lesson.videoUrl} className="w-full h-full border-none" allowFullScreen />
                               )}
                            </div>
                            <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
                               <div className="flex items-center gap-2">
                                 <Sparkles className="h-4 w-4 text-primary" />
                                 <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Resumen de la Sesión</h4>
                               </div>
                               <p className="text-slate-600 font-medium leading-relaxed">{lesson.description}</p>
                            </div>
                         </div>
                      </DialogContent>
                    </Dialog>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-12 bg-blue-50 rounded-[4rem] border-2 border-dashed border-blue-200 flex flex-col md:flex-row items-center justify-between gap-10 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-10 opacity-5"><Sparkles className="h-40 w-40 text-blue-500" /></div>
           <div className="flex items-center gap-8 relative z-10">
              <div className="h-20 w-20 bg-blue-500 text-white rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-blue-200 rotate-3">
                <Video className="h-10 w-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-headline font-black text-blue-900 tracking-tight leading-none uppercase">¿Listo para aplicar lo aprendido?</h3>
                <p className="text-blue-700 font-medium max-w-md leading-relaxed">Usa los ganchos persuasivos del laboratorio para poner en práctica las estrategias de hoy.</p>
              </div>
           </div>
           <Button asChild className="h-16 px-10 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-200 relative z-10 transition-all hover:scale-105">
             <Link href="/dashboard/affiliate/sales-lab">
               IR AL LABORATORIO <ArrowRight className="ml-3 h-5 w-5" />
             </Link>
           </Button>
        </div>
      </div>
    </DashboardShell>
  )
}
