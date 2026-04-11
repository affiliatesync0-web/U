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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { PRODUCT_CATEGORIES, NICA_BANKS } from '@/lib/constants'
import { Plus, Trash2, Search, Loader2, Landmark, Image as ImageIcon, Upload, GraduationCap, Sparkles, Video, PlayCircle, Link as LinkIcon, Edit3, AlertCircle, Save, X } from 'lucide-react'
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

    try {
      const { storage } = initializeFirebase();
      const storageRef = ref(storage, `product_videos/${Date.now()}_${file.name.replace(/\s+/g, '_')}`);
      const uploadTask = uploadBytesResumable(storageRef, file, { contentType: file.type });

      uploadTask.on('state_changed', 
        (snapshot) => setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100), 
        (error: any) => {
          setStorageError("Fallo al subir video. Revisa permisos en consola.");
          setUploadProgress(null);
        }, 
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setNewVideo(prev => ({ ...prev, url: downloadURL }));
          setUploadProgress(null);
          toast({ title: "¡Video Cargado!" });
        }
      );
    } catch (e) {
      setStorageError("Error de inicialización de Storage");
      setUploadProgress(null);
    }
  };

  const handleAddVideo = () => {
    if (!newVideo.title || !newVideo.url) {
      toast({ variant: "destructive", title: "Faltan datos", description: "Pon un título y sube/pega el video." });
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
      toast({ variant: "destructive", title: "Faltan datos base", description: "Escribe el nombre y algunas características para la IA." })
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
      toast({ variant: "destructive", title: "Error IA", description: "No se pudo conectar con el cerebro digital." })
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = () => {
    if (!formData.name || !formData.price || !formData.commission) {
      toast({ variant: "destructive", title: "Campos Requeridos", description: "Nombre, precio y comisión son obligatorios." });
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
      toast({ title: "Curso Actualizado", description: "Los cambios se han guardado con éxito." });
    } else {
      addDocumentNonBlocking(collection(db, 'products'), { ...productData, createdAt: new Date().toISOString() });
      toast({ title: "Curso Publicado", description: "El producto ya es visible para los socios." });
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
    if(confirm("¿Seguro que quieres eliminar este producto?")) {
      deleteDocumentNonBlocking(doc(db, 'products', id));
      toast({ title: "Producto eliminado" });
    }
  }

  return (
    <DashboardShell role="admin">
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-headline font-black text-slate-900 tracking-tight leading-none uppercase italic">Catálogo de <span className="text-primary">Productos</span></h1>
            <p className="text-slate-500 font-medium mt-2">Sube tus cursos y configura las ganancias de tus socios.</p>
          </div>
          <Button onClick={() => setIsAdding(true)} size="lg" className="h-16 px-8 bg-primary hover:bg-primary/90 rounded-2xl shadow-xl hover:scale-105 transition-all font-black text-xs uppercase tracking-widest gap-2">
            <Plus className="h-5 w-5" /> CREAR NUEVO PRODUCTO
          </Button>
        </div>

        <Dialog open={isAdding} onOpenChange={(open) => !open && closeDialog()}>
          <DialogContent className="max-w-full w-full h-[100dvh] md:max-w-6xl md:h-[90vh] md:rounded-[3.5rem] p-0 border-none shadow-2xl bg-white overflow-hidden flex flex-col">
            <div className="bg-slate-900 p-6 md:p-10 text-white shrink-0 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary shadow-xl">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <div>
                  <DialogTitle className="text-xl md:text-3xl font-headline font-black">{editingId ? 'Editar Producto' : 'Cargar Producto Digital'}</DialogTitle>
                  <DialogDescription className="text-slate-400 font-bold uppercase text-[8px] md:text-[10px] tracking-widest mt-1">Configuración Maestra Sync Academy</DialogDescription>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="text-white/40 hover:text-white md:hidden" onClick={closeDialog}>
                <X className="h-6 w-6" />
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 md:p-12 space-y-10 pb-32">
              {storageError && (
                <Alert variant="destructive" className="rounded-2xl bg-red-50 border-red-100">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle className="font-black uppercase text-xs">Error de Servidor</AlertTitle>
                  <AlertDescription className="text-xs font-bold mt-1">{storageError}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* COLUMNA IZQUIERDA: Info Básica */}
                <div className="lg:col-span-7 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-[10px] font-black text-slate-500 uppercase ml-1">Nombre Comercial del Producto</Label>
                      <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="h-14 text-[16px] rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 font-bold" placeholder="Ej: Master en Marketing 2024" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-slate-500 uppercase ml-1">Precio de Venta ($)</Label>
                      <Input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="h-14 text-[16px] rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 font-black" placeholder="99.00" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-slate-500 uppercase ml-1">Comisión Afiliado (%)</Label>
                      <Input type="number" value={formData.commission} onChange={e => setFormData({...formData, commission: e.target.value})} className="h-14 text-[16px] rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 font-black text-green-600" placeholder="50" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-[10px] font-black text-slate-500 uppercase ml-1">Imagen de Portada (Miniatura)</Label>
                    <div className="relative h-64 rounded-[2.5rem] bg-slate-50 border-4 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden transition-all hover:bg-slate-100 group">
                      {formData.imageUrl ? (
                        <img src={formData.imageUrl} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700" alt="preview" />
                      ) : (
                        <div className="flex flex-col items-center gap-2 opacity-30">
                          <ImageIcon className="h-12 w-12 text-slate-400" />
                          <p className="text-[10px] font-black uppercase">Click para subir imagen</p>
                        </div>
                      )}
                      <Button variant="secondary" size="sm" className="absolute bottom-6 right-6 shadow-2xl rounded-xl font-black text-[10px] uppercase h-10 px-6" onClick={() => fileInputRef.current?.click()}>CAMBIAR IMAGEN</Button>
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                  </div>

                  <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white space-y-6">
                    <div className="flex items-center gap-3">
                      <Sparkles className="h-5 w-5 text-primary" />
                      <h3 className="text-sm font-headline font-black uppercase tracking-widest">Generador de Copy IA</h3>
                    </div>
                    <div className="space-y-4">
                      <Label className="text-[10px] font-black text-slate-400 uppercase">Beneficios clave (separados por comas)</Label>
                      <Input value={formData.features} onChange={e => setFormData({...formData, features: e.target.value})} placeholder="Acceso vitalicio, Mentoría 1-1, Certificado..." className="bg-white/5 border-none h-12 text-[16px] rounded-xl text-white placeholder:text-slate-600" />
                      <Button onClick={handleAIHelp} variant="outline" className="w-full h-14 border-primary text-primary hover:bg-primary hover:text-white transition-all font-black text-[10px] uppercase tracking-widest" disabled={generating}>
                        {generating ? <><Loader2 className="animate-spin mr-2 h-4 w-4" /> ESCRIBIENDO...</> : "REDACTAR DESCRIPCIÓN CON IA"}
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-slate-400 uppercase">Descripción / Copy Final</Label>
                      <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="min-h-[180px] rounded-2xl bg-white/5 border-none ring-1 ring-white/10 text-[16px] p-6 leading-relaxed" placeholder="Escribe o deja que la IA redacte tu oferta irresistible..." />
                    </div>
                  </div>
                </div>

                {/* COLUMNA DERECHA: Aula Virtual & Pagos */}
                <div className="lg:col-span-5 space-y-10">
                  <div className="p-8 bg-primary/5 rounded-[2.5rem] border-2 border-dashed border-primary/20 space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shadow-inner">
                        <Video className="h-5 w-5" />
                      </div>
                      <h3 className="text-xs font-black text-primary uppercase tracking-[0.2em]">Aula Virtual Elite</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black text-slate-500 uppercase ml-1">Título de la Lección</Label>
                        <Input value={newVideo.title} onChange={e => setNewVideo({...newVideo, title: e.target.value})} placeholder="Ej: 01. Mentalidad Ganadora" className="h-12 text-[16px] bg-white rounded-xl" />
                      </div>
                      
                      <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl">
                        <Button variant="ghost" className={cn("flex-1 h-10 text-[9px] font-black rounded-xl transition-all", !newVideo.useLocalFile ? "bg-white text-slate-900 shadow-sm" : "text-slate-400")} onClick={() => setNewVideo({...newVideo, useLocalFile: false})}>LINK EXTERNO</Button>
                        <Button variant="ghost" className={cn("flex-1 h-10 text-[9px] font-black rounded-xl transition-all", newVideo.useLocalFile ? "bg-white text-slate-900 shadow-sm" : "text-slate-400")} onClick={() => setNewVideo({...newVideo, useLocalFile: true})}>SUBIR VIDEO MP4</Button>
                      </div>

                      {newVideo.useLocalFile ? (
                        <div className="space-y-3">
                          <Button variant="outline" className="w-full h-20 border-dashed border-2 bg-white rounded-2xl flex flex-col gap-1 transition-all hover:bg-slate-50" onClick={() => videoInputRef.current?.click()} disabled={uploadProgress !== null}>
                            {uploadProgress !== null ? (
                              <>
                                <Loader2 className="animate-spin h-5 w-5 text-primary" />
                                <span className="text-[9px] font-black uppercase text-primary">Subiendo: {Math.round(uploadProgress)}%</span>
                              </>
                            ) : (
                              <>
                                <Upload className="h-5 w-5 text-slate-400" />
                                <span className="text-[9px] font-black uppercase text-slate-500">{newVideo.url ? "VIDEO CARGADO ✓" : "SELECCIONAR ARCHIVO"}</span>
                              </>
                            )}
                          </Button>
                          <input type="file" ref={videoInputRef} onChange={handleVideoFileChange} accept="video/*" className="hidden" />
                          {uploadProgress !== null && <Progress value={uploadProgress} className="h-1.5" />}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black text-slate-500 uppercase ml-1">URL del Video (YouTube/Vimeo/Drive)</Label>
                          <Input value={newVideo.url} onChange={e => setNewVideo({...newVideo, url: e.target.value})} placeholder="https://..." className="h-12 text-[16px] bg-white rounded-xl" />
                        </div>
                      )}
                      
                      <Button onClick={handleAddVideo} className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl" disabled={uploadProgress !== null}>AÑADIR CLASE AL CURSO</Button>
                    </div>

                    <div className="space-y-3 max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
                      {videos.length === 0 ? (
                        <div className="text-center py-10 opacity-20">
                          <PlayCircle className="h-10 w-10 mx-auto mb-2" />
                          <p className="text-[9px] font-black uppercase">Sin clases añadidas</p>
                        </div>
                      ) : (
                        videos.map((v, index) => (
                          <div key={v.id} className="flex items-center justify-between p-4 bg-white border rounded-2xl shadow-sm group hover:border-primary/30 transition-all">
                            <div className="flex items-center gap-4 min-w-0">
                              <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 shrink-0">
                                {index + 1}
                              </div>
                              <div className="truncate">
                                <p className="text-[10px] font-black text-slate-800 uppercase truncate">{v.title}</p>
                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{v.isLocal ? 'Archivo Interno' : 'Link Externo'}</p>
                              </div>
                            </div>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl" onClick={() => setVideos(videos.filter(vi => vi.id !== v.id))}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="p-8 bg-slate-50 rounded-[2.5rem] border space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm border">
                        <Landmark className="h-5 w-5" />
                      </div>
                      <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em]">Configuración de Cobros</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black text-slate-500 uppercase">Banco Local Receptor</Label>
                        <Select onValueChange={v => setFormData({...formData, bankType: v})} value={formData.bankType}>
                          <SelectTrigger className="h-14 bg-white text-[16px] rounded-xl border-slate-200">
                            <SelectValue placeholder="Selecciona un banco de Nicaragua" />
                          </SelectTrigger>
                          <SelectContent>
                            {NICA_BANKS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black text-slate-500 uppercase">Número de Cuenta</Label>
                        <Input value={formData.bankAccount} onChange={e => setFormData({...formData, bankAccount: e.target.value})} placeholder="Ej: 1234567890" className="h-14 bg-white text-[16px] rounded-xl font-mono" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black text-slate-500 uppercase">Nombre del Titular</Label>
                        <Input value={formData.bankHolder} onChange={e => setFormData({...formData, bankHolder: e.target.value})} placeholder="Tal cual aparece en el banco" className="h-14 bg-white text-[16px] rounded-xl font-bold uppercase" />
                      </div>
                      <div className="pt-4 space-y-2 border-t mt-4">
                        <Label className="text-[10px] font-black text-primary uppercase flex items-center gap-2"><LinkIcon className="h-3 w-3" /> Link de Pago Digital (Opcional)</Label>
                        <Input value={formData.paymentLink} onChange={e => setFormData({...formData, paymentLink: e.target.value})} placeholder="https://link.pagos.com/producto" className="h-14 bg-white text-[16px] rounded-xl border-primary/20" />
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Si añades un link, el sistema habilitará el curso automáticamente tras el pago.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ACTION BAR FIJA */}
            <div className="p-6 md:p-10 border-t bg-slate-50/80 backdrop-blur-md flex gap-4 absolute bottom-0 left-0 right-0 z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
              <Button variant="ghost" onClick={closeDialog} className="flex-1 h-16 rounded-[1.5rem] font-black text-xs uppercase text-slate-400 hover:bg-slate-100 transition-all">SALIR SIN GUARDAR</Button>
              <Button className="flex-[2] h-16 rounded-[1.5rem] bg-slate-900 text-white font-black text-xs uppercase shadow-2xl shadow-slate-200 hover:scale-[1.02] active:scale-95 transition-all gap-3" onClick={handleSave}>
                <Save className="h-5 w-5 text-primary" /> {editingId ? 'ACTUALIZAR CURSO' : 'PUBLICAR CURSO DIGITAL'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white ring-1 ring-slate-100">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center py-40"><Loader2 className="animate-spin h-12 w-12 text-primary opacity-50" /></div>
            ) : !products || products.length === 0 ? (
              <div className="text-center py-40 flex flex-col items-center gap-4 opacity-20">
                <Package className="h-20 w-20" />
                <p className="font-black uppercase tracking-widest text-xs">Tu catálogo está vacío por ahora</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 h-20 border-b">
                      <TableHead className="px-10 font-black uppercase text-[10px] text-slate-400 tracking-widest">Curso / Producto</TableHead>
                      <TableHead className="font-black uppercase text-[10px] text-slate-400 tracking-widest">Categoría</TableHead>
                      <TableHead className="font-black uppercase text-[10px] text-slate-400 tracking-widest">Precio</TableHead>
                      <TableHead className="font-black uppercase text-[10px] text-slate-400 tracking-widest">Comisión</TableHead>
                      <TableHead className="px-10 text-right font-black uppercase text-[10px] text-slate-400 tracking-widest">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((p) => (
                      <TableRow key={p.id} className="h-24 border-b last:border-0 hover:bg-slate-50/30 transition-colors group">
                        <TableCell className="px-10">
                          <div className="flex items-center gap-5">
                            <div className="h-14 w-14 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border shadow-inner group-hover:rotate-3 transition-transform">
                              {p.imageUrl ? <img src={p.imageUrl} className="h-full w-full object-cover" alt="thumb" /> : <GraduationCap className="h-6 w-6 text-slate-300 m-auto mt-4" />}
                            </div>
                            <div className="min-w-0">
                              <p className="font-black text-slate-800 uppercase tracking-tight text-sm truncate max-w-[250px]">{p.name}</p>
                              <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">ID: {p.code}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-[10px] font-black uppercase text-slate-500 bg-slate-100 px-3 py-1 rounded-lg border">{p.category}</span>
                        </TableCell>
                        <TableCell className="font-black text-lg text-slate-900">${p.price?.toFixed(2)}</TableCell>
                        <TableCell className="font-black text-lg text-green-600">{p.commissionRate}%</TableCell>
                        <TableCell className="px-10 text-right">
                          <div className="flex justify-end gap-3">
                            <Button variant="ghost" size="icon" className="h-12 w-12 text-blue-500 bg-blue-50 rounded-2xl hover:bg-blue-500 hover:text-white transition-all" onClick={() => setEditingId(p.id)}>
                              <Edit3 className="h-5 w-5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-12 w-12 text-destructive bg-red-50 rounded-2xl hover:bg-destructive hover:text-white transition-all" onClick={() => handleDelete(p.id)}>
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}

import { Package } from 'lucide-react'
