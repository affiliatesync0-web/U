
"use client"

import { useState, useRef } from 'react'
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
import { Plus, Trash2, Wand2, Search, Loader2, Landmark, Image as ImageIcon, Upload, GraduationCap, Sparkles, Video, PlayCircle, Target, Users, FileVideo } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/components/language-context'
import { generateProductDescription } from '@/ai/flows/generate-product-description-flow'
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, useUser, initializeFirebase } from '@/firebase'
import { collection, doc } from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { cn } from '@/lib/utils'

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
  const { user, isUserLoading } = useUser()
  const [isAdding, setIsAdding] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  
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
    features: '',
    description: '',
    imageUrl: ''
  })

  const [videos, setVideos] = useState<VideoItem[]>([])
  const [newVideo, setNewVideo] = useState({ title: '', url: '', type: 'content' as 'content' | 'training', useLocalFile: false })

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 800000) {
        toast({ variant: "destructive", title: "Imagen pesada", description: "Máximo 800KB." });
        return;
      }
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

    // Validación de tamaño (ejemplo 100MB)
    if (file.size > 100 * 1024 * 1024) {
      toast({ variant: "destructive", title: "Video demasiado grande", description: "El límite actual es de 100MB por archivo." });
      return;
    }

    const { storage } = initializeFirebase();
    const storageRef = ref(storage, `videos/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed', 
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      }, 
      (error) => {
        console.error("Upload error:", error);
        toast({ variant: "destructive", title: "Error de subida", description: "No se pudo subir el video a la nube." });
        setUploadProgress(null);
      }, 
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        setNewVideo(prev => ({ ...prev, url: downloadURL }));
        setUploadProgress(null);
        toast({ title: "¡Video Cargado!", description: "El archivo se ha subido correctamente." });
      }
    );
  };

  const handleAddVideo = () => {
    if (!newVideo.title || !newVideo.url) {
      toast({ variant: "destructive", title: "Datos incompletos", description: "Asigna un título y sube un video o pega un enlace." });
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
    if (!formData.name || !formData.category || !formData.features) {
      toast({ variant: "destructive", title: "Falta info", description: "Completa nombre y características." })
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
      toast({ variant: "destructive", title: "Campos Requeridos", description: "Faltan datos básicos." });
      return;
    }

    const productsRef = collection(db, 'products');
    addDocumentNonBlocking(productsRef, {
      ...formData,
      price: parseFloat(formData.price),
      commissionRate: parseFloat(formData.commission),
      code: (formData.code || formData.name.substring(0, 3).toUpperCase() + Math.floor(Math.random() * 100)).toUpperCase(),
      videos: videos,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    toast({ title: "¡Producto Creado!", description: "El curso ya está en el catálogo." })
    setIsAdding(false)
    setFormData({ name: '', category: 'Course', code: '', price: '', commission: '', bankAccount: '', bankType: '', bankHolder: '', features: '', description: '', imageUrl: '' })
    setVideos([])
  }

  return (
    <DashboardShell role="admin">
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-headline font-black text-slate-900 tracking-tight">{t.productManagement}</h1>
            <p className="text-slate-500 font-medium">Gestiona tu academia digital y el material de ventas.</p>
          </div>
          
          <Dialog open={isAdding} onOpenChange={setIsAdding}>
            <DialogTrigger asChild>
              <Button size="lg" className="h-16 px-8 bg-primary rounded-2xl shadow-xl hover:scale-105 transition-all font-black text-xs uppercase tracking-widest">
                <Plus className="mr-2 h-5 w-5" /> {t.addProduct}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto rounded-[3rem] p-0 border-none">
              <div className="bg-slate-900 p-10 text-white">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary shadow-xl">
                    <GraduationCap className="h-6 w-6" />
                  </div>
                  <div>
                    <DialogTitle className="text-3xl font-headline font-black">Configurar Curso Premium</DialogTitle>
                    <DialogDescription className="text-slate-400 font-bold uppercase text-[10px] mt-1">Sube lecciones y material para afiliados</DialogDescription>
                  </div>
                </div>
              </div>
              
              <div className="p-10 bg-white grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* BASICS */}
                <div className="space-y-8">
                  <div className="space-y-6">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-3">1. General</h3>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-slate-500 uppercase">Nombre</Label>
                      <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="h-12 rounded-xl" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black text-slate-500 uppercase">Precio ($)</Label>
                        <Input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="h-12 rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black text-slate-500 uppercase">Comisión (%)</Label>
                        <Input type="number" value={formData.commission} onChange={e => setFormData({...formData, commission: e.target.value})} className="h-12 rounded-xl" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-3">2. Arte</h3>
                    <div className="relative h-40 w-full rounded-2xl bg-slate-50 border-2 border-dashed flex items-center justify-center overflow-hidden">
                      {formData.imageUrl ? <img src={formData.imageUrl} className="h-full w-full object-cover" /> : <ImageIcon className="text-slate-300" />}
                      <Button variant="secondary" size="sm" className="absolute bottom-2 right-2" onClick={() => fileInputRef.current?.click()}>Subir</Button>
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                  </div>
                </div>

                {/* ACADEMIA (UPDATED) */}
                <div className="space-y-8">
                  <h3 className="text-xs font-black text-primary uppercase tracking-widest border-b border-primary/10 pb-3 flex items-center gap-2">
                    <Video className="h-4 w-4" /> 3. Academia & Estrategia
                  </h3>
                  <div className="p-6 bg-slate-50 rounded-2xl space-y-4 border">
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black text-slate-400 uppercase">Título de la Lección</Label>
                      <Input value={newVideo.title} onChange={e => setNewVideo({...newVideo, title: e.target.value})} className="h-10 text-xs" />
                    </div>
                    
                    <div className="flex gap-2 p-1 bg-white rounded-xl border">
                      <Button 
                        variant="ghost" 
                        className={cn("flex-1 h-8 text-[9px] font-black", !newVideo.useLocalFile ? "bg-slate-900 text-white" : "")}
                        onClick={() => setNewVideo({...newVideo, useLocalFile: false})}
                      >LINK</Button>
                      <Button 
                        variant="ghost" 
                        className={cn("flex-1 h-8 text-[9px] font-black", newVideo.useLocalFile ? "bg-slate-900 text-white" : "")}
                        onClick={() => setNewVideo({...newVideo, useLocalFile: true})}
                      >ARCHIVO</Button>
                    </div>

                    {newVideo.useLocalFile ? (
                      <div className="space-y-3">
                        <Button 
                          variant="outline" 
                          className="w-full h-12 border-dashed border-2 gap-2 text-primary"
                          onClick={() => videoInputRef.current?.click()}
                          disabled={uploadProgress !== null}
                        >
                          {uploadProgress !== null ? <Loader2 className="animate-spin" /> : <Upload className="h-4 w-4" />}
                          {newVideo.url ? "VIDEO CARGADO" : "SUBIR DESDE MI PC"}
                        </Button>
                        <input type="file" ref={videoInputRef} onChange={handleVideoFileChange} accept="video/*" className="hidden" />
                        {uploadProgress !== null && (
                          <div className="space-y-1">
                            <Progress value={uploadProgress} className="h-1" />
                            <p className="text-[8px] font-black text-primary text-center uppercase">SUBIENDO: {Math.round(uploadProgress)}%</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <Input value={newVideo.url} onChange={e => setNewVideo({...newVideo, url: e.target.value})} placeholder="https://youtube.com/..." className="h-10 text-xs" />
                    )}

                    <Select value={newVideo.type} onValueChange={(v: any) => setNewVideo({...newVideo, type: v})}>
                      <SelectTrigger className="h-10 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="content">Para el Cliente</SelectItem>
                        <SelectItem value="training">Para el Afiliado</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={handleAddVideo} className="w-full h-10 text-[10px] font-black bg-primary text-white" disabled={uploadProgress !== null}>AÑADIR A LA LISTA</Button>
                  </div>

                  <div className="space-y-2 max-h-[250px] overflow-y-auto">
                    {videos.map((v) => (
                      <div key={v.id} className="flex items-center justify-between p-3 bg-white border rounded-xl shadow-sm">
                        <div className="flex items-center gap-3">
                          {v.isLocal ? <FileVideo className="h-4 w-4 text-blue-500" /> : <PlayCircle className="h-4 w-4 text-primary" />}
                          <div>
                            <p className="text-[10px] font-black text-slate-800 uppercase truncate max-w-[120px]">{v.title}</p>
                            <p className="text-[8px] font-bold text-slate-400">{v.type === 'content' ? 'CLIENTE' : 'AFILIADO'}</p>
                          </div>
                        </div>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400" onClick={() => setVideos(videos.filter(vi => vi.id !== v.id))}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* PAYOUT & IA */}
                <div className="space-y-8">
                  <div className="p-8 bg-primary/5 rounded-[2.5rem] border space-y-4">
                    <h3 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2"><Landmark className="h-4 w-4" /> Pago Admin</h3>
                    <Input value={formData.bankAccount} onChange={e => setFormData({...formData, bankAccount: e.target.value})} placeholder="Número de cuenta" className="h-12 bg-white" />
                    <Select onValueChange={v => setFormData({...formData, bankType: v})}>
                      <SelectTrigger className="h-12 bg-white"><SelectValue placeholder="Banco" /></SelectTrigger>
                      <SelectContent>{NICA_BANKS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                    </Select>
                    <Input value={formData.bankHolder} onChange={e => setFormData({...formData, bankHolder: e.target.value})} placeholder="Titular" className="h-12 bg-white" />
                  </div>
                  <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white space-y-4">
                    <h3 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2"><Sparkles className="h-4 w-4" /> Copy IA</h3>
                    <Input value={formData.features} onChange={e => setFormData({...formData, features: e.target.value})} placeholder="Ventajas..." className="bg-white/5 border-none ring-1 ring-white/10" />
                    <Button onClick={handleAIHelp} variant="outline" className="w-full h-14 border-primary text-primary font-black" disabled={generating}>{generating ? "ESCRIBIENDO..." : "GENERAR CON IA"}</Button>
                  </div>
                </div>
              </div>

              <div className="p-10 border-t bg-slate-50 flex flex-col gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase">Descripción de Venta</Label>
                  <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="min-h-[100px] rounded-2xl" />
                </div>
                <div className="flex gap-4">
                  <Button variant="ghost" onClick={() => setIsAdding(false)} className="flex-1 h-16 rounded-2xl font-black">CANCELAR</Button>
                  <Button className="flex-[2] h-16 rounded-2xl bg-slate-900 text-white font-black" onClick={handleSave}>PUBLICAR EN MARKETPLACE</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center py-32"><Loader2 className="animate-spin text-primary" /></div>
            ) : !products || products.length === 0 ? (
              <div className="text-center py-32 text-slate-400"><GraduationCap className="h-20 w-20 mx-auto mb-4 opacity-10" /><p className="font-black">Sin cursos publicados.</p></div>
            ) : (
              <Table>
                <TableHeader><TableRow className="bg-slate-50/50 h-20">
                  <TableHead className="px-10 font-black uppercase text-[10px]">Curso</TableHead>
                  <TableHead className="font-black uppercase text-[10px]">Precio</TableHead>
                  <TableHead className="font-black uppercase text-[10px]">Comisión</TableHead>
                  <TableHead className="font-black uppercase text-[10px]">Contenido</TableHead>
                  <TableHead className="px-10 text-right font-black uppercase text-[10px]">Acción</TableHead>
                </TableRow></TableHeader>
                <TableBody>{products.map((p) => (
                  <TableRow key={p.id} className="h-24 hover:bg-slate-50 transition-all border-b last:border-0 group">
                    <TableCell className="px-10">
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-xl bg-slate-100 overflow-hidden border">
                          {p.imageUrl ? <img src={p.imageUrl} className="h-full w-full object-cover" /> : <GraduationCap className="h-6 w-6 text-slate-300" />}
                        </div>
                        <span className="font-black text-slate-800 uppercase">{p.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-black text-xl">${p.price?.toFixed(2)}</TableCell>
                    <TableCell><span className="bg-green-50 text-green-600 font-black px-4 py-2 rounded-xl">{p.commissionRate}%</span></TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-slate-400 flex items-center gap-1 uppercase"><PlayCircle className="h-3 w-3" /> {p.videos?.filter((v:any) => v.type === 'content').length || 0} Clases</span>
                        <span className="text-[10px] font-black text-primary flex items-center gap-1 uppercase"><Target className="h-3 w-3" /> {p.videos?.filter((v:any) => v.type === 'training').length || 0} Tips</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-10 text-right">
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(p.id)}><Trash2 className="h-6 w-6" /></Button>
                    </TableCell>
                  </TableRow>
                ))}</TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}
