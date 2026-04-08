
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
import { Plus, Trash2, Loader2, Upload, GraduationCap, Video, PlayCircle, FileVideo, CheckCircle2, AlertCircle, Info, RefreshCw } from 'lucide-react'
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

  const handleVideoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStorageError(null);
    setUploadProgress(0);

    if (!file.type.startsWith('video/')) {
      toast({ variant: "destructive", title: "Formato no válido", description: "Selecciona un archivo de video (MP4, MOV, etc)." });
      setUploadProgress(null);
      return;
    }

    try {
      const { storage } = initializeFirebase();
      
      if (!storage || !storage.app.options.storageBucket) {
        setStorageError("Falta configurar el bucket en Firebase. Verifica el archivo config.ts.");
        setUploadProgress(null);
        return;
      }

      const storageRef = ref(storage, `academy/${Date.now()}_${file.name.replace(/\s+/g, '_')}`);
      const uploadTask = uploadBytesResumable(storageRef, file, { 
        contentType: file.type
      });

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        }, 
        (error: any) => {
          console.error("STORAGE ERROR:", error.code, error.message);
          let msg = "Error al subir el video.";
          
          if (error.code === 'storage/unauthorized') {
            msg = "ACCESO DENEGADO: Debes publicar las reglas en tu consola de Firebase.";
          } else if (error.code === 'storage/retry-limit-exceeded') {
            msg = "CONEXIÓN LENTA: Se agotó el tiempo de espera. Intenta con un video más pequeño.";
          } else if (error.code === 'storage/quota-exceeded') {
            msg = "CUOTA EXCEDIDA: Has superado el límite gratuito de Firebase Storage.";
          }
          
          setStorageError(msg);
          setUploadProgress(null);
          toast({ variant: "destructive", title: "Fallo en la subida", description: msg });
        }, 
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setFormData(prev => ({ ...prev, videoUrl: downloadURL }));
          setUploadProgress(null);
          toast({ title: "¡Video Cargado!", description: "El video está listo para ser publicado." });
        }
      );
    } catch (err: any) {
      setStorageError("Error crítico: " + err.message);
      setUploadProgress(null);
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.videoUrl) {
      toast({ variant: "destructive", title: "Faltan datos", description: "Debes poner un título y subir un video." });
      return;
    }

    setIsFinalizing(true);
    try {
      addDocumentNonBlocking(collection(db, 'academy_lessons'), {
        ...formData,
        createdAt: new Date().toISOString(),
        order: (lessons?.length || 0) + 1
      });

      toast({ title: "Lección Publicada", description: "Ya está disponible para los socios." });
      setIsAdding(false);
      setFormData({ title: '', description: '', videoUrl: '', useLocalFile: true });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo guardar la lección." });
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
                <div>
                  <DialogTitle className="text-3xl font-headline font-black">{t.addLesson}</DialogTitle>
                  <DialogDescription className="text-slate-400 font-bold uppercase text-[10px] mt-1">Sube archivos locales o usa links externos</DialogDescription>
                </div>
              </div>
            </div>
            
            <div className="p-10 space-y-8">
              {storageError && (
                <Alert variant="destructive" className="rounded-2xl bg-red-50 border-red-100">
                  <AlertCircle className="h-5 w-5" />
                  <AlertTitle className="font-black uppercase text-xs">Aviso de Configuración</AlertTitle>
                  <AlertDescription className="text-xs font-bold mt-2">
                    {storageError}
                    <div className="mt-4 p-3 bg-white/50 rounded-xl border border-red-200">
                      <p className="text-[10px] uppercase font-black text-red-900">Solución:</p>
                      <p className="text-[10px] mt-1">Ve a tu Consola de Firebase &rarr; Storage &rarr; Rules y publica: <code className="block mt-1 p-2 bg-slate-100 rounded text-[9px]">allow read, write: if true;</code></p>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-500 uppercase ml-1">Título de la Clase</Label>
                <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="h-14 rounded-2xl font-bold" placeholder="Ej: Estrategias de Cierre" />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-500 uppercase ml-1">Descripción</Label>
                <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="rounded-2xl min-h-[100px]" placeholder="¿De qué trata esta lección?" />
              </div>

              <div className="space-y-4">
                <Label className="text-[10px] font-black text-slate-500 uppercase ml-1">Fuente del Video</Label>
                <div className="flex gap-4 p-1.5 bg-slate-100 rounded-2xl border">
                  <Button 
                    variant="ghost" 
                    className={cn("flex-1 h-12 rounded-xl text-[10px] font-black uppercase transition-all", formData.useLocalFile ? "bg-slate-900 text-white shadow-lg" : "text-slate-400")}
                    onClick={() => setFormData({...formData, useLocalFile: true})}
                  >ARCHIVO LOCAL</Button>
                  <Button 
                    variant="ghost" 
                    className={cn("flex-1 h-12 rounded-xl text-[10px] font-black uppercase transition-all", !formData.useLocalFile ? "bg-slate-900 text-white shadow-lg" : "text-slate-400")}
                    onClick={() => setFormData({...formData, useLocalFile: false})}
                  >LINK EXTERNO</Button>
                </div>

                {formData.useLocalFile ? (
                  <div className="space-y-4">
                    <Button 
                      variant="outline" 
                      className={cn(
                        "w-full h-40 border-dashed border-4 rounded-[2.5rem] flex flex-col gap-3 transition-all",
                        formData.videoUrl ? "border-green-200 bg-green-50 text-green-600" : "border-slate-200 text-primary hover:bg-primary/5"
                      )}
                      onClick={() => videoInputRef.current?.click()}
                      disabled={uploadProgress !== null}
                    >
                      {uploadProgress !== null ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="h-10 w-10 animate-spin" />
                          <span className="font-black text-xs uppercase">Subiendo: {Math.round(uploadProgress)}%</span>
                        </div>
                      ) : (formData.videoUrl ? (
                        <div className="flex flex-col items-center gap-2">
                          <CheckCircle2 className="h-10 w-10" />
                          <span className="font-black text-xs uppercase">VIDEO CARGADO ✓</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Upload className="h-10 w-10" />
                          <span className="font-black text-xs uppercase">SELECCIONAR VIDEO</span>
                        </div>
                      ))}
                    </Button>
                    <input type="file" ref={videoInputRef} onChange={handleVideoFileChange} accept="video/*" className="hidden" />
                    
                    {uploadProgress !== null && (
                      <div className="space-y-2">
                        <Progress value={uploadProgress} className="h-2" />
                        <p className="text-[9px] text-center font-bold text-slate-400 uppercase">No cierres esta ventana mientras sube</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black text-slate-400 uppercase ml-1">URL de Video</Label>
                    <Input value={formData.videoUrl} onChange={e => setFormData({...formData, videoUrl: e.target.value})} placeholder="https://..." className="h-14 rounded-2xl" />
                  </div>
                )}
              </div>
            </div>

            <div className="p-10 border-t bg-slate-50 flex gap-4 sticky bottom-0 z-10">
              <Button variant="ghost" onClick={() => setIsAdding(false)} className="flex-1 h-16 rounded-2xl font-black text-slate-400" disabled={uploadProgress !== null || isFinalizing}>CANCELAR</Button>
              <Button 
                className="flex-[2] h-16 rounded-2xl bg-slate-900 text-white font-black shadow-2xl" 
                onClick={handleSave} 
                disabled={uploadProgress !== null || isFinalizing || !formData.videoUrl}
              >
                {isFinalizing ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : "PUBLICAR LECCIÓN"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {isLoading ? (
            <div className="col-span-full flex justify-center py-32"><Loader2 className="animate-spin h-12 w-12 text-primary opacity-50" /></div>
          ) : !lessons || lessons.length === 0 ? (
            <div className="col-span-full text-center py-32 bg-white/50 rounded-[4rem] border-2 border-dashed border-slate-200">
              <GraduationCap className="h-20 w-20 mx-auto mb-4 opacity-10" />
              <p className="font-black uppercase text-xs tracking-widest text-slate-400">La academia está vacía.</p>
            </div>
          ) : (
            lessons.sort((a, b) => (a.order || 0) - (b.order || 0)).map((lesson) => (
              <Card key={lesson.id} className="border-none shadow-xl rounded-[3rem] overflow-hidden bg-white group">
                <div className="aspect-video bg-slate-900 relative flex items-center justify-center">
                  <PlayCircle className="h-12 w-12 text-white/20 group-hover:text-primary transition-all z-10" />
                  <div className="absolute top-4 left-4 bg-primary px-4 py-1.5 rounded-full text-[9px] font-black text-white uppercase shadow-xl z-20">Lección {lesson.order}</div>
                </div>
                <CardContent className="p-8 space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <h3 className="font-black text-lg text-slate-800 uppercase leading-tight">{lesson.title}</h3>
                    <Button variant="ghost" size="icon" className="h-10 w-10 text-red-400 hover:text-red-600" onClick={() => handleDelete(lesson.id)}>
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                  <p className="text-sm font-medium text-slate-500 line-clamp-2 leading-relaxed">{lesson.description}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardShell>
  )
}
