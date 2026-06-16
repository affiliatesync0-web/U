"use client"

import { useState } from 'react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2, Loader2, PlayCircle, Video, Save, X, Layers, BookOpen, ChevronRight, Radio, Bell, HelpCircle, ListChecks, CheckCircle2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase'
import { collection, doc, getDocs, setDoc, query, where } from 'firebase/firestore'
import { cn, getYoutubeThumbnail } from '@/lib/utils'
import { sendEmail } from '@/lib/email'

interface Question {
  id?: string;
  text: string;
  options: string[];
  correctIndex: number;
}

export default function AdminAcademyPage() {
  const { toast } = useToast()
  const db = useFirestore()
  
  const [isAddingModule, setIsAddingModule] = useState(false)
  const [isAddingLesson, setIsAddingLesson] = useState(false)
  const [isEditingQuiz, setIsEditingQuiz] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isBroadcasting, setIsBroadcasting] = useState(false)
  
  const modulesQuery = useMemoFirebase(() => db ? collection(db, 'academy_modules') : null, [db]);
  const { data: modules, isLoading: loadingModules } = useCollection(modulesQuery);

  const lessonsQuery = useMemoFirebase(() => db ? collection(db, 'academy_lessons') : null, [db]);
  const { data: lessons, isLoading: loadingLessons } = useCollection(lessonsQuery);

  const [moduleData, setModuleData] = useState({ title: '', description: '' })
  const [lessonData, setLessonData] = useState({ title: '', description: '', videoUrl: '', moduleId: '' })
  const [liveUrl, setLiveUrl] = useState('')

  // Quiz State
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([])

  const handleNotifyLive = async () => {
    if (!liveUrl || !db) {
      toast({ variant: "destructive", title: "Link Requerido", description: "Ingresa el enlace de la clase en vivo." });
      return;
    }
    setIsBroadcasting(true);
    try {
      const affiliatesSnap = await getDocs(collection(db, 'affiliates'));
      const activeAffiliates = affiliatesSnap.docs.map(doc => doc.data()).filter(a => a.status === 'Active');
      
      const batchPromises = activeAffiliates.map(async (aff) => {
        const notifId = `live_${Date.now()}_${aff.id}`;
        await setDoc(doc(db, 'notifications', notifId), {
          userId: aff.id,
          title: '🔴 ¡CLASE EN VIVO AHORA!',
          message: `El administrador ha iniciado una capacitación de élite. Únete ahora mismo.`,
          type: 'system',
          createdAt: new Date().toISOString(),
          isRead: false,
          actionUrl: liveUrl
        });

        if (aff.email) {
          sendEmail({
            to: aff.email,
            subject: '🔴 URGENTE: Capacitación Sync en Vivo',
            text: `¡Hola ${aff.firstName}! Estamos iniciando una capacitación en vivo ahora mismo.\n\nAccede aquí: ${liveUrl}\n\nNo te la pierdas.`,
            title: 'Clase en Vivo'
          }).catch(e => console.error("Email failed:", e));
        }
      });

      await Promise.all(batchPromises);
      toast({ title: "Broadcast Enviado ✓", description: `Notificación enviada a ${activeAffiliates.length} socios.` });
      setLiveUrl('');
    } catch (e) {
      toast({ variant: "destructive", title: "Error en Broadcast" });
    } finally {
      setIsBroadcasting(false);
    }
  }

  const handleSaveModule = async () => {
    if (!moduleData.title || !db) return;
    setIsProcessing(true);
    try {
      addDocumentNonBlocking(collection(db, 'academy_modules'), {
        ...moduleData,
        createdAt: new Date().toISOString(),
        order: (modules?.length || 0) + 1
      });
      setIsAddingModule(false);
      setModuleData({ title: '', description: '' });
      toast({ title: "Módulo Creado" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error al guardar" });
    } finally {
      setIsProcessing(false);
    }
  }

  const handleSaveLesson = async () => {
    if (!lessonData.title || !lessonData.videoUrl || !lessonData.moduleId || !db) {
      toast({ variant: "destructive", title: "Faltan datos", description: "Todos los campos son obligatorios." });
      return;
    }
    setIsProcessing(true);
    try {
      addDocumentNonBlocking(collection(db, 'academy_lessons'), {
        ...lessonData,
        createdAt: new Date().toISOString(),
        order: (lessons?.filter(l => l.moduleId === lessonData.moduleId).length || 0) + 1
      });
      setIsAddingLesson(false);
      setLessonData({ title: '', description: '', videoUrl: '', moduleId: '' });
      toast({ title: "Lección Publicada" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error al guardar" });
    } finally {
      setIsProcessing(false);
    }
  }

  const openQuizEditor = async (moduleId: string) => {
    setIsEditingQuiz(moduleId);
    setIsProcessing(true);
    try {
      const q = query(collection(db, 'academy_questions'), where('moduleId', '==', moduleId));
      const snap = await getDocs(q);
      const existing = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
      setQuizQuestions(existing.length > 0 ? existing : [{ text: '', options: ['', '', ''], correctIndex: 0 }]);
    } catch (e) {
      toast({ variant: "destructive", title: "Error al cargar examen" });
    } finally {
      setIsProcessing(false);
    }
  }

  const handleAddQuestion = () => {
    setQuizQuestions([...quizQuestions, { text: '', options: ['', '', ''], correctIndex: 0 }]);
  }

  const handleUpdateQuestion = (idx: number, field: keyof Question, value: any) => {
    const updated = [...quizQuestions];
    (updated[idx] as any)[field] = value;
    setQuizQuestions(updated);
  }

  const handleUpdateOption = (qIdx: number, optIdx: number, value: string) => {
    const updated = [...quizQuestions];
    updated[qIdx].options[optIdx] = value;
    setQuizQuestions(updated);
  }

  const handleSaveQuiz = async () => {
    if (!isEditingQuiz || !db) return;
    setIsProcessing(true);
    try {
      // Borrar antiguos y guardar nuevos para simplicidad (o actualizar si tienen ID)
      const batchPromises = quizQuestions.map(q => {
        const qRef = q.id ? doc(db, 'academy_questions', q.id) : doc(collection(db, 'academy_questions'));
        return setDoc(qRef, {
          ...q,
          moduleId: isEditingQuiz,
          updatedAt: new Date().toISOString()
        });
      });
      await Promise.all(batchPromises);
      toast({ title: "Examen Guardado ✓" });
      setIsEditingQuiz(null);
    } catch (e) {
      toast({ variant: "destructive", title: "Error al guardar examen" });
    } finally {
      setIsProcessing(false);
    }
  }

  const handleDeleteModule = (id: string) => {
    if(confirm("¿Eliminar módulo y todas sus lecciones?") && db) {
      deleteDocumentNonBlocking(doc(db, 'academy_modules', id));
      toast({ title: "Módulo eliminado" });
    }
  }

  const handleDeleteLesson = (id: string) => {
    if(confirm("¿Eliminar lección?") && db) {
      deleteDocumentNonBlocking(doc(db, 'academy_lessons', id));
      toast({ title: "Lección eliminada" });
    }
  }

  return (
    <DashboardShell role="admin">
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-headline font-black text-slate-900 tracking-tight uppercase italic">Sync <span className="text-primary">Academy Manager</span></h1>
            <p className="text-slate-500 font-medium">Capacitaciones modulares y alertas en vivo para la red.</p>
          </div>
          
          <div className="flex gap-4">
            <Button onClick={() => setIsAddingModule(true)} variant="outline" className="h-14 px-6 border-slate-300 rounded-xl font-black text-[10px] uppercase tracking-widest gap-2">
              <Layers className="h-5 w-5" /> NUEVO MÓDULO
            </Button>
            <Button onClick={() => setIsAddingLesson(true)} className="h-14 px-8 bg-slate-950 hover:bg-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest gap-2 shadow-2xl">
              <Plus className="h-5 w-5" /> AGREGAR CLASE
            </Button>
          </div>
        </div>

        <Card className="border-none shadow-2xl rounded-[2.5rem] bg-slate-900 text-white overflow-hidden">
           <div className="p-8 md:p-12 flex flex-col md:flex-row items-center gap-10">
              <div className="h-20 w-20 bg-red-600 rounded-3xl flex items-center justify-center shadow-[0_0_50px_rgba(220,38,38,0.4)] animate-pulse shrink-0">
                 <Radio className="h-10 w-10 text-white" />
              </div>
              <div className="flex-1 space-y-4 text-center md:text-left">
                 <h3 className="text-2xl font-headline font-black uppercase italic">Clase <span className="text-red-500">En Vivo</span></h3>
                 <p className="text-slate-400 text-sm font-medium">Ingresa el link de la reunión y notifica a todos tus socios Platinum al instante.</p>
                 <div className="flex flex-col sm:flex-row gap-3">
                    <Input 
                      placeholder="https://zoom.us/j/... o Link de YouTube" 
                      value={liveUrl}
                      onChange={e => setLiveUrl(e.target.value)}
                      className="h-14 bg-white/5 border-none ring-1 ring-white/10 rounded-xl text-white font-bold"
                    />
                    <Button 
                      onClick={handleNotifyLive} 
                      disabled={isBroadcasting}
                      className="h-14 px-10 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-widest gap-3 shadow-xl"
                    >
                      {isBroadcasting ? <Loader2 className="animate-spin h-5 w-5" /> : <Bell className="h-5 w-5" />}
                      LANZAR ALERTA
                    </Button>
                 </div>
              </div>
           </div>
        </Card>

        {/* MODAL: CREAR MÓDULO */}
        <Dialog open={isAddingModule} onOpenChange={setIsAddingModule}>
          <DialogContent className="max-w-lg rounded-2xl p-0 border-none shadow-2xl bg-white overflow-hidden">
            <div className="bg-slate-950 p-8 text-white flex justify-between items-center">
              <DialogTitle className="text-xl font-headline font-black uppercase italic">Crear Módulo</DialogTitle>
              <Button variant="ghost" size="icon" onClick={() => setIsAddingModule(false)} className="text-white/40 hover:text-white"><X className="h-5 w-5" /></Button>
            </div>
            <div className="p-10 space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre del Módulo</Label>
                <Input value={moduleData.title} onChange={e => setModuleData({...moduleData, title: e.target.value})} className="h-14 rounded-xl font-bold bg-slate-50 border-none ring-1 ring-slate-100" placeholder="Ej: Fundamentos de Ventas" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descripción Corta</Label>
                <Textarea value={moduleData.description} onChange={e => setModuleData({...moduleData, description: e.target.value})} className="rounded-xl bg-slate-50 border-none ring-1 ring-slate-100 p-4 text-sm font-medium" />
              </div>
              <Button className="w-full h-16 rounded-xl bg-slate-950 text-white font-black text-xs uppercase tracking-widest shadow-2xl" onClick={handleSaveModule} disabled={isProcessing}>
                {isProcessing ? <Loader2 className="animate-spin" /> : "GUARDAR MÓDULO"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* MODAL: EDITAR EXAMEN DEL MÓDULO */}
        <Dialog open={!!isEditingQuiz} onOpenChange={(v) => !v && setIsEditingQuiz(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl p-0 border-none shadow-2xl bg-white">
            <div className="bg-primary p-8 text-white flex justify-between items-center sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <HelpCircle className="h-6 w-6" />
                <DialogTitle className="text-xl font-headline font-black uppercase italic">Configurar Examen de Módulo</DialogTitle>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsEditingQuiz(null)} className="text-white/40 hover:text-white"><X className="h-5 w-5" /></Button>
            </div>
            <div className="p-10 space-y-8">
              {quizQuestions.map((q, qIdx) => (
                <div key={qIdx} className="p-6 bg-slate-50 rounded-2xl border space-y-4 relative group">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pregunta {qIdx + 1}</span>
                    <Button variant="ghost" size="icon" className="text-red-300 hover:text-red-500 h-8 w-8" onClick={() => setQuizQuestions(quizQuestions.filter((_, i) => i !== qIdx))}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500 ml-1">Enunciado</Label>
                    <Input value={q.text} onChange={e => handleUpdateQuestion(qIdx, 'text', e.target.value)} className="h-12 bg-white font-bold" placeholder="¿Cuál es la regla de oro?" />
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <Label className="text-[10px] font-black uppercase text-slate-500 ml-1">Opciones (Marca la correcta)</Label>
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx} className="flex gap-2 items-center">
                        <RadioGroup value={q.correctIndex.toString()} onValueChange={v => handleUpdateQuestion(qIdx, 'correctIndex', parseInt(v))}>
                          <div className="flex items-center space-x-2">
                             <Radio value={oIdx.toString()} className={cn(q.correctIndex === oIdx ? "text-primary" : "")} />
                          </div>
                        </RadioGroup>
                        <Input value={opt} onChange={e => handleUpdateOption(qIdx, oIdx, e.target.value)} className={cn("flex-1 h-10 bg-white text-xs", q.correctIndex === oIdx ? "ring-2 ring-primary/50" : "")} placeholder={`Opción ${oIdx + 1}`} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              
              <Button variant="outline" onClick={handleAddQuestion} className="w-full h-14 border-dashed border-2 rounded-2xl font-black text-[10px] uppercase gap-2">
                <Plus className="h-4 w-4" /> AÑADIR PREGUNTA
              </Button>

              <div className="pt-6 border-t">
                <Button className="w-full h-16 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest shadow-2xl gap-3" onClick={handleSaveQuiz} disabled={isProcessing}>
                  {isProcessing ? <Loader2 className="animate-spin h-5 w-5" /> : <Save className="h-5 w-5" />}
                  GUARDAR EXAMEN COMPLETO
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* MODAL: NUEVA LECCIÓN */}
        <Dialog open={isAddingLesson} onOpenChange={setIsAddingLesson}>
          <DialogContent className="max-w-lg rounded-2xl p-0 border-none shadow-2xl bg-white overflow-hidden">
            <div className="bg-slate-950 p-8 text-white flex justify-between items-center">
              <DialogTitle className="text-xl font-headline font-black uppercase italic">Nueva Lección</DialogTitle>
              <Button variant="ghost" size="icon" onClick={() => setIsAddingLesson(false)} className="text-white/40 hover:text-white"><X className="h-5 w-5" /></Button>
            </div>
            <div className="p-10 space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Módulo Destino</Label>
                <Select value={lessonData.moduleId} onValueChange={v => setLessonData({...lessonData, moduleId: v})}>
                  <SelectTrigger className="h-14 bg-slate-50 border-none ring-1 ring-slate-100 rounded-xl font-bold">
                    <SelectValue placeholder="Selecciona un módulo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {modules?.map(m => <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Título de la Clase</Label>
                <Input value={lessonData.title} onChange={e => setLessonData({...lessonData, title: e.target.value})} className="h-14 rounded-xl font-bold bg-slate-50 border-none ring-1 ring-slate-100" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">URL de Video (YouTube)</Label>
                <Input value={lessonData.videoUrl} onChange={e => setLessonData({...lessonData, videoUrl: e.target.value})} className="h-14 rounded-xl font-bold bg-slate-50 border-none ring-1 ring-slate-100" placeholder="https://youtube.com/watch?v=..." />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descripción</Label>
                <Textarea value={lessonData.description} onChange={e => setLessonData({...lessonData, description: e.target.value})} className="rounded-xl bg-slate-50 border-none ring-1 ring-slate-100 p-4 text-sm font-medium" />
              </div>
              <Button className="w-full h-16 rounded-xl bg-slate-950 text-white font-black text-xs uppercase tracking-widest shadow-2xl" onClick={handleSaveLesson} disabled={isProcessing}>
                {isProcessing ? <Loader2 className="animate-spin" /> : "PUBLICAR LECCIÓN"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {loadingModules || loadingLessons ? (
          <div className="flex justify-center py-40"><Loader2 className="animate-spin text-slate-300 h-10 w-10" /></div>
        ) : !modules || modules.length === 0 ? (
          <Card className="p-40 text-center border-dashed border-2 border-slate-200 bg-white rounded-3xl">
             <Layers className="h-16 w-16 text-slate-200 mx-auto mb-6" />
             <p className="text-xs font-black text-slate-400 uppercase tracking-[0.4em]">Sin estructura académica</p>
          </Card>
        ) : (
          <div className="space-y-12">
            {modules.sort((a, b) => (a.order || 0) - (b.order || 0)).map((mod) => {
              const moduleLessons = lessons?.filter(l => l.moduleId === mod.id).sort((a, b) => (a.order || 0) - (b.order || 0)) || [];
              return (
                <div key={mod.id} className="space-y-6">
                  <div className="flex items-center justify-between border-b pb-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900 shadow-inner">
                        <span className="font-black text-lg">{mod.order}</span>
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tight">{mod.title}</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{moduleLessons.length} LECCIONES CARGADAS</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openQuizEditor(mod.id)} className="h-10 px-4 rounded-xl font-black text-[9px] uppercase tracking-widest gap-2 border-primary text-primary hover:bg-primary/5">
                        <ListChecks className="h-4 w-4" /> GESTIONAR EXAMEN
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-300 hover:text-red-500" onClick={() => handleDeleteModule(mod.id)}><Trash2 className="h-5 w-5" /></Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {moduleLessons.map(lesson => (
                      <Card key={lesson.id} className="border-none shadow-lg hover:shadow-xl transition-all rounded-2xl overflow-hidden bg-white ring-1 ring-slate-100 group">
                         <div className="aspect-video bg-slate-900 flex items-center justify-center relative overflow-hidden">
                            <img src={getYoutubeThumbnail(lesson.videoUrl)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Video Preview" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <PlayCircle className="h-12 w-12 text-white/80" />
                            </div>
                         </div>
                         <CardContent className="p-6 flex justify-between items-start">
                            <div className="min-w-0 flex-1">
                               <p className="text-[8px] font-black text-primary uppercase mb-1">Clase {lesson.order}</p>
                               <h3 className="font-bold text-xs text-slate-900 uppercase truncate">{lesson.title}</h3>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-red-500" onClick={() => handleDeleteLesson(lesson.id)}><Trash2 className="h-4 w-4" /></Button>
                         </CardContent>
                      </Card>
                    ))}
                    <button 
                      onClick={() => { setLessonData({...lessonData, moduleId: mod.id}); setIsAddingLesson(true); }}
                      className="border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-8 hover:bg-slate-50 transition-colors gap-2 text-slate-400 group"
                    >
                      <Plus className="h-6 w-6 group-hover:text-primary" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Añadir a {mod.title}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardShell>
  )
}

function Radio({ value, className, onClick }: { value: string, className?: string, onClick?: () => void }) {
  return (
    <div className={cn("h-4 w-4 rounded-full border-2 border-slate-300 flex items-center justify-center", className)}>
      <div className="h-2 w-2 rounded-full bg-current opacity-0 data-[state=checked]:opacity-100" />
    </div>
  )
}
