
"use client"

import { useState } from 'react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Trash2, Loader2, PlayCircle, Video, Save, X, Image as ImageIcon } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase'
import { collection, doc } from 'firebase/firestore'
import { cn } from '@/lib/utils'

export default function AdminAcademyPage() {
  const { toast } = useToast()
  const db = useFirestore()
  
  const [isAdding, setIsAdding] = useState(false)
  const [isFinalizing, setIsFinalizing] = useState(false)
  
  const academyQuery = useMemoFirebase(() => db ? collection(db, 'academy_lessons') : null, [db]);
  const { data: lessons, isLoading } = useCollection(academyQuery);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    videoUrl: ''
  })

  const getYoutubeThumbnail = (url: string) => {
    const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://img.youtube.com/vi/${match[2]}/mqdefault.jpg`;
    }
    return null;
  };

  const handleSave = async () => {
    if (!formData.title || !formData.videoUrl || !db) {
      toast({ variant: "destructive", title: "Faltan datos", description: "El título y el link del video son obligatorios." });
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
      setFormData({ title: '', description: '', videoUrl: '' });
      toast({ title: "Clase Publicada", description: "El contenido ya está disponible para los socios." });
    } catch (e) {
      toast({ variant: "destructive", title: "Error al guardar" });
    } finally {
      setIsFinalizing(false);
    }
  }

  const handleDelete = (id: string) => {
    if(confirm("¿Seguro que quieres eliminar esta lección permanentemente?") && db) {
      deleteDocumentNonBlocking(doc(db, 'academy_lessons', id));
      toast({ title: "Lección eliminada" });
    }
  }

  return (
    <DashboardShell role="admin">
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-headline font-black text-slate-900 tracking-tight uppercase italic">Sync <span className="text-primary">Academy</span></h1>
            <p className="text-slate-500 font-medium">Control maestro de la formación oficial para afiliados.</p>
          </div>
          
          <Button onClick={() => setIsAdding(true)} className="h-14 px-8 bg-slate-950 hover:bg-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest gap-2 shadow-2xl">
            <Plus className="h-5 w-5" /> AGREGAR NUEVA CLASE
          </Button>
        </div>

        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogContent className="max-w-lg rounded-2xl p-0 border-none shadow-2xl bg-white overflow-hidden">
            <div className="bg-slate-950 p-8 text-white flex justify-between items-center">
              <DialogTitle className="text-xl font-headline font-black uppercase tracking-tight italic">Nueva Lección</DialogTitle>
              <Button variant="ghost" size="icon" onClick={() => setIsAdding(false)} className="text-white/40 hover:text-white"><X className="h-5 w-5" /></Button>
            </div>
            
            <div className="p-10 space-y-8">
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Título de la Clase</Label>
                <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="h-14 rounded-xl font-bold bg-slate-50 border-none ring-1 ring-slate-100" placeholder="Ej: Introducción al Marketing Digital" />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descripción / Temario</Label>
                <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="rounded-xl bg-slate-50 border-none ring-1 ring-slate-100 min-h-[120px] p-4 text-sm font-medium" placeholder="Escribe los puntos clave de esta sesión..." />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">URL del Video (YouTube)</Label>
                <div className="relative">
                  <Video className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input value={formData.videoUrl} onChange={e => setFormData({...formData, videoUrl: e.target.value})} placeholder="https://youtube.com/watch?v=..." className="h-14 pl-12 rounded-xl bg-slate-50 border-none ring-1 ring-slate-100 font-mono text-xs" />
                </div>
              </div>

              <Button className="w-full h-16 rounded-xl bg-slate-950 text-white font-black text-xs uppercase tracking-widest gap-2 shadow-2xl active:scale-95 transition-all" onClick={handleSave} disabled={isFinalizing}>
                {isFinalizing ? <Loader2 className="h-6 w-6 animate-spin" /> : <><Save className="h-5 w-5" /> PUBLICAR CLASE AHORA</>}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {isLoading ? (
            <div className="col-span-full flex justify-center py-40"><Loader2 className="animate-spin text-slate-300 h-10 w-10" /></div>
          ) : !lessons || lessons.length === 0 ? (
            <Card className="col-span-full p-40 text-center border-dashed border-2 border-slate-200 bg-white rounded-3xl">
               <Video className="h-16 w-16 text-slate-200 mx-auto mb-6" />
               <p className="text-xs font-black text-slate-400 uppercase tracking-[0.4em]">Sin contenido en la academia</p>
            </Card>
          ) : (
            lessons.sort((a, b) => (a.order || 0) - (b.order || 0)).map((lesson) => {
              const thumbnail = getYoutubeThumbnail(lesson.videoUrl);
              return (
                <Card key={lesson.id} className="border-none shadow-xl hover:shadow-2xl transition-all duration-500 rounded-3xl overflow-hidden bg-white group ring-1 ring-slate-100">
                  <div className="aspect-video bg-slate-100 relative overflow-hidden flex items-center justify-center">
                    {thumbnail ? (
                      <img src={thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                    ) : (
                      <div className="text-center space-y-2">
                        <ImageIcon className="h-10 w-10 text-slate-200 mx-auto" />
                        <p className="text-[8px] font-black uppercase text-slate-400">Sin vista previa</p>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <PlayCircle className="h-14 w-14 text-white" />
                    </div>
                    <div className="absolute top-4 left-4 bg-slate-900/90 text-white text-[8px] font-black uppercase px-3 py-1 rounded-full backdrop-blur-md">
                      MÓDULO {lesson.order}
                    </div>
                  </div>
                  <CardContent className="p-8 flex justify-between items-start gap-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-black text-sm text-slate-900 uppercase tracking-tight truncate mb-1">{lesson.title}</h3>
                      <p className="text-[10px] font-medium text-slate-400 line-clamp-2 leading-relaxed">{lesson.description || 'Sin descripción detallada'}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 shrink-0" onClick={() => handleDelete(lesson.id)}>
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </DashboardShell>
  )
}
