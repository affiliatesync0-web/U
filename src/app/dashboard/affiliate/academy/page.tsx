
"use client"

import { useState, useEffect } from 'react'
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
  FileDown,
  Printer,
  Image as ImageIcon,
  User,
  Star,
  Zap
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

  const getYoutubeThumbnail = (url: string) => {
    const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://img.youtube.com/vi/${match[2]}/mqdefault.jpg`;
    }
    return null;
  };

  const percent = lessons && lessons.length > 0 ? (completedIds.length / lessons.length) * 100 : 0;
  const isGraduated = percent === 100 && (lessons?.length || 0) > 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <DashboardShell role="affiliate">
      <div className="space-y-10 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="h-14 w-14 bg-slate-950 rounded-2xl flex items-center justify-center text-white shadow-2xl">
              <GraduationCap className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-4xl font-headline font-black text-slate-900 tracking-tight uppercase italic leading-none">Sync <span className="text-primary">Academy</span></h1>
              <p className="text-slate-500 font-medium mt-1">Formación oficial para Socios Platinum.</p>
            </div>
          </div>

          <div className="flex items-center gap-6 bg-white p-4 px-6 rounded-3xl border shadow-xl ring-1 ring-slate-100">
             <div className="text-right">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Tu Progreso</p>
                <div className="flex items-center gap-2">
                   <p className="text-2xl font-black text-slate-900 leading-none">{Math.round(percent)}%</p>
                </div>
             </div>
             <div className="h-12 w-px bg-slate-100" />
             <div className={cn(
               "h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-700",
               isGraduated ? "bg-amber-100 text-amber-600 shadow-xl shadow-amber-200" : "bg-slate-50 text-slate-200"
             )}>
                <Trophy className="h-7 w-7" />
             </div>
          </div>
        </div>

        {isGraduated && (
          <Card className="border-none shadow-2xl rounded-[3rem] bg-slate-950 text-white p-12 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12 group-hover:rotate-0 transition-transform duration-1000"><Award className="h-80 w-80 text-primary" /></div>
             <div className="relative z-10 space-y-8">
                <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-primary/20 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.4em]">
                   ESTADO: GRADUADO ✓
                </div>
                <div className="space-y-3">
                  <h2 className="text-4xl md:text-6xl font-headline font-black tracking-tighter leading-none uppercase italic">
                     MÁSTER EN <span className="text-primary">VENTAS DIGITALES</span>
                  </h2>
                  <p className="text-slate-400 font-medium max-w-2xl text-lg leading-relaxed">
                     Has completado el ciclo de formación técnica. Eres oficialmente un especialista certificado en el sistema Sync.
                  </p>
                </div>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="h-16 px-10 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-widest shadow-2xl gap-3 transition-all active:scale-95">
                      <FileDown className="h-6 w-6" /> GENERAR DIPLOMA OFICIAL
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-5xl p-0 border-none bg-transparent shadow-none overflow-hidden">
                     <CertificateView profile={profile} />
                     <div className="mt-10 flex justify-center gap-4">
                        <Button onClick={handlePrint} className="h-14 px-8 rounded-2xl bg-white text-slate-900 font-black text-[10px] uppercase tracking-widest gap-2 hover:bg-slate-50 shadow-2xl border-none">
                          <Printer className="h-5 w-5" /> IMPRIMIR O GUARDAR PDF
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
          <Card className="p-40 text-center border-dashed border-2 border-slate-200 bg-white rounded-3xl">
             <Video className="h-16 w-16 text-slate-100 mx-auto mb-6" />
             <p className="text-xs font-black text-slate-400 uppercase tracking-[0.5em]">Próximo material en desarrollo</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-8 space-y-10">
              <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-black aspect-video relative ring-1 ring-white/10 shadow-slate-900/10">
                {activeLesson ? (
                  <iframe 
                    src={getEmbedUrl(activeLesson.videoUrl)} 
                    className="w-full h-full border-none"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-white/10">
                    <PlayCircle className="h-24 w-24" />
                  </div>
                )}
              </Card>
              
              {activeLesson && (
                <div className="space-y-8 px-2">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                      <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">{activeLesson.title}</h2>
                      <div className="flex items-center gap-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                         <span className="flex items-center gap-2"><Clock className="h-4 w-4" /> Publicado: {new Date(activeLesson.createdAt).toLocaleDateString()}</span>
                         <span className="flex items-center gap-2 text-primary"><ShieldCheck className="h-4 w-4" /> Academia Sync</span>
                      </div>
                    </div>
                    <Button 
                      onClick={() => toggleComplete(activeLesson.id)}
                      className={cn(
                        "h-14 px-10 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl active:scale-95",
                        isCompleted(activeLesson.id) ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-slate-950 text-white hover:bg-slate-900"
                      )}
                    >
                      {isCompleted(activeLesson.id) ? <><CheckCircle2 className="mr-2 h-5 w-5" /> LECCIÓN TERMINADA ✓</> : "MARCAR COMO FINALIZADA"}
                    </Button>
                  </div>
                  <div className="p-10 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                    <p className="text-slate-600 text-lg leading-relaxed font-medium whitespace-pre-wrap">
                      {activeLesson.description || 'Este módulo no cuenta con descripción adicional.'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <Card className="lg:col-span-4 border-none shadow-2xl rounded-3xl bg-white overflow-hidden h-[700px] flex flex-col ring-1 ring-slate-100">
              <CardHeader className="bg-slate-950 border-b p-8 text-white">
                <CardTitle className="text-xs font-black uppercase tracking-[0.3em]">Lista de Módulos</CardTitle>
              </CardHeader>
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-2">
                  {lessons.sort((a, b) => (a.order || 0) - (b.order || 0)).map((lesson, idx) => {
                    const thumb = getYoutubeThumbnail(lesson.videoUrl);
                    return (
                      <button 
                        key={lesson.id}
                        onClick={() => setSelectedLesson(lesson)}
                        className={cn(
                          "w-full text-left p-4 rounded-2xl flex items-center gap-5 transition-all group",
                          activeLesson?.id === lesson.id ? "bg-slate-900 text-white shadow-2xl rotate-1" : "hover:bg-slate-50"
                        )}
                      >
                        <div className="relative h-14 w-24 shrink-0 rounded-xl overflow-hidden bg-slate-100 border">
                           {thumb ? (
                             <img src={thumb} className="w-full h-full object-cover" alt="" />
                           ) : <div className="h-full w-full flex items-center justify-center text-slate-300"><ImageIcon className="h-4 w-4" /></div>}
                           {isCompleted(lesson.id) && (
                             <div className="absolute inset-0 bg-green-600/60 backdrop-blur-[2px] flex items-center justify-center">
                               <CheckCircle2 className="h-6 w-6 text-white" />
                             </div>
                           )}
                           <div className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 rounded text-[7px] font-black text-white">#{idx + 1}</div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-[11px] font-black uppercase truncate tracking-tight", activeLesson?.id === lesson.id ? "text-white" : "text-slate-900")}>{lesson.title}</p>
                          <p className={cn("text-[9px] font-bold uppercase tracking-widest mt-1", activeLesson?.id === lesson.id ? "text-slate-400" : "text-slate-400")}>
                            {isCompleted(lesson.id) ? 'Revisar' : 'Por ver'}
                          </p>
                        </div>
                        <ChevronRight className={cn("h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1", activeLesson?.id === lesson.id ? "text-white" : "text-slate-200")} />
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </Card>
          </div>
        )}
      </div>

      <div className="hidden print:block fixed inset-0 bg-white z-[9999]">
         <CertificateView profile={profile} />
      </div>
    </DashboardShell>
  )
}

function CertificateView({ profile }: { profile: any }) {
  const date = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  const photoUrl = getGoogleDriveDirectLink(profile?.photoUrl);
  
  return (
    <div className="bg-slate-950 border-[2px] border-primary p-12 md:p-24 text-center space-y-12 md:space-y-16 relative overflow-hidden aspect-[1.414/1] flex flex-col justify-center select-none shadow-[0_0_100px_rgba(255,153,0,0.15)]">
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
                <div className="h-20 w-20 md:h-28 md:w-28 bg-slate-900 rounded-full flex items-center justify-center border-4 border-primary shadow-[0_0_30px_rgba(255,153,0,0.3)] animate-pulse">
                   <Award className="h-10 w-10 md:h-14 md:w-14 text-primary fill-current" />
                </div>
                <div className="mt-4 flex gap-1">
                   {[1,2,3,4,5].map(s => <Star key={s} className="h-3 w-3 text-primary fill-current" />)}
                </div>
             </div>
             <div className="h-px bg-primary/30 flex-1" />
          </div>
          
          <div className="space-y-2">
            <h4 className="text-[12px] md:text-[16px] font-black uppercase tracking-[0.8em] text-slate-500 mb-4">Sync Connect Academy • High Performance Education</h4>
            <h1 className="text-5xl md:text-8xl font-headline font-black text-white uppercase italic tracking-tighter leading-none">CERTIFICADO DE <span className="text-primary underline decoration-[10px] underline-offset-[10px]">MÉRITO</span></h1>
          </div>
       </div>

       <div className="space-y-10 relative z-10">
          <div className="flex flex-col items-center justify-center gap-6">
             <p className="text-lg md:text-2xl font-medium text-slate-400 uppercase tracking-[0.3em]">OTORGADO CON DISTINCIÓN AL SOCIO EMBAJADOR:</p>
             
             <div className="flex items-center gap-10">
                <div className="relative">
                   <div className="absolute inset-0 bg-primary blur-2xl rounded-full opacity-20" />
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
            Habiendo demostrado dominio absoluto en marketing estratégico, psicología de ventas y técnicas de cierre masivo dentro de la infraestructura digital Sync Connect.
          </p>
          
          <div className="inline-block relative group">
             <div className="absolute inset-0 bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
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
             <p className="text-xs font-black uppercase text-white tracking-[0.4em]">DIRECCIÓN EJECUTIVA SYNC</p>
             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center justify-center gap-2">
                <ShieldCheck className="h-3 w-3 text-primary" /> FIRMA AUTORIZADA
             </p>
          </div>
          <div className="space-y-5">
             <div className="h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent w-full" />
             <p className="text-xs font-black uppercase text-white tracking-[0.4em]">{date}</p>
             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center justify-center gap-2">
                <Clock className="h-3 w-3 text-primary" /> FECHA DE EXPEDICIÓN
             </p>
          </div>
       </div>

       {/* MARCA DE AGUA INVISIBLE/VISIBLE */}
       <div className="absolute bottom-12 left-12 opacity-[0.02] -rotate-45 pointer-events-none">
         <span className="text-9xl font-black italic tracking-tighter text-white">GENUINE ACCOUNT</span>
       </div>
    </div>
  )
}
