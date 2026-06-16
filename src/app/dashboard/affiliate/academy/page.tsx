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
  Lock,
  Star,
  Zap,
  FileText,
  Layers,
  HelpCircle,
  ListChecks
} from 'lucide-react'
import { useFirestore, useCollection, useMemoFirebase, useUser, setDocumentNonBlocking, useDoc } from '@/firebase'
import { collection, doc, query, where, getDocs } from 'firebase/firestore'
import { cn, getGoogleDriveDirectLink } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

export default function AffiliateAcademyPage() {
  const db = useFirestore()
  const { user } = useUser()
  const { toast } = useToast()
  
  const modulesQuery = useMemoFirebase(() => collection(db, 'academy_modules'), [db]);
  const { data: modules, isLoading: modulesLoading } = useCollection(modulesQuery);

  const lessonsQuery = useMemoFirebase(() => collection(db, 'academy_lessons'), [db]);
  const { data: lessons, isLoading: lessonsLoading } = useCollection(lessonsQuery);

  const affiliateRef = useMemoFirebase(() => (user ? doc(db, 'affiliates', user.uid) : null), [db, user]);
  const { data: profile } = useDoc(affiliateRef);

  const progressRef = useMemoFirebase(() => (user ? doc(db, 'affiliate_progress', user.uid) : null), [db, user]);
  const { data: progress } = useDoc(progressRef);

  const [activeIndex, setActiveIndex] = useState(0)
  const [showQuiz, setShowQuiz] = useState<string | null>(null) // moduleId
  const [currentQuizQuestions, setCurrentQuizQuestions] = useState<any[]>([])
  
  const sortedModules = modules ? [...modules].sort((a, b) => (a.order || 0) - (b.order || 0)) : []
  const allLessons = lessons ? [...lessons].sort((a, b) => {
    const modA = sortedModules.find(m => m.id === a.moduleId)?.order || 0;
    const modB = sortedModules.find(m => m.id === b.moduleId)?.order || 0;
    if (modA !== modB) return modA - modB;
    return (a.order || 0) - (b.order || 0);
  }) : []

  const currentLesson = allLessons[activeIndex]
  const completedIds = progress?.completedLessonIds || []
  const passedModuleIds = progress?.passedModuleIds || []

  const isCompleted = (id: string) => completedIds.includes(id)
  const isModulePassed = (moduleId: string) => passedModuleIds.includes(moduleId)

  const toggleComplete = async (lessonId: string) => {
    if (!user || !progressRef) return;
    
    let newIds = [...completedIds];
    if (!newIds.includes(lessonId)) {
      newIds.push(lessonId);
      toast({ title: "Clase Finalizada ✓", description: "Sigue adelante con tu formación." });
      setDocumentNonBlocking(progressRef, {
        uid: user.uid,
        completedLessonIds: newIds,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }
  };

  const startModuleQuiz = async (moduleId: string) => {
    try {
      const q = query(collection(db, 'academy_questions'), where('moduleId', '==', moduleId));
      const snap = await getDocs(q);
      const questions = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      if (questions.length === 0) {
        toast({ title: "Sin examen", description: "Este módulo no requiere evaluación teórica." });
        // Auto-pasar si no hay examen
        const newPassed = [...passedModuleIds, moduleId];
        if (progressRef) setDocumentNonBlocking(progressRef, { passedModuleIds: newPassed }, { merge: true });
        return;
      }

      setCurrentQuizQuestions(questions);
      setShowQuiz(moduleId);
    } catch (e) {
      toast({ variant: "destructive", title: "Error al cargar quiz" });
    }
  }

  const getEmbedUrl = (url: string) => {
    if (!url) return "";
    if (url.includes('youtube.com/watch?v=')) return url.replace('watch?v=', 'embed/');
    if (url.includes('youtu.be/')) return url.replace('youtu.be/', 'youtube.com/embed/');
    return url;
  };

  const lessonPercent = allLessons.length > 0 ? (completedIds.length / allLessons.length) * 100 : 0;
  const isGraduated = passedModuleIds.length === sortedModules.length && sortedModules.length > 0;

  if (modulesLoading || lessonsLoading) {
    return (
      <DashboardShell role="affiliate">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cargando Plan de Estudios...</p>
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell role="affiliate">
      <div className="max-w-5xl mx-auto space-y-10 pb-20">
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b pb-8">
           <div className="flex items-center gap-5">
              <div className="h-16 w-16 bg-slate-900 rounded-2xl flex items-center justify-center shadow-xl">
                <GraduationCap className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-headline font-black text-slate-900 uppercase italic leading-none">Sync Academy</h1>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2">Elite Educational System</p>
              </div>
           </div>
           <div className="w-full md:w-64 space-y-2">
              <div className="flex justify-between items-end">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progreso Global</span>
                 <span className="text-xs font-black text-primary">{Math.round(lessonPercent)}%</span>
              </div>
              <Progress value={lessonPercent} className="h-1.5 bg-slate-200" />
           </div>
        </div>

        {showQuiz ? (
          <AcademyExam 
            questions={currentQuizQuestions}
            onPass={() => {
              const newPassed = [...passedModuleIds, showQuiz];
              if (progressRef) setDocumentNonBlocking(progressRef, { passedModuleIds: newPassed }, { merge: true });
              setShowQuiz(null);
              toast({ title: "¡Módulo Aprobado!", description: "Has certificado este nivel con éxito." });
            }} 
            onBack={() => setShowQuiz(null)}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* LADO IZQUIERDO: CONTENIDO */}
            <div className="lg:col-span-8 space-y-8">
              {currentLesson ? (
                <div className="space-y-8 animate-in fade-in duration-700">
                  <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-black aspect-video relative ring-1 ring-slate-100">
                     <iframe 
                        src={getEmbedUrl(currentLesson.videoUrl)} 
                        className="w-full h-full border-none"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                  </Card>

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                     <div>
                       <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">REPRODUCIENDO:</p>
                       <h2 className="text-2xl md:text-3xl font-black text-slate-900 uppercase italic leading-none">{currentLesson.title}</h2>
                     </div>
                     <Button 
                      onClick={() => toggleComplete(currentLesson.id)}
                      className={cn(
                        "h-12 px-8 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all active:scale-95",
                        isCompleted(currentLesson.id) ? "bg-green-600 text-white" : "bg-slate-900 text-white"
                      )}
                     >
                       {isCompleted(currentLesson.id) ? "MÓDULO COMPLETADO ✓" : "MARCAR COMO FINALIZADO"}
                     </Button>
                  </div>
                  
                  <div className="bg-white p-10 rounded-[2.5rem] border ring-1 ring-slate-100 shadow-sm space-y-4">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                       <FileText className="h-4 w-4" /> Notas de la sesión
                     </p>
                     <p className="text-sm text-slate-600 font-medium leading-relaxed">
                       {currentLesson.description || 'Sin notas adicionales para esta lección.'}
                     </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveIndex(activeIndex - 1)} 
                      disabled={activeIndex === 0}
                      className="h-16 rounded-2xl border-slate-200 font-black text-xs uppercase"
                    >
                      <ChevronLeft className="mr-2 h-5 w-5" /> ANTERIOR
                    </Button>
                    <Button 
                      onClick={() => {
                        if (activeIndex < allLessons.length - 1) setActiveIndex(activeIndex + 1);
                      }} 
                      className="h-16 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase shadow-xl"
                    >
                      SIGUIENTE CLASE <ChevronRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-40 bg-white rounded-[3rem] border-dashed border-2 border-slate-200">
                   <Layers className="h-16 w-16 text-slate-100 mx-auto mb-6" />
                   <p className="text-xs font-black uppercase text-slate-400 tracking-widest">No hay lecciones disponibles</p>
                </div>
              )}
            </div>

            {/* LADO DERECHO: TEMARIO GRUPADO */}
            <div className="lg:col-span-4 space-y-6">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2 px-2">
                <Layers className="h-4 w-4" /> Temario Modular
              </h3>
              
              <Accordion type="multiple" className="space-y-3">
                {sortedModules.map((mod) => {
                  const moduleLessons = allLessons.filter(l => l.moduleId === mod.id);
                  const completedInModule = moduleLessons.filter(l => isCompleted(l.id)).length;
                  const isModuleFinished = moduleLessons.length > 0 && completedInModule === moduleLessons.length;
                  const passed = isModulePassed(mod.id);

                  return (
                    <AccordionItem key={mod.id} value={mod.id} className="border-none bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 overflow-hidden">
                      <AccordionTrigger className="px-6 py-5 hover:no-underline hover:bg-slate-50 transition-colors group">
                        <div className="flex items-center gap-4 text-left">
                          <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner group-data-[state=open]:bg-primary group-data-[state=open]:text-white", passed ? "bg-green-100 text-green-600" : "bg-slate-100")}>
                            {passed ? <CheckCircle2 className="h-5 w-5" /> : <span className="font-black text-xs">{mod.order}</span>}
                          </div>
                          <div>
                            <span className="text-[11px] font-black uppercase tracking-tight text-slate-900 block">{mod.title}</span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase">{completedInModule}/{moduleLessons.length} Clases</span>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-3 pb-4 pt-0">
                        <div className="space-y-1">
                          {moduleLessons.map((lesson) => {
                            const lIndex = allLessons.findIndex(l => l.id === lesson.id);
                            return (
                              <button 
                                key={lesson.id}
                                onClick={() => setActiveIndex(lIndex)}
                                className={cn(
                                  "w-full flex items-center gap-3 p-4 rounded-xl transition-all text-left",
                                  activeIndex === lIndex ? "bg-primary/5 ring-1 ring-primary/20" : "hover:bg-slate-50"
                                )}
                              >
                                {isCompleted(lesson.id) ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" /> : <PlayCircle className="h-4 w-4 text-slate-300 shrink-0" />}
                                <span className={cn(
                                  "text-[10px] font-bold uppercase truncate",
                                  activeIndex === lIndex ? "text-primary" : "text-slate-500"
                                )}>
                                  {lesson.order}. {lesson.title}
                                </span>
                              </button>
                            );
                          })}

                          {isModuleFinished && !passed && (
                            <div className="pt-4 px-2">
                               <Button onClick={() => startModuleQuiz(mod.id)} className="w-full h-12 bg-primary text-white rounded-xl font-black text-[9px] uppercase tracking-widest gap-2 shadow-xl shadow-primary/20 animate-bounce">
                                 <HelpCircle className="h-4 w-4" /> HACER EXAMEN DE NIVEL
                               </Button>
                            </div>
                          )}
                          {passed && (
                             <div className="pt-2 px-2 flex items-center justify-center gap-2 text-green-600 font-black text-[8px] uppercase">
                                <ShieldCheck className="h-3 w-3" /> NIVEL CERTIFICADO ✓
                             </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>

              {/* DIPLOMA SECTION */}
              <Card className={cn(
                "p-8 rounded-[2rem] border-2 border-dashed transition-all mt-6 text-center space-y-4",
                isGraduated ? "bg-slate-950 text-white border-primary shadow-2xl scale-[1.02]" : "bg-slate-50 text-slate-400 border-slate-200"
              )}>
                 <div className={cn(
                   "h-20 w-20 rounded-[1.5rem] flex items-center justify-center mx-auto shadow-2xl",
                   isGraduated ? "bg-primary text-slate-950" : "bg-slate-200 text-slate-400"
                 )}>
                   <Award className="h-10 w-10" />
                 </div>
                 <div>
                   <h4 className="text-xs font-black uppercase tracking-tight">Diploma Profesional</h4>
                   <p className="text-[8px] font-bold uppercase tracking-widest mt-1">
                     {isGraduated ? 'DISPONIBLE PARA DESCARGA' : 'CERTIFICA TODOS LOS MÓDULOS'}
                   </p>
                 </div>
                 {isGraduated ? (
                    <Dialog>
                       <DialogTrigger asChild>
                         <Button className="w-full h-12 rounded-xl bg-primary text-slate-950 font-black text-[10px] uppercase shadow-lg shadow-primary/20">VER MI TÍTULO</Button>
                       </DialogTrigger>
                       <DialogContent className="max-w-5xl p-0 border-none bg-transparent shadow-none">
                          <CertificateView profile={profile} />
                          <div className="mt-8 flex justify-center">
                             <Button onClick={() => window.print()} className="h-14 px-8 rounded-xl bg-white text-black font-black text-xs uppercase shadow-2xl">GUARDAR COMO PDF</Button>
                          </div>
                       </DialogContent>
                    </Dialog>
                 ) : <div className="h-12 flex items-center justify-center"><Lock className="h-5 w-5 opacity-20" /></div>}
              </Card>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  )
}

function AcademyExam({ questions, onPass, onBack }: { questions: any[], onPass: () => void, onBack: () => void }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [checking, setChecking] = useState(false);
  const { toast } = useToast();

  const handleSubmit = () => {
    if (Object.keys(answers).length < questions.length) {
      toast({ variant: "destructive", title: "Examen Incompleto", description: "Responde todas las preguntas." });
      return;
    }
    setChecking(true);
    setTimeout(() => {
      const allCorrect = questions.every((q, idx) => answers[idx] === q.correctIndex);
      if (allCorrect) {
        onPass();
      } else {
        toast({ variant: "destructive", title: "Evaluación fallida", description: "Debes acertar todas las preguntas para certificar el nivel." });
        setChecking(false);
      }
    }, 1500);
  };

  return (
    <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden max-w-2xl mx-auto">
      <div className="bg-slate-900 p-10 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Zap className="h-6 w-6 text-primary" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Evaluación de Nivel</span>
        </div>
        <h2 className="text-3xl font-headline font-black uppercase italic">Validación de <span className="text-primary">Conocimientos</span></h2>
      </div>
      <CardContent className="p-10 space-y-10">
        {questions.map((q, idx) => (
          <div key={idx} className="space-y-6">
             <h4 className="text-lg font-black text-slate-900 uppercase leading-tight">{idx + 1}. {q.text}</h4>
             <RadioGroup onValueChange={(v) => setAnswers({...answers, [idx]: parseInt(v)})} className="grid gap-4">
                {q.options.map((opt: string, optIdx: number) => (
                  <div key={optIdx} className="flex items-center space-x-3 p-5 rounded-2xl border hover:bg-slate-50 transition-all cursor-pointer">
                    <RadioGroupItem value={optIdx.toString()} id={`${idx}-${optIdx}`} />
                    <Label htmlFor={`${idx}-${optIdx}`} className="text-sm font-bold cursor-pointer flex-1">{opt}</Label>
                  </div>
                ))}
             </RadioGroup>
          </div>
        ))}
        <div className="pt-8 border-t flex flex-col sm:flex-row gap-4">
          <Button variant="ghost" onClick={onBack} className="flex-1 h-16 rounded-2xl font-black text-xs uppercase">REVISAR CLASES</Button>
          <Button onClick={handleSubmit} disabled={checking} className="flex-[2] h-16 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase shadow-xl">
            {checking ? <Loader2 className="animate-spin" /> : "ENVIAR EVALUACIÓN"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CertificateView({ profile }: { profile: any }) {
  const date = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  const photoUrl = getGoogleDriveDirectLink(profile?.photoUrl);
  
  return (
    <div className="bg-slate-950 border-[2px] border-primary p-12 md:p-24 text-center space-y-12 md:space-y-16 relative overflow-hidden aspect-[1.414/1] flex flex-col justify-center select-none shadow-[0_0_100px_rgba(255,153,0,0.15)] print:m-0 print:border-none">
       <div className="absolute top-0 left-0 w-64 h-64 border-l-[30px] border-t-[30px] border-primary/20 opacity-50" />
       <div className="absolute bottom-0 right-0 w-64 h-64 border-r-[30px] border-b-[30px] border-primary/20 opacity-50" />
       
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
                </div>
                <div className="border-b-[4px] border-primary pb-4">
                  <h2 className="text-4xl md:text-7xl font-headline font-black text-white uppercase italic tracking-tight">
                    {profile?.firstName} {profile?.lastName}
                  </h2>
                </div>
             </div>
          </div>

          <p className="text-xl md:text-2xl font-medium text-slate-400 max-w-4xl mx-auto leading-relaxed mt-10">
            Habiendo completado satisfactoriamente el ciclo de formación técnica y la evaluación de aptitudes comerciales por módulos.
          </p>
          
          <div className="inline-block relative">
             <div className="py-6 px-16 bg-primary text-slate-950 inline-block rounded-2xl shadow-[0_15px_40px_rgba(255,153,0,0.4)] relative z-10">
                <h3 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter flex items-center gap-4">
                  <Zap className="h-8 w-8 fill-current" /> MÁSTER EN VENTAS DIGITALES SYNC
                </h3>
             </div>
          </div>
       </div>

       <div className="grid grid-cols-2 gap-32 pt-16 relative z-10 max-w-5xl mx-auto w-full">
          <div className="space-y-5 text-left">
             <div className="h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent w-full" />
             <p className="text-xs font-black uppercase text-white tracking-[0.4em]">DIRECCIÓN SYNC</p>
          </div>
          <div className="space-y-5 text-right">
             <div className="h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent w-full" />
             <p className="text-xs font-black uppercase text-white tracking-[0.4em]">{date}</p>
          </div>
       </div>
    </div>
  )
}
