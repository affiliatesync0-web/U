
"use client"

import { useState, useRef } from 'react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Plus, Trash2, Loader2, Upload, GraduationCap, Video, PlayCircle, FileVideo, Edit3, ArrowRight } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/components/language-context'
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, initializeFirebase } from '@/firebase'
import { collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { cn } from '@/lib/utils'

export default function AdminAcademyPage() {
  const { toast } = useToast()
  const { t } = useLanguage()
  const db = useFirestore()
  
  const [isAdding, setIsAdding] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  
  const academyQuery = useMemoFirebase(() => collection(db, 'academy_lessons'), [db]);
  const { data: lessons, isLoading } = useCollection(academyQuery);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    videoUrl: '',
    useLocalFile: true
  })

  const handleVideoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024 * 1024) {
      toast({ variant: "destructive", title: "Archivo demasiado grande", description: "Máximo 500MB." });
      return;
    }

    const { storage } = initializeFirebase();
    const storageRef = ref(storage, `academy/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed', 
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      }, 
      (error) => {
        toast({ variant: "destructive", title: "Error de subida", description: "No se pudo cargar el video." });
        setUploadProgress(null);
      }, 
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        setFormData(prev => ({ ...prev, videoUrl: downloadURL }));
        setUploadProgress(null);
        toast({ title: "¡Video Cargado!", description: "El archivo está listo para ser guardado." });
      }
    );
  };

  const handleSave = async () => {
    if (!formData.title || !formData.videoUrl) {
      toast({ variant: "destructive", title: "Datos incompletos", description: "Asigna un título y sube un video." });
      return;
    }

    try {
      addDocumentNonBlocking(collection(db, 'academy_lessons'), {
        ...formData,
        createdAt: new Date().toISOString(),
        order: (lessons?.length || 0) + 1
      });

      toast({ title: "Lección Publicada", description: "Ya está disponible en la Academia para los afiliados." });
      setIsAdding(false);
      setFormData({ title: '', description: '', videoUrl: '', useLocalFile: true });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo guardar la lección." });
    }
  }

  const handleDelete = (id: string) => {
    deleteDocumentNonBlocking(doc(db, 'academy_lessons', id));
    toast({ title: "Lección eliminada" });
  }

  return (
    <DashboardShell role="admin">
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-headline font-black text-slate-900 tracking-tight">Sync <span className="text-primary">Academy</span> Manager</h1>
            <p className="text-slate-500 font-medium">Sube videos educativos sobre Marketing Digital para tus afiliados.</p>
          </div>
          
          <Button onClick={() => setIsAdding(true)} size="lg" className="h-16 px-8 bg-primary rounded-2xl shadow-xl hover:scale-105 transition-all font-black text-xs uppercase tracking-widest">
            <Plus className="mr-2 h-5 w-5" /> {t.addLesson.toUpperCase()}
          </Button>
        </div>

        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogContent className="max-w-2xl rounded-[3rem] p-0 border-none shadow-2xl overflow-hidden">
            <div className="bg-slate-900 p-10 text-white">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary shadow-xl">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <div>
                  <DialogTitle className="text-3xl font-headline font-black">{t.addLesson}</DialogTitle>
                  <DialogDescription className="text-slate-400 font-bold uppercase text-[10px] mt-1">Sube contenido educativo para tus socios</DialogDescription>
                </div>
              </div>
            </div>
            
            <div className="p-10 space-y-8 bg-white">
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-500 uppercase">{t.lessonTitle}</Label>
                <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="h-14 rounded-2xl" placeholder="Ej: Fundamentos del Marketing de Afiliados" />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-500 uppercase">{t.lessonDesc}</Label>
                <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="rounded-2xl min-h-[100px]" placeholder="Breve resumen de lo que aprenderán en este video..." />
              </div>

              <div className="space-y-4">
                <Label className="text-[10px] font-black text-slate-500 uppercase">{t.uploadVideo}</Label>
                <div className="flex gap-4 p-1 bg-slate-50 rounded-2xl border">
                  <Button 
                    variant="ghost" 
                    className={cn("flex-1 h-12 rounded-xl text-[10px] font-black uppercase transition-all", formData.useLocalFile ? "bg-slate-900 text-white" : "text-slate-400")}
                    onClick={() => setFormData({...formData, useLocalFile: true})}
                  >Subir Archivo</Button>
                  <Button 
                    variant="ghost" 
                    className={cn("flex-1 h-12 rounded-xl text-[10px] font-black uppercase transition-all", !formData.useLocalFile ? "bg-slate-900 text-white" : "text-slate-400")}
                    onClick={() => setFormData({...formData, useLocalFile: false})}
                  >Pegar Enlace</Button>
                </div>

                {formData.useLocalFile ? (
                  <div className="space-y-4">
                    <Button 
                      variant="outline" 
                      className="w-full h-24 border-dashed border-4 rounded-3xl flex flex-col gap-2 text-primary hover:bg-primary/5 transition-all"
                      onClick={() => videoInputRef.current?.click()}
                      disabled={uploadProgress !== null}
                    >
                      {uploadProgress !== null ? <Loader2 className="h-8 w-8 animate-spin" /> : <Upload className="h-8 w-8" />}
                      <span className="font-black text-[10px] uppercase tracking-widest">{formData.videoUrl ? "VIDEO LISTO ✓" : "SELECCIONAR VIDEO DE MI PC"}</span>
                    </Button>
                    <input type="file" ref={videoInputRef} onChange={handleVideoFileChange} accept="video/*" className="hidden" />
                    {uploadProgress !== null && (
                      <div className="space-y-2">
                        <Progress value={uploadProgress} className="h-2" />
                        <p className="text-[10px] font-black text-primary text-center uppercase animate-pulse">CARGANDO AL SERVIDOR: {Math.round(uploadProgress)}%</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Input value={formData.videoUrl} onChange={e => setFormData({...formData, videoUrl: e.target.value})} placeholder="https://youtube.com/..." className="h-14 rounded-2xl" />
                  </div>
                )}
              </div>
            </div>

            <div className="p-10 border-t bg-slate-50 flex gap-4">
              <Button variant="ghost" onClick={() => setIsAdding(false)} className="flex-1 h-16 rounded-2xl font-black text-slate-400">CANCELAR</Button>
              <Button className="flex-[2] h-16 rounded-2xl bg-slate-900 text-white font-black shadow-xl" onClick={handleSave} disabled={uploadProgress !== null}>
                PUBLICAR EN LA ACADEMIA
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {isLoading ? (
            <div className="col-span-full flex justify-center py-32"><Loader2 className="animate-spin h-12 w-12 text-primary opacity-50" /></div>
          ) : !lessons || lessons.length === 0 ? (
            <div className="col-span-full text-center py-32 text-slate-400">
              <GraduationCap className="h-20 w-20 mx-auto mb-4 opacity-10" />
              <p className="font-black uppercase text-xs tracking-widest">No has subido ninguna lección todavía.</p>
            </div>
          ) : (
            lessons.sort((a, b) => (a.order || 0) - (b.order || 0)).map((lesson) => (
              <Card key={lesson.id} className="border-none shadow-xl rounded-[3rem] overflow-hidden bg-white ring-1 ring-slate-100 group">
                <div className="aspect-video bg-slate-900 relative flex items-center justify-center">
                  <PlayCircle className="h-12 w-12 text-primary opacity-50 group-hover:scale-110 group-hover:opacity-100 transition-all" />
                  <div className="absolute top-4 left-4 bg-primary px-4 py-1.5 rounded-full text-[9px] font-black text-white uppercase shadow-xl">Lección {lesson.order}</div>
                </div>
                <CardContent className="p-8 space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <h3 className="font-black text-lg text-slate-800 uppercase leading-tight line-clamp-2">{lesson.title}</h3>
                    <Button variant="ghost" size="icon" className="h-10 w-10 text-red-400 hover:text-red-600 hover:bg-red-50 shrink-0" onClick={() => handleDelete(lesson.id)}>
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                  <p className="text-sm font-medium text-slate-500 line-clamp-3">{lesson.description}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardShell>
  )
}
