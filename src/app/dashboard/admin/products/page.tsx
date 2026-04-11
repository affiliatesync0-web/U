
"use client"

import { useState, useRef, useEffect } from 'react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { PRODUCT_CATEGORIES, NICA_BANKS } from '@/lib/constants'
import { Plus, Trash2, Search, Loader2, Landmark, Image as ImageIcon, Upload, GraduationCap, Sparkles, Video, PlayCircle, Link as LinkIcon, Edit3, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/components/language-context'
import { generateProductDescription } from '@/ai/flows/generate-product-description-flow'
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, useUser, initializeFirebase, updateDocumentNonBlocking } from '@/firebase'
import { collection, doc } from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { cn } from '@/lib/utils'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface VideoItem {
  id: string;
  title: string;
  url: string;
  type: 'content' | 'training';
  isLocal?: boolean;
}

export default function AdminProductsPage() {
  const { toast } = useToast()
  const { t } = useLanguage()
  const db = useFirestore()
  const { user } = useUser()
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [storageError, setStorageError] = useState<string | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  
  const productsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, 'products');
  }, [db, user]);
  
  const { data: products, isLoading } = useCollection(productsQuery);

  const [formData, setFormData] = useState({
    name: '',
    category: 'Course',
    code: '',
    price: '',
    commission: '',
    bankAccount: '',
    bankType: '',
    bankHolder: '',
    paymentLink: '',
    features: '',
    description: '',
    imageUrl: ''
  })

  const [videos, setVideos] = useState<VideoItem[]>([])
  const [newVideo, setNewVideo] = useState({ title: '', url: '', type: 'content' as 'content' | 'training', useLocalFile: false })

  useEffect(() => {
    if (editingId && products) {
      const p = products.find(p => p.id === editingId);
      if (p) {
        setFormData({
          name: p.name || '',
          category: p.category || 'Course',
          code: p.code || '',
          price: p.price?.toString() || '',
          commission: p.commissionRate?.toString() || '',
          bankAccount: p.bankAccount || '',
          bankType: p.bankType || '',
          bankHolder: p.bankHolder || '',
          paymentLink: p.paymentLink || '',
          features: p.features || '',
          description: p.description || '',
          imageUrl: p.imageUrl || ''
        });
        setVideos(p.videos || []);
        setIsAdding(true);
      }
    }
  }, [editingId, products]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStorageError(null);
    setUploadProgress(0);

    const { storage } = initializeFirebase();
    const storageRef = ref(storage, `product_videos/${Date.now()}_${file.name.replace(/\s+/g, '_')}`);
    const uploadTask = uploadBytesResumable(storageRef, file, { contentType: file.type });

    uploadTask.on('state_changed', 
      (snapshot) => setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100), 
      (error: any) => {
        setStorageError("Fallo al subir video. Revisa permisos.");
        setUploadProgress(null);
      }, 
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        setNewVideo(prev => ({ ...prev, url: downloadURL }));
        setUploadProgress(null);
        toast({ title: "¡Video Cargado!" });
      }
    );
  };

  const handleAddVideo = () => {
    if (!newVideo.title || !newVideo.url) {
      toast({ variant: "destructive", title: "Faltan datos" });
      return;
    }
    setVideos([...videos, { 
      id: Math.random().toString(36).substr(2, 9),
      title: newVideo.title,
      url: newVideo.url,
      type: newVideo.type,
      isLocal: newVideo.useLocalFile
    }]);
    setNewVideo({ title: '', url: '', type: 'content', useLocalFile: false });
  };

  const handleAIHelp = async () => {
    if (!formData.name || !formData.features) {
      toast({ variant: "destructive", title: "Faltan datos base" })
      return
    }
    setGenerating(true)
    try {
      const result = await generateProductDescription({
        productName: formData.name,
        category: formData.category,
        features: formData.features
      })
      setFormData(prev => ({ ...prev, description: result.description }))
    } catch (e) {
      toast({ variant: "destructive", title: "Error IA" })
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = () => {
    if (!formData.name || !formData.price || !formData.commission) {
      toast({ variant: "destructive", title: "Campos Requeridos" });
      return;
    }

    const productData = {
      ...formData,
      price: parseFloat(formData.price),
      commissionRate: parseFloat(formData.commission),
      code: (formData.code || formData.name.substring(0, 3).toUpperCase() + Math.floor(Math.random() * 100)).toUpperCase(),
      videos: videos,
      updatedAt: new Date().toISOString()
    };

    if (editingId) {
      updateDocumentNonBlocking(doc(db, 'products', editingId), productData);
      toast({ title: "Curso Actualizado" });
    } else {
      addDocumentNonBlocking(collection(db, 'products'), { ...productData, createdAt: new Date().toISOString() });
      toast({ title: "Curso Publicado" });
    }
    closeDialog();
  }

  const closeDialog = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({ name: '', category: 'Course', code: '', price: '', commission: '', bankAccount: '', bankType: '', bankHolder: '', paymentLink: '', features: '', description: '', imageUrl: '' });
    setVideos([]);
    setStorageError(null);
  }

  const handleDelete = (id: string) => {
    deleteDocumentNonBlocking(doc(db, 'products', id));
    toast({ title: "Producto eliminado" });
  }

  return (
    <DashboardShell role="admin">
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-3xl font-headline font-black text-slate-900 leading-tight">Gestión de <span className="text-primary">Cursos</span></h1>
            <p className="text-slate-500 text-sm font-medium">Control total sobre tu catálogo digital.</p>
          </div>
          <Button onClick={() => setIsAdding(true)} size="lg" className="h-14 bg-primary rounded-2xl shadow-xl font-black text-xs uppercase tracking-widest w-full">
            <Plus className="mr-2 h-5 w-5" /> NUEVO CURSO
          </Button>
        </div>

        <Dialog open={isAdding} onOpenChange={(open) => !open && closeDialog()}>
          <DialogContent className="max-w-full w-full h-[100dvh] md:max-w-5xl md:h-[90vh] md:rounded-[3rem] p-0 border-none shadow-2xl bg-white overflow-hidden flex flex-col">
            <div className="bg-slate-900 p-6 md:p-10 text-white shrink-0">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary shadow-xl">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-xl md:text-3xl font-headline font-black">{editingId ? 'Editar Curso' : 'Nuevo Curso'}</DialogTitle>
                  <DialogDescription className="text-slate-400 font-bold uppercase text-[8px] md:text-[10px]">Modo App: Sube contenido sin zoom automático</DialogDescription>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 pb-32">
              {storageError && <Alert variant="destructive" className="rounded-2xl"><AlertCircle className="h-4 w-4" /><AlertDescription className="text-xs">{storageError}</AlertDescription></Alert>}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-500 uppercase">Nombre</Label>
                    <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="h-14 text-[16px]" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-slate-500 uppercase">Precio ($)</Label>
                      <Input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="h-14 text-[16px]" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-slate-500 uppercase">Comisión (%)</Label>
                      <Input type="number" value={formData.commission} onChange={e => setFormData({...formData, commission: e.target.value})} className="h-14 text-[16px]" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black text-slate-500 uppercase">Portada</Label>
                    <div className="relative h-44 rounded-2xl bg-slate-50 border-2 border-dashed flex items-center justify-center overflow-hidden">
                      {formData.imageUrl ? <img src={formData.imageUrl} className="h-full w-full object-cover" alt="preview" /> : <ImageIcon className="text-slate-300 h-10 w-10" />}
                      <Button variant="secondary" size="sm" className="absolute bottom-3 right-3 shadow-lg text-[10px] font-black uppercase" onClick={() => fileInputRef.current?.click()}>Cambiar</Button>
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="p-6 bg-slate-50 rounded-3xl border space-y-4">
                    <h3 className="text-[10px] font-black text-primary uppercase flex items-center gap-2"><Video className="h-4 w-4" /> Aula Virtual</h3>
                    <Input value={newVideo.title} onChange={e => setNewVideo({...newVideo, title: e.target.value})} placeholder="Título de la clase..." className="h-12 text-[16px] bg-white" />
                    <div className="flex gap-2">
                      <Button variant="outline" className={cn("flex-1 h-10 text-[9px] font-black rounded-xl", !newVideo.useLocalFile && "bg-slate-900 text-white")} onClick={() => setNewVideo({...newVideo, useLocalFile: false})}>LINK</Button>
                      <Button variant="outline" className={cn("flex-1 h-10 text-[9px] font-black rounded-xl", newVideo.useLocalFile && "bg-slate-900 text-white")} onClick={() => setNewVideo({...newVideo, useLocalFile: true})}>SUBIR MP4</Button>
                    </div>
                    {newVideo.useLocalFile ? (
                      <div className="space-y-2">
                        <Button variant="outline" className="w-full h-14 border-dashed border-2 bg-white" onClick={() => videoInputRef.current?.click()} disabled={uploadProgress !== null}>
                          {uploadProgress !== null ? <Loader2 className="animate-spin h-4 w-4" /> : <Upload className="h-4 w-4 mr-2" />}
                          <span className="text-[10px] font-black">{newVideo.url ? "VIDEO CARGADO ✓" : "SELECCIONAR"}</span>
                        </Button>
                        <input type="file" ref={videoInputRef} onChange={handleVideoFileChange} accept="video/*" className="hidden" />
                        {uploadProgress !== null && <Progress value={uploadProgress} className="h-1" />}
                      </div>
                    ) : (
                      <Input value={newVideo.url} onChange={e => setNewVideo({...newVideo, url: e.target.value})} placeholder="URL (YouTube/Drive)..." className="h-12 text-[16px] bg-white" />
                    )}
                    <Button onClick={handleAddVideo} className="w-full h-12 bg-primary text-white font-black text-[10px] uppercase shadow-lg">AÑADIR CLASE</Button>
                  </div>

                  <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                    {videos.map((v) => (
                      <div key={v.id} className="flex items-center justify-between p-4 bg-white border rounded-2xl shadow-sm">
                        <div className="flex items-center gap-3 min-w-0">
                          <PlayCircle className={cn("h-4 w-4 shrink-0", v.type === 'content' ? 'text-blue-500' : 'text-primary')} />
                          <span className="text-[10px] font-black text-slate-800 uppercase truncate">{v.title}</span>
                        </div>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400" onClick={() => setVideos(videos.filter(vi => vi.id !== v.id))}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6">
                <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10 space-y-4">
                  <h3 className="text-[10px] font-black text-primary uppercase flex items-center gap-2"><Landmark className="h-4 w-4" /> Cobros</h3>
                  <Input value={formData.bankAccount} onChange={e => setFormData({...formData, bankAccount: e.target.value})} placeholder="Número de cuenta" className="h-12 bg-white text-[16px]" />
                  <Select onValueChange={v => setFormData({...formData, bankType: v})} value={formData.bankType}>
                    <SelectTrigger className="h-12 bg-white text-[16px]"><SelectValue placeholder="Banco" /></SelectTrigger>
                    <SelectContent>{NICA_BANKS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input value={formData.bankHolder} onChange={e => setFormData({...formData, bankHolder: e.target.value})} placeholder="Titular" className="h-12 bg-white text-[16px]" />
                </div>
                
                <div className="p-6 bg-slate-900 rounded-3xl text-white space-y-4">
                  <h3 className="text-[10px] font-black text-primary uppercase flex items-center gap-2"><Sparkles className="h-4 w-4" /> Redacción IA</h3>
                  <Input value={formData.features} onChange={e => setFormData({...formData, features: e.target.value})} placeholder="Ventajas clave (comas)..." className="bg-white/5 border-none h-12 text-[16px]" />
                  <Button onClick={handleAIHelp} variant="outline" className="w-full h-14 border-primary text-primary font-black text-[10px] uppercase" disabled={generating}>{generating ? "GENERANDO..." : "CREAR DESCRIPCIÓN PRO"}</Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-400 uppercase">Descripción / Copy Final</Label>
                <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="min-h-[150px] rounded-3xl text-[16px]" />
              </div>
            </div>

            <div className="p-6 md:p-10 border-t bg-slate-50 flex gap-4 absolute bottom-0 left-0 right-0 z-20">
              <Button variant="ghost" onClick={closeDialog} className="flex-1 h-16 rounded-2xl font-black text-xs uppercase text-slate-400">SALIR</Button>
              <Button className="flex-[2] h-16 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase shadow-2xl" onClick={handleSave}>
                {editingId ? 'GUARDAR CAMBIOS' : 'PUBLICAR CURSO'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Card className="border-none shadow-2xl rounded-[2rem] overflow-hidden bg-white ring-1 ring-slate-100">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center py-32"><Loader2 className="animate-spin h-10 w-10 text-primary opacity-50" /></div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow className="bg-slate-50/50 h-16"><TableHead className="px-6 font-black uppercase text-[9px] text-slate-400">Curso</TableHead><TableHead className="font-black uppercase text-[9px] text-slate-400">Precio</TableHead><TableHead className="px-6 text-right font-black uppercase text-[9px] text-slate-400">Acciones</TableHead></TableRow></TableHeader>
                  <TableBody>{products?.map((p) => (
                    <TableRow key={p.id} className="h-20 border-b last:border-0 hover:bg-slate-50/30">
                      <TableCell className="px-6"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-slate-100 overflow-hidden shrink-0">{p.imageUrl ? <img src={p.imageUrl} className="h-full w-full object-cover" alt="thumb" /> : <GraduationCap className="h-5 w-5 text-slate-300 m-auto mt-2.5" />}</div><div className="min-w-0"><p className="font-black text-slate-800 uppercase tracking-tight text-xs truncate max-w-[150px]">{p.name}</p><p className="text-[8px] font-bold text-slate-400">ID: {p.code}</p></div></div></TableCell>
                      <TableCell className="font-black text-sm text-slate-900">${p.price?.toFixed(2)}</TableCell>
                      <TableCell className="px-6 text-right"><div className="flex justify-end gap-2"><Button variant="ghost" size="icon" className="h-10 w-10 text-blue-500 bg-blue-50 rounded-xl" onClick={() => setEditingId(p.id)}><Edit3 className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="h-10 w-10 text-destructive bg-red-50 rounded-xl" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4" /></Button></div></TableCell>
                    </TableRow>
                  ))}</TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}
