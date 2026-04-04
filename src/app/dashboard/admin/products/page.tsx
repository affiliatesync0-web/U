
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
import { PRODUCT_CATEGORIES, NICA_BANKS } from '@/lib/constants'
import { Plus, Trash2, Wand2, Search, Loader2, Landmark, Image as ImageIcon, Upload, GraduationCap, Sparkles, Video, PlayCircle, Target, Users } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/components/language-context'
import { generateProductDescription } from '@/ai/flows/generate-product-description-flow'
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, useUser } from '@/firebase'
import { collection, doc } from 'firebase/firestore'

interface VideoItem {
  id: string;
  title: string;
  url: string;
  type: 'content' | 'training'; // content = para el cliente, training = para el afiliado
}

export default function AdminProductsPage() {
  const { toast } = useToast()
  const { t } = useLanguage()
  const db = useFirestore()
  const { user, isUserLoading } = useUser()
  const [isAdding, setIsAdding] = useState(false)
  const [generating, setGenerating] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
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
  const [newVideo, setNewVideo] = useState({ title: '', url: '', type: 'content' as 'content' | 'training' })

  const handleAddVideo = () => {
    if (!newVideo.title || !newVideo.url) return;
    setVideos([...videos, { ...newVideo, id: Math.random().toString(36).substr(2, 9) }]);
    setNewVideo({ title: '', url: '', type: 'content' });
  };

  const removeVideo = (id: string) => {
    setVideos(videos.filter(v => v.id !== id));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 800000) {
        alert("La imagen es demasiado grande. Máximo 800KB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAIHelp = async () => {
    if (!formData.name || !formData.category || !formData.features) {
      toast({
        variant: "destructive",
        title: "Información faltante",
        description: "Por favor, ingresa el nombre, categoría y características principales para que la IA pueda redactar."
      })
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
      toast({
        title: "¡Copiado de Ventas Generado!",
        description: "La IA ha creado una descripción persuasiva para tu curso."
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error en IA",
        description: "No se pudo generar la descripción en este momento."
      })
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = () => {
    if (!db) return;
    if (!formData.name || !formData.price || !formData.commission || !formData.bankAccount) {
      toast({ variant: "destructive", title: "Campos Requeridos", description: "Asegúrate de completar el nombre, precio, comisión y datos bancarios." });
      return;
    }

    const productsRef = collection(db, 'products');
    
    const productToSave = {
      name: formData.name,
      category: formData.category,
      code: (formData.code || formData.name.substring(0, 3).toUpperCase() + Math.floor(Math.random() * 100)).toUpperCase(),
      price: parseFloat(formData.price),
      commissionRate: parseFloat(formData.commission),
      payoutBankAccountNumber: formData.bankAccount,
      payoutBankId: formData.bankType,
      payoutBankAccountHolderName: formData.bankHolder,
      description: formData.description,
      imageUrl: formData.imageUrl,
      videos: videos, // Guardamos los videos del curso y entrenamiento
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    addDocumentNonBlocking(productsRef, productToSave);

    toast({ title: "¡Producto Creado!", description: `El curso "${formData.name}" ya está disponible para tus afiliados.` })
    setIsAdding(false)
    setFormData({
      name: '', category: 'Course', code: '', price: '', commission: '', bankAccount: '', bankType: '', bankHolder: '', features: '', description: '', imageUrl: ''
    })
    setVideos([])
  }

  const handleDelete = (id: string) => {
    if (!db) return;
    const productRef = doc(db, 'products', id);
    deleteDocumentNonBlocking(productRef);
    toast({ title: "Producto eliminado", description: "El curso ha sido removido del catálogo." });
  }

  return (
    <DashboardShell role="admin">
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-headline font-black text-slate-900 tracking-tight">{t.productManagement}</h1>
            <p className="text-slate-500 font-medium">Configura tus cursos digitales, servicios y comisiones para la red.</p>
          </div>
          
          <Dialog open={isAdding} onOpenChange={setIsAdding}>
            <DialogTrigger asChild>
              <Button size="lg" className="h-16 px-8 bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-2xl shadow-primary/20 transition-all hover:scale-105">
                <Plus className="mr-2 h-5 w-5" /> {t.addProduct}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto rounded-[3rem] p-0 border-none shadow-2xl">
              <div className="bg-slate-900 p-10 text-white">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary shadow-xl">
                    <GraduationCap className="h-6 w-6" />
                  </div>
                  <DialogHeader>
                    <DialogTitle className="text-3xl font-headline font-black text-white tracking-tight">Nuevo Curso o Producto</DialogTitle>
                    <DialogDescription className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Define las reglas de venta y contenido educativo</DialogDescription>
                  </DialogHeader>
                </div>
              </div>
              
              <div className="p-10 bg-white">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                  {/* Columna 1: Datos Básicos */}
                  <div className="space-y-8">
                    <div className="space-y-6">
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] border-b pb-3">1. Datos del Curso</h3>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-500 ml-1">{t.productName}</Label>
                        <Input 
                          value={formData.name} 
                          onChange={e => setFormData({...formData, name: e.target.value})} 
                          placeholder="Ej: Master en Marketing Digital" 
                          className="h-12 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 font-bold"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-slate-500 ml-1">Precio ($)</Label>
                          <Input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="h-12 rounded-xl font-black text-primary" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-slate-500 ml-1">Comisión (%)</Label>
                          <Input type="number" value={formData.commission} onChange={e => setFormData({...formData, commission: e.target.value})} className="h-12 rounded-xl font-black text-green-600" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] border-b pb-3">2. Arte del Producto</h3>
                      <div className="relative h-40 w-full rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden">
                        {formData.imageUrl ? (
                          <img src={formData.imageUrl} className="h-full w-full object-cover" alt="" />
                        ) : (
                          <ImageIcon className="h-10 w-10 text-slate-300" />
                        )}
                        <Button variant="secondary" size="sm" className="absolute bottom-2 right-2" onClick={() => fileInputRef.current?.click()}>
                          Subir
                        </Button>
                      </div>
                      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                    </div>
                  </div>

                  {/* Columna 2: Academia y Entrenamiento (LO NUEVO) */}
                  <div className="space-y-8">
                    <div className="space-y-6">
                      <h3 className="text-xs font-black text-primary uppercase tracking-[0.2em] border-b border-primary/10 pb-3 flex items-center gap-2">
                        <Video className="h-4 w-4" /> 3. Academia & Estrategia
                      </h3>
                      
                      <div className="p-6 bg-slate-50 rounded-2xl space-y-4 border border-slate-100">
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase text-slate-400">Título de la Lección</Label>
                          <Input value={newVideo.title} onChange={e => setNewVideo({...newVideo, title: e.target.value})} placeholder="Ej: Introducción al Marketing" className="h-10 text-xs" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase text-slate-400">Enlace (YouTube/Drive)</Label>
                          <Input value={newVideo.url} onChange={e => setNewVideo({...newVideo, url: e.target.value})} placeholder="https://..." className="h-10 text-xs" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase text-slate-400">¿Para quién es?</Label>
                          <Select value={newVideo.type} onValueChange={(v: any) => setNewVideo({...newVideo, type: v})}>
                            <SelectTrigger className="h-10 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="content">Lección del Curso (Para el Cliente)</SelectItem>
                              <SelectItem value="training">Estrategia de Venta (Para el Afiliado)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button onClick={handleAddVideo} variant="outline" className="w-full h-10 text-[10px] font-black uppercase tracking-widest border-primary text-primary hover:bg-primary hover:text-white">
                          AÑADIR VIDEO
                        </Button>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">Videos Añadidos:</Label>
                        <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2">
                          {videos.length === 0 && <p className="text-[10px] text-slate-400 italic text-center py-4">No hay videos todavía.</p>}
                          {videos.map((v) => (
                            <div key={v.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm group">
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "h-8 w-8 rounded-lg flex items-center justify-center",
                                  v.type === 'content' ? "bg-blue-50 text-blue-500" : "bg-primary/10 text-primary"
                                )}>
                                  {v.type === 'content' ? <PlayCircle className="h-4 w-4" /> : <Target className="h-4 w-4" />}
                                </div>
                                <div>
                                  <p className="text-[10px] font-black text-slate-800 uppercase line-clamp-1">{v.title}</p>
                                  <p className="text-[8px] font-bold text-slate-400">{v.type === 'content' ? 'CLIENTE' : 'AFILIADO'}</p>
                                </div>
                              </div>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 opacity-0 group-hover:opacity-100 transition-all" onClick={() => removeVideo(v.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Columna 3: Recaudación e IA */}
                  <div className="space-y-8">
                    <div className="space-y-6 p-8 bg-primary/5 rounded-[2.5rem] border border-primary/10">
                      <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2">
                        <Landmark className="h-4 w-4" /> Datos de Pago
                      </h3>
                      <div className="space-y-4">
                        <Input value={formData.bankAccount} onChange={e => setFormData({...formData, bankAccount: e.target.value})} placeholder="Número de cuenta" className="h-12 rounded-xl bg-white" />
                        <Select onValueChange={v => setFormData({...formData, bankType: v})}>
                          <SelectTrigger className="h-12 bg-white"><SelectValue placeholder="Banco" /></SelectTrigger>
                          <SelectContent>{NICA_BANKS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                        </Select>
                        <Input value={formData.bankHolder} onChange={e => setFormData({...formData, bankHolder: e.target.value})} placeholder="Titular" className="h-12 rounded-xl bg-white" />
                      </div>
                    </div>

                    <div className="space-y-6 p-8 bg-slate-900 rounded-[2.5rem] text-white">
                      <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2">
                        <Sparkles className="h-4 w-4" /> Copywriting IA
                      </h3>
                      <div className="space-y-4">
                        <Input value={formData.features} onChange={e => setFormData({...formData, features: e.target.value})} placeholder="Características clave..." className="h-12 rounded-xl bg-white/5 border-none ring-1 ring-white/10" />
                        <Button onClick={handleAIHelp} variant="outline" className="w-full h-14 border-primary text-primary" disabled={generating}>
                          {generating ? "PENSANDO..." : "GENERAR CON IA"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-10 space-y-3">
                  <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Descripción de Ventas</Label>
                  <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="min-h-[120px] rounded-[2rem] p-6 text-sm" />
                </div>

                <div className="mt-12 flex gap-4">
                  <Button variant="ghost" onClick={() => setIsAdding(false)} className="flex-1 h-16 rounded-2xl font-black">CANCELAR</Button>
                  <Button className="flex-[2] h-16 rounded-2xl bg-slate-900 text-white font-black" onClick={handleSave}>PUBLICAR CURSO</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden ring-1 ring-slate-100">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center py-32"><Loader2 className="animate-spin h-12 w-12 text-primary opacity-50" /></div>
            ) : !products || products.length === 0 ? (
              <div className="text-center py-32 text-slate-400">
                <GraduationCap className="h-20 w-20 mx-auto mb-6 opacity-10" />
                <p className="font-black uppercase text-xs tracking-widest">No hay cursos publicados.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/30 h-20 border-b border-slate-100">
                      <TableHead className="px-10 font-black uppercase text-[10px] tracking-widest text-slate-400">Código</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400">Curso</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400">Precio</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400">Comisión</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400">Lecciones</TableHead>
                      <TableHead className="px-10 text-right font-black uppercase text-[10px] tracking-widest text-slate-400">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((p) => (
                      <TableRow key={p.id} className="h-24 border-b border-slate-50 last:border-0 group">
                        <TableCell className="px-10 font-mono font-black text-sm text-primary">{p.code}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-5">
                            <div className="h-14 w-14 rounded-2xl bg-slate-100 flex-shrink-0 overflow-hidden border border-slate-200">
                              {p.imageUrl ? <img src={p.imageUrl} className="h-full w-full object-cover" alt="" /> : <GraduationCap className="h-6 w-6 text-slate-300" />}
                            </div>
                            <span className="font-black text-slate-800 text-lg tracking-tight uppercase line-clamp-1">{p.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-black text-slate-900 text-xl tracking-tighter">${p.price?.toFixed(2)}</TableCell>
                        <TableCell><span className="bg-green-50 text-green-600 font-black px-4 py-2 rounded-xl">{p.commissionRate}%</span></TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1"><PlayCircle className="h-3 w-3" /> {p.videos?.filter((v:any) => v.type === 'content').length || 0} Clases</span>
                            <span className="text-[10px] font-black text-primary uppercase flex items-center gap-1"><Target className="h-3 w-3" /> {p.videos?.filter((v:any) => v.type === 'training').length || 0} Tips Ventas</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-10 text-right">
                          <Button variant="ghost" size="icon" className="h-12 w-12 text-destructive hover:bg-destructive/10 rounded-2xl" onClick={() => handleDelete(p.id)}>
                            <Trash2 className="h-6 w-6" />
                          </Button>
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
