
"use client"

import { useState } from 'react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Smartphone, 
  AppWindow, 
  Monitor, 
  Upload, 
  Trash2, 
  Loader2, 
  ShieldCheck, 
  Save, 
  Zap,
  Globe,
  FileCode,
  CheckCircle2
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase'
import { collection, doc } from 'firebase/firestore'

export default function AdminReleasesPage() {
  const { toast } = useToast()
  const db = useFirestore()
  const [loading, setLoading] = useState(false)

  const releasesQuery = useMemoFirebase(() => collection(db, 'app_releases'), [db]);
  const { data: releases, isLoading } = useCollection(releasesQuery);

  const [formData, setFormData] = useState({
    version: '1.0.0',
    type: 'apk',
    downloadUrl: '',
    notes: 'Nueva versión oficial optimizada.'
  })

  const handleSave = () => {
    if (!formData.version || !formData.downloadUrl) {
      toast({ variant: "destructive", title: "Faltan datos", description: "Versión y URL son obligatorios." });
      return;
    }

    setLoading(true);
    addDocumentNonBlocking(collection(db, 'app_releases'), {
      ...formData,
      createdAt: new Date().toISOString()
    });

    setTimeout(() => {
      setLoading(false);
      toast({ title: "Versión Publicada", description: "Los afiliados ya pueden ver el nuevo paquete." });
    }, 1000);
  }

  const handleDelete = (id: string) => {
    deleteDocumentNonBlocking(doc(db, 'app_releases', id));
    toast({ title: "Versión eliminada" });
  }

  return (
    <DashboardShell role="admin">
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-headline font-black text-slate-900 tracking-tight uppercase italic">Build <span className="text-primary">Center</span></h1>
            <p className="text-slate-500 font-medium">Gestiona los archivos .EXE, .APK y .AAB de la plataforma.</p>
          </div>
          <div className="px-6 py-3 bg-slate-900 rounded-2xl flex items-center gap-3 text-white shadow-xl">
             <Terminal className="h-5 w-5 text-primary" />
             <span className="text-[10px] font-black uppercase tracking-widest">Sincronización de Binarios</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
           <Card className="lg:col-span-5 border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden ring-1 ring-slate-100">
             <CardHeader className="bg-slate-50/50 p-10 border-b">
                <CardTitle className="text-xl font-headline font-black uppercase flex items-center gap-3">
                  <Upload className="h-5 w-5 text-primary" /> Nueva Publicación
                </CardTitle>
             </CardHeader>
             <CardContent className="p-10 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Versión</Label>
                    <Input value={formData.version} onChange={e => setFormData({...formData, version: e.target.value})} className="h-12 rounded-xl font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Tipo de Archivo</Label>
                    <select 
                      value={formData.type} 
                      onChange={e => setFormData({...formData, type: e.target.value})}
                      className="w-full h-12 rounded-xl border border-slate-200 px-4 font-bold text-sm bg-slate-50"
                    >
                      <option value="apk">Android (.APK)</option>
                      <option value="aab">Android Bundle (.AAB)</option>
                      <option value="exe">Windows (.EXE)</option>
                      <option value="dmg">macOS (.DMG)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">URL de Descarga (Drive/Dropbox/Storage)</Label>
                  <Input value={formData.downloadUrl} onChange={e => setFormData({...formData, downloadUrl: e.target.value})} placeholder="https://..." className="h-12 rounded-xl" />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Notas de la Versión</Label>
                  <Input value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="h-12 rounded-xl" />
                </div>

                <Button onClick={handleSave} className="w-full h-16 rounded-2xl bg-slate-900 text-white font-black uppercase text-xs shadow-2xl transition-all active:scale-95" disabled={loading}>
                   {loading ? <Loader2 className="animate-spin" /> : "PUBLICAR ARCHIVO"}
                </Button>
             </CardContent>
           </Card>

           <div className="lg:col-span-7 space-y-6">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> Versiones en Línea
              </h3>

              {isLoading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary opacity-20" /></div>
              ) : !releases || releases.length === 0 ? (
                <div className="text-center py-32 bg-white/50 rounded-[4rem] border-2 border-dashed border-slate-200 opacity-20">
                   <Smartphone className="h-20 w-20 mx-auto mb-4" />
                   <p className="text-sm font-black uppercase">Sin paquetes publicados</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {releases.map((rel) => (
                    <Card key={rel.id} className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden group hover:ring-2 hover:ring-primary/20 transition-all">
                      <div className="p-8 flex items-center justify-between">
                        <div className="flex items-center gap-6">
                          <div className="h-14 w-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary shadow-inner">
                            {rel.type === 'exe' || rel.type === 'dmg' ? <Monitor className="h-6 w-6" /> : <Smartphone className="h-6 w-6" />}
                          </div>
                          <div>
                            <h4 className="font-black text-slate-900 uppercase tracking-tight">Sync Connect v{rel.version}</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{rel.type.toUpperCase()} • {new Date(rel.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-12 w-12 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-2xl" onClick={() => handleDelete(rel.id)}>
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
           </div>
        </div>
      </div>
    </DashboardShell>
  )
}
