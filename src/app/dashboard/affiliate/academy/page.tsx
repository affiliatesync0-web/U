"use client"

import { useState, useEffect, useRef } from 'react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  PlayCircle, 
  Video, 
  Loader2, 
  GraduationCap, 
  ChevronRight,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Trophy,
  Award,
  Download,
  Printer,
  FileDown
} from 'lucide-react'
import { useFirestore, useCollection, useMemoFirebase, useUser, setDocumentNonBlocking, useDoc } from '@/firebase'
import { collection, doc } from 'firebase/firestore'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export default function AffiliateAcademyPage() {
  const db = useFirestore()
  const { user } = useUser()
  const { toast } = useToast()
  const [selectedLesson, setSelectedLesson] = useState<any>(null)
  
  const academyQuery = useMemoFirebase(() => collection(db, 'academy_lessons'), [db]);
  const { data: lessons, isLoading: lessonsLoading } = useCollection(academyQuery);

  const affiliateRef = useMemoFirebase(() => (user ? doc(db, 'affiliates', user.uid) : null), [db, user]);
  const { data: profile } = useDoc(affiliateRef);

  const progressRef = useMemoFirebase(() => (user ? doc(db, 'affiliate_progress', user.uid) : null), [db, user]);
  const { data: progress } = useDoc(progressRef);

  const completedIds = progress?.completedLessonIds || [];
  const activeLesson = selectedLesson || (lessons && lessons.length > 0 ? lessons[0] : null);

  const isCompleted = (id: string) => completedIds.includes(id);

  const toggleComplete = async (lessonId: string) => {
    if (!user || !progressRef) return;
    
    let newIds = [...completedIds];
    if (newIds.includes(lessonId)) {
      newIds = newIds.filter(id => id !== lessonId);
    } else {
      newIds.push(lessonId);
      toast({ title: "¡Lección Completada!", description: "Sigue así para obtener tu certificación." });
    }

    setDocumentNonBlocking(progressRef, {
      uid: user.uid,
      completedLessonIds: newIds,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  };

  const getEmbedUrl = (url: string) => {
    if (!url) return "";
    if (url.includes('youtube.com/watch?v=')) {
      return url.replace('watch?v=', 'embed/');
    }
    if (url.includes('youtu.be/')) {
      return url.replace('youtu.be/', 'youtube.com/embed/');
    }
    return url;
  };

  const percent = lessons && lessons.length > 0 ? (completedIds.length / lessons.length) * 100 : 0;
  const isGraduated = percent === 100 && (lessons?.length || 0) > 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <DashboardShell role="affiliate">
      <div className="space-y-8 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-slate-900 rounded-lg flex items-center justify-center text-white shadow-lg">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-headline font-black text-slate-900 tracking-tight uppercase">Sync <span className="text-slate-500">Academy</span></h1>
              <p className="text-slate-500 text-sm font-medium">Formación oficial para Socios Platinum.</p>
            </div>
          </div>

          <div className="flex items-center gap-6 bg-white p-4 rounded-2xl border shadow-sm ring-1 ring-slate-100">
             <div className="text-right">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Progreso del Programa</p>
                <p className="text-lg font-black text-slate-900">{Math.round(percent)}%</p>
             </div>
             <div className="h-10 w-px bg-slate-100" />
             <div className={cn(
               "h-12 w-12 rounded-xl flex items-center justify-center transition-all",
               isGraduated ? "bg-amber-100 text-amber-600 shadow-lg shadow-amber-200" : "bg-slate-50 text-slate-300"
             )}>
                <Trophy className="h-6 w-6" />
             </div>
          </div>
        </div>

        {isGraduated && (
          <Card className="border-none shadow-2xl rounded-[2.5rem] bg-slate-950 text-white p-8 md:p-12 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12 group-hover:rotate-0 transition-transform duration-1000"><Award className="h-64 w-64 text-primary" /></div>
             <div className="relative z-10 space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/20 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
                   PROGRAMA COMPLETADO ✓
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl md:text-5xl font-headline font-black tracking-tight leading-none uppercase italic">
                     ESPECIALISTA EN <span className="text-primary">MARKETING SYNC</span>
                  </h2>
                  <p className="text-slate-400 font-medium max-w-xl text-sm">
                     Has demostrado dominio total de las herramientas de cierre y estrategias digitales. Tu título oficial está listo.
                  </p>
                </div>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="h-14 px-10 rounded-xl bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-widest shadow-2xl gap-3">
                      <FileDown className="h-5 w-5" /> DESCARGAR MI DIPLOMA
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl p-0 border-none bg-transparent shadow-none">
                     <CertificateView profile={profile} />
                     <div className="mt-8 flex justify-center gap-4">
                        <Button onClick={handlePrint} className="h-12 rounded-xl bg-white text-slate-900 font-black text-[10px] uppercase gap-2 hover:bg-slate-50">
                          <Printer className="h-4 w-4" /> GUARDAR COMO PDF / IMPRIMIR
                        </Button>
                     </div>
                  </DialogContent>
                </Dialog>
             </div>
          </Card>
        )}

        {lessonsLoading ? (
          <div className="flex justify-center py-40"><Loader2 className="animate-spin text-slate-300 h-10 w-10" /></div>
        ) : !lessons || lessons.length === 0 ? (
          <Card className="p-32 text-center border-dashed border-2 border-slate-200 bg-white rounded-xl">
             <Video className="h-12 w-12 text-slate-200 mx-auto mb-4" />
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contenido próximamente disponible</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-6">
              <Card className="border-none shadow-2xl rounded-2xl overflow-hidden bg-black aspect-video relative ring-1 ring-white/10">
                {activeLesson ? (
                  <iframe 
                    src={getEmbedUrl(activeLesson.videoUrl)} 
                    className="w-full h-full border-none"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-white/10">
                    <PlayCircle className="h-20 w-20" />
                  </div>
                )}
              </Card>
              
              {activeLesson && (
                <div className="space-y-6 px-2">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight italic">{activeLesson.title}</h2>
                      <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                         <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Sesión: {new Date(activeLesson.createdAt).toLocaleDateString()}</span>
                         <span className="flex items-center gap-1.5 text-primary"><ShieldCheck className="h-3.5 w-3.5" /> Verificado</span>
                      </div>
                    </div>
                    <Button 
                      onClick={() => toggleComplete(activeLesson.id)}
                      className={cn(
                        "h-12 px-8 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all",
                        isCompleted(activeLesson.id) ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-slate-900 text-white hover:bg-slate-800"
                      )}
                    >
                      {isCompleted(activeLesson.id) ? <><CheckCircle2 className="mr-2 h-4 w-4" /> LECCIÓN TERMINADA</> : "MARCAR COMO FINALIZADA"}
                    </Button>
                  </div>
                  <div className="p-8 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
                    <p className="text-slate-600 text-sm leading-relaxed font-medium whitespace-pre-wrap">
                      {activeLesson.description || 'Sin descripción detallada.'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <Card className="lg:col-span-4 border-none shadow-xl rounded-2xl bg-white overflow-hidden h-[600px] flex flex-col ring-1 ring-slate-100">
              <CardHeader className="bg-slate-50 border-b p-6">
                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Módulos del Curso</CardTitle>
              </CardHeader>
              <ScrollArea className="flex-1">
                <div className="p-3 space-y-1">
                  {lessons.sort((a, b) => (a.order || 0) - (b.order || 0)).map((lesson, idx) => (
                    <button 
                      key={lesson.id}
                      onClick={() => setSelectedLesson(lesson)}
                      className={cn(
                        "w-full text-left p-4 rounded-xl flex items-center gap-4 transition-all group",
                        activeLesson?.id === lesson.id ? "bg-slate-900 text-white shadow-lg" : "hover:bg-slate-50"
                      )}
                    >
                      <div className={cn(
                        "h-10 w-10 rounded-lg flex items-center justify-center font-black text-xs shrink-0 transition-colors",
                        isCompleted(lesson.id) ? "bg-green-500 text-white" : (activeLesson?.id === lesson.id ? "bg-white/10 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-white")
                      )}>
                        {isCompleted(lesson.id) ? <CheckCircle2 className="h-5 w-5" /> : idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-[11px] font-black uppercase truncate", activeLesson?.id === lesson.id ? "text-white" : "text-slate-700")}>{lesson.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                           <PlayCircle className={cn("h-3 w-3", activeLesson?.id === lesson.id ? "text-slate-400" : "text-slate-300")} />
                           <span className={cn("text-[8px] font-bold uppercase tracking-widest", activeLesson?.id === lesson.id ? "text-slate-500" : "text-slate-400")}>
                             {isCompleted(lesson.id) ? 'Revisar' : 'Empezar'}
                           </span>
                        </div>
                      </div>
                      <ChevronRight className={cn("h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1", activeLesson?.id === lesson.id ? "text-white" : "text-slate-200")} />
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </Card>
          </div>
        )}
      </div>

      {/* VISTA DEL DIPLOMA PARA IMPRESIÓN */}
      <div className="hidden print:block fixed inset-0 bg-white z-[9999]">
         <CertificateView profile={profile} />
      </div>
    </DashboardShell>
  )
}

function CertificateView({ profile }: { profile: any }) {
  const date = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  
  return (
    <div className="bg-white border-[20px] border-slate-900 p-16 md:p-24 text-center space-y-12 relative overflow-hidden aspect-[1.414/1] flex flex-col justify-center">
       {/* Bordes decorativos */}
       <div className="absolute top-0 left-0 w-32 h-32 border-l-[10px] border-t-[10px] border-primary" />
       <div className="absolute bottom-0 right-0 w-32 h-32 border-r-[10px] border-b-[10px] border-primary" />
       <div className="absolute inset-0 border-2 border-slate-100 m-4" />
       
       <div className="space-y-4 relative z-10">
          <div className="h-20 w-20 bg-slate-900 rounded-full flex items-center justify-center text-primary mx-auto mb-8 shadow-2xl">
             <Award className="h-10 w-10 fill-current" />
          </div>
          <h4 className="text-[12px] font-black uppercase tracking-[0.6em] text-slate-400">Sync Connect Academy • Certificado Oficial</h4>
          <h1 className="text-6xl font-headline font-black text-slate-950 uppercase italic tracking-tighter leading-none">DIPLOMA DE <span className="text-primary">MÉRITO</span></h1>
       </div>

       <div className="space-y-6 relative z-10">
          <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">Este documento acredita a:</p>
          <div className="border-b-2 border-slate-900 pb-2 inline-block px-12">
            <h2 className="text-4xl font-headline font-black text-slate-900 uppercase italic tracking-tight">{profile?.firstName} {profile?.lastName}</h2>
          </div>
          <p className="text-lg font-medium text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Como graduado oficial del programa de alto rendimiento, obteniendo la designación y el rango de:
          </p>
          <div className="py-4 px-8 bg-slate-50 inline-block rounded-xl border-2 border-dashed border-slate-200">
             <h3 className="text-2xl font-black text-primary uppercase italic tracking-tight">ESPECIALISTA EN MARKETING DIGITAL SYNC</h3>
          </div>
       </div>

       <div className="grid grid-cols-2 gap-20 pt-12 relative z-10">
          <div className="space-y-4">
             <div className="h-px bg-slate-300 w-full" />
             <p className="text-[10px] font-black uppercase text-slate-900">DIRECCIÓN GENERAL SYNC</p>
             <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Firma Autorizada</p>
          </div>
          <div className="space-y-4">
             <div className="h-px bg-slate-300 w-full" />
             <p className="text-[10px] font-black uppercase text-slate-900">{date}</p>
             <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Fecha de Expedición</p>
          </div>
       </div>

       <div className="absolute bottom-10 left-10 opacity-10">
         <span className="text-4xl font-black italic">SYNC CONNECT</span>
       </div>
    </div>
  )
}
