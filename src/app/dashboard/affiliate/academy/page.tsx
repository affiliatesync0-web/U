
"use client"

import { useState, useEffect } from 'react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { 
  PlayCircle, 
  Loader2, 
  GraduationCap, 
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Trophy,
  Award,
  FileDown,
  Printer,
  Star,
  Zap,
  Lock
} from 'lucide-react'
import { useFirestore, useCollection, useMemoFirebase, useUser, setDocumentNonBlocking, useDoc } from '@/firebase'
import { collection, doc } from 'firebase/firestore'
import { cn, getGoogleDriveDirectLink } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default function AffiliateAcademyPage() {
  const db = useFirestore()
  const { user } = useUser()
  const { toast } = useToast()
  
  const academyQuery = useMemoFirebase(() => collection(db, 'academy_lessons'), [db]);
  const { data: lessons, isLoading: lessonsLoading } = useCollection(academyQuery);

  const affiliateRef = useMemoFirebase(() => (user ? doc(db, 'affiliates', user.uid) : null), [db, user]);
  const { data: profile } = useDoc(affiliateRef);

  const progressRef = useMemoFirebase(() => (user ? doc(db, 'affiliate_progress', user.uid) : null), [db, user]);
  const { data: progress } = useDoc(progressRef);

  const [activeIndex, setActiveIndex] = useState(0)
  
  const sortedLessons = lessons ? [...lessons].sort((a, b) => (a.order || 0) - (b.order || 0)) : []
  const currentLesson = sortedLessons[activeIndex]
  const completedIds = progress?.completedLessonIds || []

  const isCompleted = (id: string) => completedIds.includes(id)

  const toggleComplete = async (lessonId: string) => {
    if (!user || !progressRef) return;
    
    let newIds = [...completedIds];
    if (!newIds.includes(lessonId)) {
      newIds.push(lessonId);
      toast({ title: "¡Lección Completada!", description: "Has avanzado en tu formación." });
      
      setDocumentNonBlocking(progressRef, {
        uid: user.uid,
        completedLessonIds: newIds,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }
  };

  const getEmbedUrl = (url: string) => {
    if (!url) return "";
    if (url.includes('youtube.com/watch?v=')) return url.replace('watch?v=', 'embed/');
    if (url.includes('youtu.be/')) return url.replace('youtu.be/', 'youtube.com/embed/');
    return url;
  };

  const percent = sortedLessons.length > 0 ? (completedIds.length / sortedLessons.length) * 100 : 0;
  const isGraduated = percent === 100 && sortedLessons.length > 0;

  const handleNext = () => {
    if (activeIndex < sortedLessons.length - 1) {
      setActiveIndex(activeIndex + 1);
    }
  };

  const handlePrev = () => {
    if (activeIndex > 0) {
      setActiveIndex(activeIndex - 1);
    }
  };

  if (lessonsLoading) {
    return (
      <DashboardShell role="affiliate">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cargando Academia Sync...</p>
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell role="affiliate">
      <div className="max-w-4xl mx-auto space-y-8 pb-20">
        
        {/* HEADER ESTILO VISION 360 */}
        <div className="flex flex-col items-center text-center space-y-6">
           <div className="h-20 w-20 bg-slate-900 rounded-full flex items-center justify-center border-4 border-white shadow-xl">
             <GraduationCap className="h-10 w-10 text-primary" />
           </div>
           <div>
             <h1 className="text-3xl font-headline font-black text-slate-900 uppercase tracking-tight">SYNC ACADEMY</h1>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-1">Formación para Socios Platinum</p>
           </div>
        </div>

        {/* CONTROLES DE NAVEGACIÓN */}
        <div className="grid grid-cols-2 gap-4">
          <Button 
            variant="outline" 
            onClick={handlePrev} 
            disabled={activeIndex === 0}
            className="h-14 rounded-xl border-slate-200 font-black text-xs uppercase bg-white shadow-sm"
          >
            <ChevronLeft className="mr-2 h-5 w-5" /> ANTERIOR
          </Button>
          <Button 
            onClick={handleNext} 
            disabled={activeIndex === sortedLessons.length - 1}
            className="h-14 rounded-xl bg-primary text-white font-black text-xs uppercase shadow-lg"
          >
            SIGUIENTE <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </div>

        {/* BARRA DE PROGRESO */}
        <div className="space-y-2">
          <div className="flex justify-between items-center px-1">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tu Progreso</span>
             <span className="text-[10px] font-black text-slate-900 uppercase">{Math.round(percent)}%</span>
          </div>
          <div className="h-4 w-full bg-slate-200 rounded-full overflow-hidden p-0.5 border border-white shadow-inner">
             <div 
               className="h-full bg-black rounded-full transition-all duration-1000 flex items-center justify-center text-[8px] font-black text-white"
               style={{ width: `${percent}%` }}
             >
               {percent > 10 && `${Math.round(percent)}%`}
             </div>
          </div>
        </div>

        {/* VIDEO Y CONTENIDO */}
        {currentLesson ? (
          <div className="space-y-6">
            <Card className="border-none shadow-2xl rounded-[2rem] overflow-hidden bg-black aspect-video relative ring-1 ring-slate-100">
               <iframe 
                  src={getEmbedUrl(currentLesson.videoUrl)} 
                  className="w-full h-full border-none"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
            </Card>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
               <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase italic leading-none">{currentLesson.title}</h2>
               <Button 
                onClick={() => toggleComplete(currentLesson.id)}
                className={cn(
                  "h-10 px-6 rounded-full font-black text-[9px] uppercase tracking-widest",
                  isCompleted(currentLesson.id) ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                )}
               >
                 {isCompleted(currentLesson.id) ? "LECCIÓN TERMINADA ✓" : "MARCAR COMO VISTA"}
               </Button>
            </div>
            
            <p className="text-sm text-slate-500 font-medium leading-relaxed bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              {currentLesson.description}
            </p>
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border-dashed border-2 border-slate-200">
             <PlayCircle className="h-12 w-12 text-slate-100 mx-auto mb-4" />
             <p className="text-[10px] font-black uppercase text-slate-400">Sin contenido disponible</p>
          </div>
        )}

        {/* ACORDEÓN DE MÓDULOS */}
        <div className="space-y-4 pt-10 border-t">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" /> Contenido del Entrenamiento
          </h3>
          
          <Accordion type="single" collapsible className="space-y-2">
            {sortedLessons.map((lesson, idx) => (
              <AccordionItem key={lesson.id} value={lesson.id} className="border-none bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 overflow-hidden">
                <AccordionTrigger className="px-6 py-5 hover:no-underline hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4 text-left">
                    <div className={cn(
                      "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                      activeIndex === idx ? "bg-primary text-white" : "bg-slate-100 text-slate-400"
                    )}>
                      {isCompleted(lesson.id) ? <CheckCircle2 className="h-4 w-4" /> : <span className="font-black text-xs">{idx + 1}</span>}
                    </div>
                    <span className={cn(
                      "text-xs font-black uppercase tracking-tight",
                      activeIndex === idx ? "text-primary" : "text-slate-600"
                    )}>{lesson.title}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6 pt-0">
                  <div className="pl-12 space-y-4">
                    <p className="text-[11px] text-slate-400 font-medium">{lesson.description?.substring(0, 100)}...</p>
                    <Button 
                      variant="ghost" 
                      onClick={() => setActiveIndex(idx)}
                      className="h-8 px-4 rounded-lg bg-slate-50 text-slate-900 font-black text-[9px] uppercase hover:bg-slate-100"
                    >
                      ESTUDIAR AHORA
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}

            {/* CERTIFICADO FINAL */}
            <div className="bg-slate-50 rounded-2xl p-6 flex items-center justify-between mt-6 group hover:bg-slate-100 transition-colors cursor-pointer border-2 border-dashed border-slate-200">
               <div className="flex items-center gap-4">
                  <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center",
                    isGraduated ? "bg-amber-100 text-amber-600 animate-bounce" : "bg-slate-200 text-slate-400"
                  )}>
                    <Award className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-tight">Certificado de finalización</h4>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{isGraduated ? 'DISPONIBLE PARA DESCARGA' : 'BLOQUEADO: TERMINA EL CURSO'}</p>
                  </div>
               </div>
               {isGraduated ? (
                 <Dialog>
                    <DialogTrigger asChild>
                      <Button size="icon" variant="ghost" className="text-primary hover:bg-white"><FileDown className="h-5 w-5" /></Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-5xl p-0 border-none bg-transparent shadow-none">
                       <CertificateView profile={profile} />
                       <div className="mt-8 flex justify-center">
                          <Button onClick={() => window.print()} className="h-14 px-8 rounded-xl bg-white text-black font-black text-xs uppercase shadow-2xl">IMPRIMIR PDF</Button>
                       </div>
                    </DialogContent>
                 </Dialog>
               ) : <Lock className="h-4 w-4 text-slate-300" />}
            </div>
          </Accordion>
        </div>
      </div>
    </DashboardShell>
  )
}

function CertificateView({ profile }: { profile: any }) {
  const date = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  const photoUrl = getGoogleDriveDirectLink(profile?.photoUrl);
  
  return (
    <div className="bg-slate-950 border-[2px] border-primary p-12 md:p-24 text-center space-y-12 md:space-y-16 relative overflow-hidden aspect-[1.414/1] flex flex-col justify-center select-none shadow-[0_0_100px_rgba(255,153,0,0.15)] print:m-0 print:border-none">
       {/* MARCO DE PODER */}
       <div className="absolute top-0 left-0 w-64 h-64 border-l-[30px] border-t-[30px] border-primary/20 opacity-50" />
       <div className="absolute bottom-0 right-0 w-64 h-64 border-r-[30px] border-b-[30px] border-primary/20 opacity-50" />
       <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />
       
       <div className="absolute -top-20 -right-20 opacity-10 rotate-12">
          <Award className="h-96 w-96 text-primary" />
       </div>

       <div className="space-y-6 md:space-y-10 relative z-10">
          <div className="flex justify-center items-center gap-8 mb-10">
             <div className="h-px bg-primary/30 flex-1" />
             <div className="flex flex-col items-center">
                <div className="h-20 w-20 md:h-28 md:w-28 bg-slate-900 rounded-full flex items-center justify-center border-4 border-primary shadow-[0_0_30px_rgba(255,153,0,0.3)]">
                   <Award className="h-10 w-10 md:h-14 md:w-14 text-primary fill-current" />
                </div>
                <div className="mt-4 flex gap-1">
                   {[1,2,3,4,5].map(s => <Star key={s} className="h-3 w-3 text-primary fill-current" />)}
                </div>
             </div>
             <div className="h-px bg-primary/30 flex-1" />
          </div>
          
          <div className="space-y-2">
            <h4 className="text-[12px] md:text-[16px] font-black uppercase tracking-[0.8em] text-slate-500 mb-4">Sync Connect Academy • Global Systems</h4>
            <h1 className="text-5xl md:text-8xl font-headline font-black text-white uppercase italic tracking-tighter leading-none">CERTIFICADO DE <span className="text-primary underline decoration-[10px] underline-offset-[10px]">MÉRITO</span></h1>
          </div>
       </div>

       <div className="space-y-10 relative z-10">
          <div className="flex flex-col items-center justify-center gap-6">
             <p className="text-lg md:text-2xl font-medium text-slate-400 uppercase tracking-[0.3em]">OTORGADO AL SOCIO EMBAJADOR:</p>
             
             <div className="flex items-center gap-10">
                <div className="relative">
                   <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-primary shadow-2xl relative z-20">
                      <AvatarImage src={photoUrl} className="object-cover" />
                      <AvatarFallback className="bg-slate-800 text-white font-black text-2xl">{profile?.firstName?.charAt(0)}</AvatarFallback>
                   </Avatar>
                   <div className="absolute -bottom-2 -right-2 bg-primary text-slate-950 p-2 rounded-full z-30 shadow-lg ring-4 ring-slate-950">
                      <ShieldCheck className="h-5 w-5" />
                   </div>
                </div>
                <div className="border-b-[4px] border-primary pb-4">
                  <h2 className="text-4xl md:text-7xl font-headline font-black text-white uppercase italic tracking-tight shadow-primary/20 drop-shadow-2xl">
                    {profile?.firstName} {profile?.lastName}
                  </h2>
                </div>
             </div>
          </div>

          <p className="text-xl md:text-2xl font-medium text-slate-400 max-w-4xl mx-auto leading-relaxed mt-10">
            Habiendo completado el ciclo de formación en marketing estratégico y técnicas de venta digital.
          </p>
          
          <div className="inline-block relative group">
             <div className="py-6 px-16 bg-primary text-slate-950 inline-block rounded-2xl shadow-[0_15px_40px_rgba(255,153,0,0.4)] relative z-10">
                <h3 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter flex items-center gap-4">
                  <Zap className="h-8 w-8 fill-current" /> MÁSTER EN VENTAS DIGITALES SYNC
                </h3>
             </div>
          </div>
       </div>

       <div className="grid grid-cols-2 gap-32 pt-16 relative z-10 max-w-5xl mx-auto w-full">
          <div className="space-y-5">
             <div className="h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent w-full" />
             <p className="text-xs font-black uppercase text-white tracking-[0.4em]">DIRECCIÓN SYNC</p>
             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">FIRMA AUTORIZADA</p>
          </div>
          <div className="space-y-5">
             <div className="h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent w-full" />
             <p className="text-xs font-black uppercase text-white tracking-[0.4em]">{date}</p>
             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">FECHA DE EMISIÓN</p>
          </div>
       </div>
    </div>
  )
}
