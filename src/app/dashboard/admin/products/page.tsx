
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
import { PRODUCT_CATEGORIES, NICA_BANKS, PRODUCT_TYPES } from '@/lib/constants'
import { Plus, Trash2, Search, Loader2, Landmark, Image as ImageIcon, Upload, GraduationCap, Sparkles, Video, PlayCircle, Link as LinkIcon, Edit3, AlertCircle, Save, X, Package, Truck } from 'lucide-react'
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
  const [searchTerm, setSearchTerm] = useState('')
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  
  const productsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, 'products');
  }, [db, user]);
  
  const { data: products, isLoading } = useCollection(productsQuery);

  const [formData, setFormData] = useState({
    name: '',
    type: 'Digital',
    category: 'Curso',
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
          type: p.type || 'Digital',
          category: p.category || 'Curso',
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
      toast({ title: "Producto Actualizado", description: "Los cambios se han guardado con éxito." });
    } else {
      addDocumentNonBlocking(collection(db, 'products'), { ...productData, createdAt: new Date().toISOString() });
      toast({ title: "Producto Publicado", description: "El producto ya es visible para los socios." });
    }
    closeDialog();
  }

  const closeDialog = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({ name: '', type: 'Digital', category: 'Curso', code: '', price: '', commission: '', bankAccount: '', bankType: '', bankHolder: '', paymentLink: '', features: '', description: '', imageUrl: '' });
    setVideos([]);
    setStorageError(null);
  }

  const handleDelete = (id: string) => {
    if(confirm("¿Seguro que quieres eliminar este producto?")) {
      deleteDocumentNonBlocking(doc(db, 'products', id));
      toast({ title: "Producto eliminado" });
    }
  }

  const filteredProducts = (products || []).filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardShell role="admin">
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-headline font-black text-slate-900 tracking-tight leading-none uppercase italic">Catálogo de <span className="text-primary">Productos</span></h1>
            <p className="text-slate-500 font-medium mt-2">Gestiona productos digitales y físicos con pagos por link o contra entrega.</p>
          </div>
          <div className="flex gap-4">
             <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar..." className="pl-10 h-12 rounded-xl bg-white border-none shadow-sm" />
             </div>
             <Button onClick={() => setIsAdding(true)} size="lg" className="h-12 px-6 bg-primary hover:bg-primary/90 rounded-xl shadow-xl hover:scale-105 transition-all font-black text-xs uppercase tracking-widest gap-2">
              <Plus className="h-5 w-5" /> NUEVO
            </Button>
          </div>
        </div>

        <Dialog open={isAdding} onOpenChange={(open) => !open && closeDialog()}>
          <DialogContent className="max-w-full w-full h-[100dvh] md:max-w-6xl md:h-[90vh] md:rounded-[3.5rem] p-0 border-none shadow-2xl bg-white overflow-hidden flex flex-col">
            <div className="bg-slate-900 p-6 md:p-10 text-white shrink-0 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 md:h-12 md:w-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary shadow-xl">
                  {formData.type === 'Digital' ? <GraduationCap className="h-5 w-5 md:h-6 md:w-6" /> : <Package className="h-5 w-5 md:h-6 md:w-6" />}
                </div>
                <div>
                  <DialogTitle className="text-xl md:text-3xl font-headline font-black">{editingId ? 'Editar Producto' : 'Cargar Producto'}</DialogTitle>
                  <DialogDescription className="text-slate-400 font-bold uppercase text-[8px] md:text-[10px] tracking-widest mt-1">
                    {formData.type === 'Digital' ? 'ENTREGA DIGITAL VÍA EMAIL/PLATAFORMA' : 'ENTREGA FÍSICA PAGO CONTRA ENTREGA'}
                  </DialogDescription>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="text-white/40 hover:text-white md:hidden" onClick={closeDialog}>
                <X className="h-6 w-6" />
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 md:p-12 space-y-10 pb-32">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-7 space-y-8">
                  <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-slate-500 uppercase ml-1">Tipo de Producto</Label>
                      <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v})}>
                        <SelectTrigger className="h-12 bg-white rounded-xl border-slate-200 font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PRODUCT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-slate-500 uppercase ml-1">Categoría</Label>
                      <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})}>
                        <SelectTrigger className="h-12 bg-white rounded-xl border-slate-200 font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PRODUCT_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-[10px] font-black text-slate-500 uppercase ml-1">Nombre Comercial</Label>
                      <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="h-14 text-[16px] rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 font-bold" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-slate-500 uppercase ml-1">Precio ($)</Label>
                      <Input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="h-14 text-[16px] rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 font-black" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-slate-500 uppercase ml-1">Comisión Afiliado (%)</Label>
                      <Input type="number" value={formData.commission} onChange={e => setFormData({...formData, commission: e.target.value})} className="h-14 text-[16px] rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 font-black text-green-600" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-[10px] font-black text-slate-500 uppercase ml-1">Miniatura</Label>
                    <div className="relative h-48 md:h-64 rounded-[2.5rem] bg-slate-50 border-4 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden transition-all hover:bg-slate-100 group">
                      {formData.imageUrl ? (
                        <img src={formData.imageUrl} className="h-full w-full object-cover" alt="preview" />
                      ) : (
                        <ImageIcon className="h-12 w-12 text-slate-200" />
                      )}
                      <Button variant="secondary" size="sm" className="absolute bottom-4 right-4 shadow-2xl rounded-xl font-black text-[10px] uppercase h-10" onClick={() => fileInputRef.current?.click()}>CAMBIAR</Button>
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                  </div>

                  <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white space-y-6">
                    <div className="flex items-center gap-3">
                      <Sparkles className="h-5 w-5 text-primary" />
                      <h3 className="text-sm font-headline font-black uppercase">Descripción IA</h3>
                    </div>
                    <Input value={formData.features} onChange={e => setFormData({...formData, features: e.target.value})} placeholder="Características clave..." className="bg-white/5 border-none h-12 text-white" />
                    <Button onClick={handleAIHelp} variant="outline" className="w-full h-12 border-primary text-primary hover:bg-primary hover:text-white font-black text-[10px] uppercase" disabled={generating}>
                      {generating ? "ESCRIBIENDO..." : "REDACTAR CON IA"}
                    </Button>
                    <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="min-h-[150px] rounded-2xl bg-white/5 border-none p-6" placeholder="Oferta irresistible..." />
                  </div>
                </div>

                <div className="lg:col-span-5 space-y-10">
                  {formData.type === 'Digital' && (
                    <div className="p-8 bg-primary/5 rounded-[2.5rem] border-2 border-dashed border-primary/20 space-y-6">
                      <div className="flex items-center gap-3">
                        <Video className="h-5 w-5 text-primary" />
                        <h3 className="text-xs font-black text-primary uppercase">Contenido Digital (Videos/PDF)</h3>
                      </div>
                      <div className="space-y-4">
                        <Input value={newVideo.title} onChange={e => setNewVideo({...newVideo, title: e.target.value})} placeholder="Título de la clase..." className="h-12 bg-white" />
                        <Input value={newVideo.url} onChange={e => setNewVideo({...newVideo, url: e.target.value})} placeholder="Link del video o archivo..." className="h-12 bg-white" />
                        <Button onClick={handleAddVideo} className="w-full h-12 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase">AÑADIR RECURSO</Button>
                      </div>
                      <div className="space-y-2">
                        {videos.map((v, i) => (
                          <div key={v.id} className="flex items-center justify-between p-3 bg-white border rounded-xl shadow-sm">
                            <span className="text-[10px] font-black text-slate-700 truncate">{i+1}. {v.title}</span>
                            <Button size="icon" variant="ghost" className="h-6 w-6 text-red-400" onClick={() => setVideos(videos.filter(vi => vi.id !== v.id))}><Trash2 className="h-3 w-3" /></Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="p-8 bg-slate-50 rounded-[2.5rem] border space-y-6">
                    <div className="flex items-center gap-3">
                      {formData.type === 'Digital' ? <CreditCard className="h-5 w-5 text-slate-400" /> : <Truck className="h-5 w-5 text-slate-400" />}
                      <h3 className="text-xs font-black text-slate-800 uppercase">Configuración de Pago</h3>
                    </div>
                    
                    {formData.type === 'Físico' ? (
                      <Alert className="bg-green-50 border-green-200 rounded-2xl">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertTitle className="text-[10px] font-black uppercase text-green-900">Pago Contra Entrega Activo</AlertTitle>
                        <AlertDescription className="text-[11px] font-medium text-green-700">El cliente recibirá su pedido y pagará en efectivo al repartidor. Ideal para envíos locales en Nicaragua.</AlertDescription>
                      </Alert>
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black text-slate-500 uppercase">Banco Receptor</Label>
                          <Select onValueChange={v => setFormData({...formData, bankType: v})} value={formData.bankType}>
                            <SelectTrigger className="h-12 bg-white rounded-xl border-slate-200">
                              <SelectValue placeholder="Selecciona banco" />
                            </SelectTrigger>
                            <SelectContent>
                              {NICA_BANKS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <Input value={formData.bankAccount} onChange={e => setFormData({...formData, bankAccount: e.target.value})} placeholder="Número de cuenta..." className="h-12 bg-white rounded-xl" />
                        <Input value={formData.paymentLink} onChange={e => setFormData({...formData, paymentLink: e.target.value})} placeholder="Link de pago digital (Opcional)..." className="h-12 bg-white rounded-xl border-primary/20" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 md:p-8 border-t bg-white/90 backdrop-blur-md flex flex-col md:flex-row gap-3 absolute bottom-0 left-0 right-0 z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
              <Button variant="ghost" onClick={closeDialog} className="order-2 md:order-1 flex-1 h-14 md:h-16 rounded-2xl font-black text-[10px] md:text-xs uppercase text-slate-400">CANCELAR</Button>
              <Button className="order-1 md:order-2 flex-[2] h-14 md:h-16 rounded-2xl bg-slate-900 text-white font-black text-[10px] md:text-xs uppercase shadow-2xl" onClick={handleSave}>
                <Save className="h-5 w-5 text-primary" /> {editingId ? 'ACTUALIZAR' : 'PUBLICAR'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white ring-1 ring-slate-100">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center py-40"><Loader2 className="animate-spin h-12 w-12 text-primary opacity-50" /></div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 h-20">
                      <TableHead className="px-6 md:px-10 font-black uppercase text-[10px] text-slate-400 tracking-widest">Producto</TableHead>
                      <TableHead className="font-black uppercase text-[10px] text-slate-400 tracking-widest">Tipo</TableHead>
                      <TableHead className="font-black uppercase text-[10px] text-slate-400 tracking-widest">Precio</TableHead>
                      <TableHead className="font-black uppercase text-[10px] text-slate-400 tracking-widest">Comisión</TableHead>
                      <TableHead className="px-6 md:px-10 text-right font-black uppercase text-[10px] text-slate-400 tracking-widest">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((p) => (
                      <TableRow key={p.id} className="h-20 border-b last:border-0 hover:bg-slate-50/30 transition-colors group">
                        <TableCell className="px-6 md:px-10">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-slate-100 overflow-hidden shrink-0 border">
                              {p.imageUrl && <img src={p.imageUrl} className="h-full w-full object-cover" alt="thumb" />}
                            </div>
                            <div className="min-w-0">
                              <p className="font-black text-slate-800 uppercase text-xs truncate max-w-[200px]">{p.name}</p>
                              <p className="text-[8px] font-black text-primary uppercase">ID: {p.code}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("text-[8px] font-black uppercase px-2 py-0.5 rounded-lg", p.type === 'Físico' ? "border-blue-100 bg-blue-50 text-blue-600" : "border-purple-100 bg-purple-50 text-purple-600")}>
                            {p.type || 'Digital'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-black text-sm text-slate-900">${p.price?.toFixed(2)}</TableCell>
                        <TableCell className="font-black text-sm text-green-600">{p.commissionRate}%</TableCell>
                        <TableCell className="px-6 md:px-10 text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 rounded-lg hover:bg-blue-50" onClick={() => setEditingId(p.id)}><Edit3 className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive rounded-lg hover:bg-red-50" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4" /></Button>
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
