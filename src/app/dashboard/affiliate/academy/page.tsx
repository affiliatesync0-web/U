
"use client"

import { useState } from 'react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GraduationCap, PlayCircle, Loader2, CheckCircle2, ChevronRight, Sparkles, ShieldCheck, Video, FileVideo } from 'lucide-react'
import { useLanguage } from '@/components/language-context'
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase'
import { collection } from 'firebase/firestore'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'

export default function AffiliateAcademyPage() {
  const { t } = useLanguage()
  const db = useFirestore()
  const [selectedLesson, setSelectedLesson] = useState<any>(null)

  const academyQuery = useMemoFirebase(() => collection(db, 'academy_lessons'), [db]);
  const { data: lessons, isLoading } = useCollection(academyQuery);

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
            <p className="text-lg text-slate-500 font-medium max-w-2xl">Aprende las estrategias que usan los grandes para escalar negocios digitales en Nicaragua.</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main List */}
          <div className="lg:col-span-12">
            {isLoading ? (
              <div className="flex justify-center py-40"><Loader2 className="animate-spin h-12 w-12 text-primary opacity-50" /></div>
            ) : !lessons || lessons.length === 0 ? (
              <Card className="border-dashed border-4 flex flex-col items-center justify-center p-32 text-center bg-white/50 rounded-[4rem] border-slate-100">
                <Video className="h-20 w-20 text-slate-200 mb-8" />
                <h3 className="text-2xl font-black text-slate-400">La academia está en mantenimiento.</h3>
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-2">Nuevas lecciones próximamente.</p>
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
                               <span className="text-[10px] font-black text-white uppercase tracking-widest">Lección Actual</span>
                            </div>
                          </div>
                          <CardContent className="p-10 space-y-4">
                            <div className="flex items-center gap-3">
                               <Badge className="bg-primary/10 text-primary border-none font-black text-[8px] uppercase tracking-widest px-3 py-1">Marketing Digital</Badge>
                               <span className="text-[10px] font-bold text-slate-300">• 15 MIN</span>
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
                    <DialogContent className="max-w-5xl p-0 overflow-hidden rounded-[3rem] border-none shadow-2xl bg-white">
                       <div className="bg-slate-900 p-10 text-white flex items-center justify-between">
                          <div className="flex items-center gap-4">
                             <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-xl rotate-3">
                               <GraduationCap className="h-6 w-6" />
                             </div>
                             <div>
                               <h2 className="text-2xl font-headline font-black uppercase tracking-tight">{lesson.title}</h2>
                               <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Lección {idx + 1} • Sync Academy</p>
                             </div>
                          </div>
                       </div>
                       <div className="p-10 bg-[#F8FAFC]">
                          <div className="rounded-[2.5rem] overflow-hidden shadow-2xl bg-black aspect-video mb-8">
                             {lesson.videoUrl.includes('firebasestorage') ? (
                               <video src={lesson.videoUrl} controls className="w-full h-full" autoPlay />
                             ) : (
                               <iframe src={lesson.videoUrl} className="w-full h-full" allowFullScreen />
                             )}
                          </div>
                          <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
                             <h4 className="text-xs font-black text-primary uppercase tracking-[0.3em]">Resumen de la Clase</h4>
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

        <div className="p-12 bg-blue-50 rounded-[4rem] border-2 border-dashed border-blue-200 flex flex-col md:flex-row items-center justify-between gap-10 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-10 opacity-5"><Sparkles className="h-40 w-40 text-blue-500" /></div>
           <div className="flex items-center gap-8 relative z-10">
              <div className="h-20 w-20 bg-blue-500 text-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-blue-200 rotate-3">
                <PlayCircle className="h-10 w-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-headline font-black text-blue-900 tracking-tight leading-none uppercase">¿Listo para aplicar lo aprendido?</h3>
                <p className="text-blue-700 font-medium max-w-md">Ve al Laboratorio de Ventas y usa los ganchos persuasivos para poner en práctica esta lección.</p>
              </div>
           </div>
           <Button className="h-16 px-10 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-200 relative z-10 transition-all hover:scale-105">
             IR AL LABORATORIO <ArrowRight className="ml-3 h-5 w-5" />
           </Button>
        </div>
      </div>
    </DashboardShell>
  )
}

function Badge({ className, children }: any) {
  return <span className={cn("px-3 py-1 rounded-full text-xs font-bold", className)}>{children}</span>
}

function ArrowRight({ className }: any) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
}
