"use client"

import { useState, useRef, useEffect } from 'react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { PRODUCT_CATEGORIES, NICA_BANKS } from '@/lib/constants'
import { Plus, Trash2, Wand2, Search, Loader2, Landmark, Image as ImageIcon, Upload, GraduationCap, Sparkles, Video, PlayCircle, Target, Users, FileVideo, Edit3, AlertCircle, Link as LinkIcon, ChevronRight } from 'lucide-react'
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
    if (!storage || !storage.app.options.storageBucket) {
      setStorageError("Falta configurar Storage en Firebase.");
      setUploadProgress(null);
      return;
    }

    const storageRef = ref(storage, `product_videos/${Date.now()}_${file.name.replace(/\s+/g, '_')}`);
    const uploadTask = uploadBytesResumable(storageRef, file, { contentType: file.type });

    uploadTask.on('state_changed', 
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      }, 
      (error: any) => {
        let msg = "Error al subir video.";
        if (error.code === 'storage/unauthorized') msg = "Acceso denegado. Revisa las reglas de Storage.";
        setStorageError(msg);
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
      toast({ variant: "destructive", title: "Faltan datos", description: "Título y video requeridos." });
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
      toast({ variant: "destructive", title: "Falta info", description: "Escribe el nombre y ventajas primero." })
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
      toast({ variant: "destructive", title: "Error IA", description: "No disponible ahora." })
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = () => {
    if (!db) return;
    if (!formData.name || !formData.price || !formData.commission) {
      toast({ variant: "destructive", title: "Campos Requeridos", description: "Llena los datos básicos." });
      return;
    }

    try {
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
        addDocumentNonBlocking(collection(db, 'products'), {
          ...productData,
          createdAt: new Date().toISOString()
        });
        toast({ title: "Curso Publicado" });
      }
      closeDialog();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
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
      <div className="space-y-6 md:space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-headline font-black text-slate-900 tracking-tight leading-none">Gestión de <span className="text-primary">Cursos</span></h1>
            <p className="text-sm md:text-base text-slate-500 font-medium">Configura lecciones y material estratégico.</p>
          </div>
          
          <Button onClick={() => setIsAdding(true)} size="lg" className="h-14 md:h-16 px-8 bg-primary rounded-2xl shadow-xl font-black text-xs uppercase tracking-widest w-full md:w-auto">
            <Plus className="mr-2 h-5 w-5" /> NUEVO CURSO
          </Button>
        </div>

        <Dialog open={isAdding} onOpenChange={(open) => !open && closeDialog()}>
          <DialogContent className="max-w-5xl w-[95vw] md:w-full max-h-[95vh] overflow-y-auto rounded-[2rem] md:rounded-[3.5rem] p-0 border-none shadow-2xl bg-white">
            <div className="bg-slate-900 p-6 md:p-10 text-white sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 md:h-12 md:w-12 bg-primary/20 rounded-xl md:rounded-2xl flex items-center justify-center text-primary shadow-xl">
                  <GraduationCap className="h-5 w-5 md:h-6 md:w-6" />
                </div>
                <div>
                  <DialogTitle className="text-xl md:text-3xl font-headline font-black">{editingId ? 'Editar Curso' : 'Nuevo Curso'}</DialogTitle>
                  <DialogDescription className="text-slate-400 font-bold uppercase text-[8px] md:text-[10px] mt-1">Configura el acceso y las clases</DialogDescription>
                </div>
              </div>
            </div>
            
            <div className="p-6 md:p-10 grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-10">
              {/* COLUMNA 1: DATOS GENERALES */}
              <div className="space-y-6 md:space-y-8">
                {storageError && (
                  <Alert variant="destructive" className="rounded-2xl">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle className="text-[10px] font-black uppercase">Fallo Storage</AlertTitle>
                    <AlertDescription className="text-xs mt-1">{storageError}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-4 md:space-y-6">
                  <h3 className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-3">1. Datos Generales</h3>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black text-slate-500 uppercase">Nombre del Curso</Label>
                    <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="h-12 rounded-xl text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black text-slate-500 uppercase">Precio ($)</Label>
                      <Input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="h-12 rounded-xl text-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black text-slate-500 uppercase">Comisión (%)</Label>
                      <Input type="number" value={formData.commission} onChange={e => setFormData({...formData, commission: e.target.value})} className="h-12 rounded-xl text-sm" />
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-3">2. Portada</h3>
                  <div className="relative h-40 md:h-44 w-full rounded-2xl md:rounded-3xl bg-slate-50 border-2 border-dashed flex items-center justify-center overflow-hidden">
                    {formData.imageUrl ? <img src={formData.imageUrl} className="h-full w-full object-cover" alt="preview" /> : <ImageIcon className="text-slate-300 h-10 w-10" />}
                    <Button variant="secondary" size="sm" className="absolute bottom-3 right-3 shadow-lg text-[10px] font-black uppercase" onClick={() => fileInputRef.current?.click()}>Cambiar</Button>
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                </div>
              </div>

              {/* COLUMNA 2: AULA VIRTUAL */}
              <div className="space-y-6 md:space-y-8">
                <h3 className="text-[9px] md:text-[10px] font-black text-primary uppercase tracking-widest border-b border-primary/10 pb-3 flex items-center gap-2">
                  <Video className="h-4 w-4" /> 3. Aula Virtual
                </h3>
                <div className="p-5 md:p-6 bg-slate-50 rounded-[1.5rem] md:rounded-[2rem] space-y-4 border">
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black text-slate-400 uppercase">Título de la Lección</Label>
                    <Input value={newVideo.title} onChange={e => setNewVideo({...newVideo, title: e.target.value})} className="h-10 text-xs" />
                  </div>
                  
                  <div className="flex gap-2 p-1 bg-white rounded-xl border">
                    <Button 
                      variant="ghost" 
                      className={cn("flex-1 h-8 text-[8px] md:text-[9px] font-black transition-all", !newVideo.useLocalFile ? "bg-slate-900 text-white shadow-md" : "text-slate-400")}
                      onClick={() => setNewVideo({...newVideo, useLocalFile: false})}
                    >LINK</Button>
                    <Button 
                      variant="ghost" 
                      className={cn("flex-1 h-8 text-[8px] md:text-[9px] font-black transition-all", newVideo.useLocalFile ? "bg-slate-900 text-white shadow-md" : "text-slate-400")}
                      onClick={() => setNewVideo({...newVideo, useLocalFile: true})}
                    >SUBIR</Button>
                  </div>

                  {newVideo.useLocalFile ? (
                    <div className="space-y-3">
                      <Button 
                        variant="outline" 
                        className="w-full h-12 md:h-14 border-dashed border-2 text-primary bg-white"
                        onClick={() => videoInputRef.current?.click()}
                        disabled={uploadProgress !== null}
                      >
                        {uploadProgress !== null ? <Loader2 className="animate-spin h-4 w-4" /> : <Upload className="h-4 w-4" />}
                        <span className="text-[9px] font-black ml-2">{newVideo.url ? "CARGADO ✓" : "SELECCIONAR MP4"}</span>
                      </Button>
                      <input type="file" ref={videoInputRef} onChange={handleVideoFileChange} accept="video/*" className="hidden" />
                      {uploadProgress !== null && <Progress value={uploadProgress} className="h-1" />}
                    </div>
                  ) : (
                    <Input value={newVideo.url} onChange={e => setNewVideo({...newVideo, url: e.target.value})} placeholder="URL de video (YouTube/Drive)" className="h-10 text-xs" />
                  )}

                  <div className="space-y-2">
                    <Label className="text-[9px] font-black text-slate-400 uppercase">Tipo de Acceso</Label>
                    <Select value={newVideo.type} onValueChange={(v: any) => setNewVideo({...newVideo, type: v})}>
                      <SelectTrigger className="h-10 text-xs bg-white"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="content">Para el Alumno (Curso)</SelectItem>
                        <SelectItem value="training">Para el Afiliado (Guía)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAddVideo} className="w-full h-10 text-[10px] font-black bg-primary text-white shadow-lg shadow-primary/20" disabled={uploadProgress !== null}>AÑADIR A LA LISTA</Button>
                </div>

                <div className="space-y-2 max-h-[250px] md:max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {videos.map((v) => (
                    <div key={v.id} className="flex items-center justify-between p-3 bg-white border rounded-xl md:rounded-2xl shadow-sm hover:border-primary/20 transition-all group">
                      <div className="flex items-center gap-3 min-w-0">
                        <PlayCircle className={cn("h-4 w-4 shrink-0", v.type === 'content' ? 'text-blue-500' : 'text-primary')} />
                        <span className="text-[9px] md:text-[10px] font-black text-slate-800 uppercase truncate pr-2">{v.title}</span>
                      </div>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50 shrink-0" onClick={() => setVideos(videos.filter(vi => vi.id !== v.id))}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  ))}
                  {videos.length === 0 && <p className="text-center text-[9px] font-bold text-slate-300 uppercase py-4">Lista vacía</p>}
                </div>
              </div>

              {/* COLUMNA 3: COBROS E IA */}
              <div className="space-y-6 md:space-y-8">
                <div className="p-6 md:p-8 bg-primary/5 rounded-[1.5rem] md:rounded-[2.5rem] border border-primary/10 space-y-4">
                  <h3 className="text-[9px] font-black text-primary uppercase tracking-widest flex items-center gap-2"><Landmark className="h-4 w-4" /> Cobros Nicaragua</h3>
                  <Input value={formData.bankAccount} onChange={e => setFormData({...formData, bankAccount: e.target.value})} placeholder="Número de cuenta" className="h-12 bg-white text-sm" />
                  <Select onValueChange={v => setFormData({...formData, bankType: v})} value={formData.bankType}>
                    <SelectTrigger className="h-12 bg-white text-sm"><SelectValue placeholder="Banco" /></SelectTrigger>
                    <SelectContent>{NICA_BANKS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input value={formData.bankHolder} onChange={e => setFormData({...formData, bankHolder: e.target.value})} placeholder="Nombre del Titular" className="h-12 bg-white text-sm" />
                  
                  <div className="pt-4 border-t border-primary/10">
                    <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-2"><LinkIcon className="h-4 w-4" /> Link de Pago Digital</h3>
                    <Input value={formData.paymentLink} onChange={e => setFormData({...formData, paymentLink: e.target.value})} placeholder="https://..." className="h-12 bg-white text-[10px] font-mono" />
                  </div>
                </div>
                
                <div className="p-6 md:p-8 bg-slate-900 rounded-[1.5rem] md:rounded-[2.5rem] text-white space-y-4 shadow-2xl">
                  <h3 className="text-[9px] font-black text-primary uppercase tracking-widest flex items-center gap-2"><Sparkles className="h-4 w-4" /> Asistente IA</h3>
                  <Input value={formData.features} onChange={e => setFormData({...formData, features: e.target.value})} placeholder="Ventajas clave..." className="bg-white/5 border-none h-12 text-sm" />
                  <Button onClick={handleAIHelp} variant="outline" className="w-full h-12 md:h-14 border-primary text-primary font-black text-[10px] uppercase hover:bg-primary hover:text-white transition-all" disabled={generating}>{generating ? "ESCRIBIENDO..." : "GENERAR COPY VENTAS"}</Button>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-10 border-t bg-slate-50 flex flex-col gap-6 sticky bottom-0 z-10">
              <div className="space-y-2">
                <Label className="text-[9px] font-black text-slate-400 uppercase ml-1">Descripción Final / Copy</Label>
                <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="min-h-[100px] md:min-h-[120px] rounded-2xl md:rounded-3xl bg-white border-none ring-1 ring-slate-200 p-4 md:p-6 text-sm" placeholder="Este texto lo verán tus afiliados..." />
              </div>
              <div className="flex gap-3 md:gap-4">
                <Button variant="ghost" onClick={closeDialog} className="flex-1 h-14 md:h-16 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase text-slate-400 hover:bg-slate-100">CANCELAR</Button>
                <Button className="flex-[2] h-14 md:h-16 rounded-xl md:rounded-2xl bg-slate-900 text-white font-black text-[10px] md:text-xs uppercase shadow-2xl" onClick={handleSave}>
                  {editingId ? 'GUARDAR CURSO' : 'PUBLICAR CURSO'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Card className="border-none shadow-2xl rounded-[2rem] md:rounded-[3.5rem] overflow-hidden bg-white ring-1 ring-slate-100">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center py-32 md:py-40"><Loader2 className="animate-spin h-10 w-10 md:h-12 md:w-12 text-primary opacity-50" /></div>
            ) : !products || products.length === 0 ? (
              <div className="text-center py-24 md:py-32 text-slate-400"><GraduationCap className="h-16 w-16 md:h-20 md:w-20 mx-auto mb-4 opacity-10" /><p className="font-black text-xs md:text-sm uppercase tracking-widest">Aún no has subido cursos.</p></div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow className="bg-slate-50/50 h-16 md:h-20">
                    <TableHead className="px-6 md:px-10 font-black uppercase text-[9px] md:text-[10px] tracking-widest text-slate-400">Curso / Academia</TableHead>
                    <TableHead className="font-black uppercase text-[9px] md:text-[10px] tracking-widest text-slate-400">Precio</TableHead>
                    <TableHead className="font-black uppercase text-[9px] md:text-[10px] tracking-widest text-slate-400">Comisión</TableHead>
                    <TableHead className="px-6 md:px-10 text-right font-black uppercase text-[9px] md:text-[10px] tracking-widest text-slate-400">Acciones</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>{products.map((p) => (
                    <TableRow key={p.id} className="h-20 md:h-24 border-b last:border-0 group hover:bg-slate-50/30 transition-colors">
                      <TableCell className="px-6 md:px-10">
                        <div className="flex items-center gap-3 md:gap-5">
                          <div className="h-10 w-10 md:h-14 md:w-14 rounded-lg md:rounded-2xl bg-slate-100 overflow-hidden border shrink-0">
                            {p.imageUrl ? <img src={p.imageUrl} className="h-full w-full object-cover" alt="thumb" /> : <GraduationCap className="h-5 w-5 md:h-6 md:w-6 text-slate-300 m-auto mt-2.5 md:mt-4" />}
                          </div>
                          <div className="min-w-0">
                            <p className="font-black text-slate-800 uppercase tracking-tight text-xs md:text-base truncate max-w-[120px] md:max-w-xs">{p.name}</p>
                            <p className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-widest">ID: {p.code}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-black text-sm md:text-lg text-slate-900 whitespace-nowrap">${p.price?.toFixed(2)}</TableCell>
                      <TableCell><span className="bg-green-50 text-green-600 font-black px-3 md:px-4 py-1 md:py-2 rounded-lg md:rounded-xl text-[8px] md:text-[10px] uppercase whitespace-nowrap">{p.commissionRate}%</span></TableCell>
                      <TableCell className="px-6 md:px-10 text-right">
                        <div className="flex justify-end gap-1 md:gap-3">
                          <Button variant="ghost" size="icon" className="h-8 w-8 md:h-10 md:w-10 text-blue-500 hover:bg-blue-50 rounded-lg md:rounded-xl" onClick={() => setEditingId(p.id)}><Edit3 className="h-4 w-4 md:h-5 md:w-5" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 md:h-10 md:w-10 text-destructive hover:bg-red-50 rounded-lg md:rounded-xl" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4 md:h-5 md:w-5" /></Button>
                        </div>
                      </TableCell>
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
