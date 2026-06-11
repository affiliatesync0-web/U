
"use client"

import { useState } from 'react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Trash2, Loader2, PlayCircle, Video, Save, X } from 'lucide-react'
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
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-headline font-black text-slate-900 tracking-tight uppercase">Sync <span className="text-slate-500">Academy</span></h1>
            <p className="text-slate-500 text-sm font-medium mt-1">Gestiona los cursos de Marketing Digital para tus afiliados.</p>
          </div>
          
          <Button onClick={() => setIsAdding(true)} className="h-12 px-6 bg-slate-900 hover:bg-slate-800 rounded-lg font-black text-[10px] uppercase tracking-widest gap-2">
            <Plus className="h-4 w-4" /> AGREGAR CLASE
          </Button>
        </div>

        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogContent className="max-w-lg rounded-xl p-0 border-none shadow-2xl bg-white overflow-hidden">
            <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
              <DialogTitle className="text-lg font-headline font-black uppercase tracking-tight">Nueva Lección</DialogTitle>
              <Button variant="ghost" size="icon" onClick={() => setIsAdding(false)} className="text-white/40 hover:text-white"><X className="h-5 w-5" /></Button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-400 uppercase">Título de la Clase</Label>
                <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="h-12 rounded-lg font-bold bg-slate-50 border-slate-200" placeholder="Ej: Introducción al Marketing Digital" />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-400 uppercase">Descripción / Temario</Label>
                <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="rounded-lg bg-slate-50 border-slate-200 min-h-[100px]" placeholder="¿Qué aprenderán en esta sesión?" />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-400 uppercase">URL del Video (YouTube / Vimeo / Directo)</Label>
                <div className="relative">
                  <Video className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input value={formData.videoUrl} onChange={e => setFormData({...formData, videoUrl: e.target.value})} placeholder="https://..." className="h-12 pl-10 rounded-lg bg-slate-50 border-slate-200" />
                </div>
              </div>

              <Button className="w-full h-14 rounded-lg bg-slate-900 text-white font-black text-xs uppercase tracking-widest gap-2 shadow-xl" onClick={handleSave} disabled={isFinalizing}>
                {isFinalizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> PUBLICAR CLASE</>}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full flex justify-center py-20"><Loader2 className="animate-spin text-slate-300" /></div>
          ) : !lessons || lessons.length === 0 ? (
            <Card className="col-span-full p-20 text-center border-dashed border-2 border-slate-200 bg-white rounded-xl">
               <Video className="h-12 w-12 text-slate-200 mx-auto mb-4" />
               <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Sin contenido en la academia</p>
            </Card>
          ) : (
            lessons.sort((a, b) => (a.order || 0) - (b.order || 0)).map((lesson) => (
              <Card key={lesson.id} className="border-none shadow-sm hover:shadow-md transition-all rounded-xl overflow-hidden bg-white group">
                <div className="aspect-video bg-slate-100 relative flex items-center justify-center">
                  <PlayCircle className="h-10 w-10 text-slate-300 group-hover:text-slate-900 transition-colors" />
                </div>
                <CardContent className="p-6 flex justify-between items-start gap-4">
                  <div className="min-w-0">
                    <h3 className="font-black text-sm text-slate-800 uppercase truncate">{lesson.title}</h3>
                    <p className="text-[10px] font-medium text-slate-400 mt-1 line-clamp-1">{lesson.description || 'Sin descripción'}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-red-500 shrink-0" onClick={() => handleDelete(lesson.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardShell>
  )
}
