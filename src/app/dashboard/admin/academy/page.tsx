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
import { Plus, Trash2, Loader2, PlayCircle, Video, Save, X, Layers, BookOpen, ChevronRight } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase'
import { collection, doc } from 'firebase/firestore'
import { cn, getYoutubeThumbnail } from '@/lib/utils'

export default function AdminAcademyPage() {
  const { toast } = useToast()
  const db = useFirestore()
  
  const [isAddingModule, setIsAddingModule] = useState(false)
  const [isAddingLesson, setIsAddingLesson] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  
  const modulesQuery = useMemoFirebase(() => db ? collection(db, 'academy_modules') : null, [db]);
  const { data: modules, isLoading: loadingModules } = useCollection(modulesQuery);

  const lessonsQuery = useMemoFirebase(() => db ? collection(db, 'academy_lessons') : null, [db]);
  const { data: lessons, isLoading: loadingLessons } = useCollection(lessonsQuery);

  const [moduleData, setModuleData] = useState({ title: '', description: '' })
  const [lessonData, setLessonData] = useState({ title: '', description: '', videoUrl: '', moduleId: '' })

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
            <p className="text-slate-500 font-medium">Organiza el conocimiento por módulos y lecciones de alto impacto.</p>
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

        {/* DIALOG: NUEVO MÓDULO */}
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

        {/* DIALOG: NUEVA LECCIÓN */}
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
                    <Button variant="ghost" size="icon" className="text-red-300 hover:text-red-500" onClick={() => handleDeleteModule(mod.id)}><Trash2 className="h-5 w-5" /></Button>
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
