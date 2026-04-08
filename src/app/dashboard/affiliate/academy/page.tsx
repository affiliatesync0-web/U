
"use client"

import { useState } from 'react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GraduationCap, PlayCircle, Loader2, CheckCircle2, ChevronRight, Sparkles, ShieldCheck, Video, FileVideo, Clock, ArrowLeft, ExternalLink, Flame, MonitorSmartphone, ArrowRight } from 'lucide-react'
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
  // Cambiado a 'course' por defecto para que se abra "adentro" inmediatamente
  const [view, setView] = useState<'hub' | 'course'>('course');

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
                <ArrowLeft className="h-4 w-4" /> VER LECCIONES DE APOYO
              </Button>
              <div className="h-8 w-px bg-slate-100 hidden sm:block" />
              <div className="hidden sm:flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Formación Oficial</span>
                <span className="text-sm font-black text-primary uppercase italic">Sync Academy Masterclass</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="hidden md:inline-block text-[9px] font-black text-green-600 uppercase tracking-[0.2em] bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
                Conexión Inmersiva
              </span>
              <Button asChild variant="ghost" className="h-10 w-10 p-0 text-slate-400 hover:text-primary">
                <a href={courseUrl} target="_blank" rel="noopener noreferrer">
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
            
            <div className="absolute bottom-6 right-8 pointer-events-none">
               <div className="bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-xl text-[9px] font-black text-white uppercase tracking-widest shadow-2xl flex items-center gap-2 border border-white/10">
                 <MonitorSmartphone className="h-3 w-3 text-primary" /> Estás en la Academia Oficial
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
              <span className="text-[10px] font-black uppercase text-primary tracking-[0.4em]">Material de Apoyo Sync</span>
            </div>
            <h1 className="text-5xl font-headline font-black text-slate-900 tracking-tighter leading-none uppercase italic">Lecciones <span className="text-primary">Estratégicas</span></h1>
            <p className="text-lg text-slate-500 font-medium max-w-2xl leading-relaxed">Videos cortos y actualizaciones locales para complementar tu formación maestra.</p>
          </div>
          
          <Button onClick={() => setView('course')} className="h-16 px-10 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 transition-all">
            <ArrowLeft className="mr-2 h-5 w-5" /> VOLVER AL CURSO MAESTRO
          </Button>
        </div>

        <div className="space-y-8">
          {isLoading ? (
            <div className="flex justify-center py-40"><Loader2 className="animate-spin h-12 w-12 text-primary opacity-50" /></div>
          ) : !lessons || lessons.length === 0 ? (
            <Card className="border-dashed border-4 flex flex-col items-center justify-center p-32 text-center bg-white/50 rounded-[4rem] border-slate-100">
              <Video className="h-20 w-20 text-slate-200 mb-8" />
              <h3 className="text-2xl font-black text-slate-400">Actualizando material local...</h3>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {lessons.sort((a, b) => (a.order || 0) - (b.order || 0)).map((lesson, idx) => (
                <Dialog key={lesson.id}>
                  <DialogTrigger asChild>
                    <button className="text-left group outline-none">
                      <Card className="border-none shadow-xl rounded-[3rem] overflow-hidden bg-white ring-1 ring-slate-100 transition-all duration-500 hover:-translate-y-2">
                        <div className="aspect-video bg-slate-900 relative overflow-hidden flex items-center justify-center">
                          <PlayCircle className="h-16 w-16 text-white/20 group-hover:text-primary transition-all z-10" />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-60" />
                        </div>
                        <CardContent className="p-10 space-y-4">
                          <Badge className="bg-primary/10 text-primary border-none font-black text-[8px] uppercase tracking-widest px-3 py-1">Actualización</Badge>
                          <h3 className="text-xl font-headline font-black text-slate-900 uppercase leading-tight group-hover:text-primary transition-colors">{lesson.title}</h3>
                          <p className="text-sm font-medium text-slate-500 line-clamp-2">{lesson.description}</p>
                        </CardContent>
                      </Card>
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-5xl p-0 overflow-hidden rounded-[3.5rem] border-none shadow-2xl bg-white">
                     <div className="bg-slate-900 p-10 text-white flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-white">
                             <GraduationCap className="h-6 w-6" />
                           </div>
                           <div>
                             <h2 className="text-2xl font-headline font-black uppercase leading-none">{lesson.title}</h2>
                             <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Material de Apoyo Sync Academy</p>
                           </div>
                        </div>
                     </div>
                     <div className="p-10 bg-[#F8FAFC]">
                        <div className="rounded-[3rem] overflow-hidden shadow-2xl bg-black aspect-video mb-8">
                           {lesson.videoUrl.includes('firebasestorage') ? (
                             <video src={lesson.videoUrl} controls className="w-full h-full" autoPlay playsInline />
                           ) : (
                             <iframe src={lesson.videoUrl} className="w-full h-full border-none" allowFullScreen />
                           )}
                        </div>
                        <p className="text-slate-600 font-medium leading-relaxed">{lesson.description}</p>
                     </div>
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}
