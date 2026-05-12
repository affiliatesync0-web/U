"use client"

import { useState, useRef } from 'react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Plus, Trash2, Loader2, Upload, GraduationCap, PlayCircle, CheckCircle2, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/components/language-context'
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, initializeFirebase } from '@/firebase'
import { collection, doc } from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { cn } from '@/lib/utils'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function AdminAcademyPage() {
  const { toast } = useToast()
  const { t } = useLanguage()
  const db = useFirestore()
  
  const [isAdding, setIsAdding] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [isFinalizing, setIsFinalizing] = useState(false)
  const [storageError, setStorageError] = useState<string | null>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  
  const academyQuery = useMemoFirebase(() => collection(db, 'academy_lessons'), [db]);
  const { data: lessons, isLoading } = useCollection(academyQuery);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    videoUrl: '',
    useLocalFile: true
  })

  const handleVideoFileChange = async (videoFile: File) => {
    if (!videoFile) return;
    setStorageError(null);
    setUploadProgress(0);

    if (!videoFile.type.startsWith('video/')) {
      toast({ variant: "destructive", title: "Formato no válido", description: "Selecciona un archivo de video." });
      setUploadProgress(null);
      return;
    }

    try {
      const { storage } = initializeFirebase();
      const storageRef = ref(storage, `academy/${Date.now()}_${videoFile.name.replace(/\s+/g, '_')}`);
      const uploadTask = uploadBytesResumable(storageRef, videoFile);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        }, 
        (error) => {
          setStorageError("Fallo al subir video. Verifica las reglas de Storage.");
          setUploadProgress(null);
        }, 
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setFormData(prev => ({ ...prev, videoUrl: downloadURL }));
          setUploadProgress(null);
          toast({ title: "¡Video Cargado!" });
        }
      );
    } catch (err) {
      setStorageError("Error de inicialización de Storage");
      setUploadProgress(null);
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.videoUrl) {
      toast({ variant: "destructive", title: "Faltan datos" });
      return;
    }

    setIsFinalizing(true);
    try {
      addDocumentNonBlocking(collection(db, 'academy_lessons'), {
        ...formData,
        createdAt: new Date().toISOString(),
        order: (lessons?.length || 0) + 1
      });
      setIsAdding(false);
      setFormData({ title: '', description: '', videoUrl: '', useLocalFile: true });
      toast({ title: "Lección Publicada" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error al guardar" });
    } finally {
      setIsFinalizing(false);
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
            <p className="text-slate-500 font-medium">Gestiona tus entrenamientos exclusivos.</p>
          </div>
          
          <Button onClick={() => setIsAdding(true)} size="lg" className="h-16 px-8 bg-primary rounded-2xl shadow-xl hover:scale-105 transition-all font-black text-xs uppercase tracking-widest">
            <Plus className="mr-2 h-5 w-5" /> {t.addLesson.toUpperCase()}
          </Button>
        </div>

        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-[3.5rem] p-0 border-none shadow-2xl bg-white">
            <div className="bg-slate-900 p-10 text-white sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary shadow-xl">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <DialogTitle className="text-3xl font-headline font-black">{t.addLesson}</DialogTitle>
              </div>
            </div>
            
            <div className="p-10 space-y-8">
              {storageError && (
                <Alert variant="destructive" className="rounded-2xl">
                  <AlertCircle className="h-5 w-5" />
                  <AlertTitle className="font-black uppercase text-xs">Aviso de Configuración</AlertTitle>
                  <AlertDescription className="text-xs font-bold mt-2">{storageError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-500 uppercase ml-1">Título de la Clase</Label>
                <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="h-14 rounded-2xl font-bold" />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-500 uppercase ml-1">Descripción</Label>
                <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="rounded-2xl min-h-[100px]" />
              </div>

              <div className="space-y-4">
                <div className="flex gap-4 p-1.5 bg-slate-100 rounded-2xl border">
                  <button className={cn("flex-1 h-10 rounded-xl text-[10px] font-black transition-all", formData.useLocalFile ? "bg-slate-900 text-white" : "text-slate-400")} onClick={() => setFormData({...formData, useLocalFile: true})}>ARCHIVO LOCAL</button>
                  <button className={cn("flex-1 h-10 rounded-xl text-[10px] font-black transition-all", !formData.useLocalFile ? "bg-slate-900 text-white" : "text-slate-400")} onClick={() => setFormData({...formData, useLocalFile: false})}>LINK EXTERNO</button>
                </div>

                {formData.useLocalFile ? (
                  <div className="space-y-4">
                    <button className="w-full h-40 border-dashed border-4 rounded-[2.5rem] flex items-center justify-center hover:bg-slate-50 transition-all" onClick={() => videoInputRef.current?.click()} disabled={uploadProgress !== null}>
                      {uploadProgress !== null ? <Loader2 className="animate-spin text-primary" /> : (formData.videoUrl ? <CheckCircle2 className="text-green-500 h-10 w-10" /> : <Upload className="text-slate-300 h-10 w-10" />)}
                    </button>
                    <input type="file" ref={videoInputRef} onChange={(e) => e.target.files && handleVideoFileChange(e.target.files[0])} accept="video/*" className="hidden" />
                    {uploadProgress !== null && <Progress value={uploadProgress} className="h-2" />}
                  </div>
                ) : (
                  <Input value={formData.videoUrl} onChange={e => setFormData({...formData, videoUrl: e.target.value})} placeholder="URL de Video..." className="h-14 rounded-2xl" />
                )}
              </div>
            </div>

            <div className="p-10 border-t bg-slate-50 flex gap-4 sticky bottom-0 z-10">
              <Button variant="ghost" onClick={() => setIsAdding(false)} className="flex-1 h-16 rounded-2xl font-black">CANCELAR</Button>
              <Button className="flex-[2] h-16 rounded-2xl bg-slate-900 text-white font-black" onClick={handleSave} disabled={uploadProgress !== null || isFinalizing || !formData.videoUrl}>
                {isFinalizing ? <Loader2 className="animate-spin" /> : "PUBLICAR LECCIÓN"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {isLoading ? (
            <div className="col-span-full flex justify-center py-32"><Loader2 className="animate-spin text-primary opacity-50" /></div>
          ) : (
            lessons?.sort((a, b) => (a.order || 0) - (b.order || 0)).map((lesson) => (
              <Card key={lesson.id} className="border-none shadow-xl rounded-[3rem] overflow-hidden bg-white group">
                <div className="aspect-video bg-slate-900 relative flex items-center justify-center">
                  <PlayCircle className="h-12 w-12 text-white/20 group-hover:text-primary transition-all" />
                </div>
                <CardContent className="p-8 space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <h3 className="font-black text-lg text-slate-800 uppercase leading-tight">{lesson.title}</h3>
                    <Button variant="ghost" size="icon" className="h-10 w-10 text-red-400 hover:text-red-600" onClick={() => handleDelete(lesson.id)}>
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardShell>
  )
}
