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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { PRODUCT_CATEGORIES, NICA_BANKS, PRODUCT_TYPES } from '@/lib/constants'
import { Plus, Trash2, Search, Loader2, Image as ImageIcon, Upload, GraduationCap, Sparkles, Package, Truck, CreditCard, Edit3, Save, X, Link as LinkIcon } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/components/language-context'
import { generateProductDescription } from '@/ai/flows/generate-product-description-flow'
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, useUser, initializeFirebase, updateDocumentNonBlocking } from '@/firebase'
import { collection, doc } from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface MarketingLink {
  label: string;
  url: string;
}

export default function AdminProductsPage() {
  const { toast } = useToast()
  const { t } = useLanguage()
  const db = useFirestore()
  const { user } = useUser()
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [imageProgress, setImageProgress] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  
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
    imageUrl: '',
    marketingLinks: [] as MarketingLink[]
  })

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
          imageUrl: p.imageUrl || '',
          marketingLinks: p.marketingLinks || []
        });
        setIsAdding(true);
      }
    }
  }, [editingId, products]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageProgress(0);
    try {
      const { storage } = initializeFirebase();
      const storageRef = ref(storage, `products/${Date.now()}_${file.name.replace(/\s+/g, '_')}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setImageProgress(progress);
        }, 
        (error) => {
          console.error("Upload error:", error);
          setImageProgress(null);
          toast({ variant: "destructive", title: "Error de Subida", description: "No se pudo cargar la imagen." });
        }, 
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            setFormData(prev => ({ ...prev, imageUrl: downloadURL }));
            toast({ title: "Imagen Cargada ✓" });
          } catch (err) {
            console.error("Error obteniendo URL:", err);
            toast({ variant: "destructive", title: "Error Final", description: "No se pudo obtener el enlace de la imagen." });
          } finally {
            setImageProgress(null);
          }
        }
      );
    } catch (err) {
      console.error("Firebase Storage init error:", err);
      setImageProgress(null);
      toast({ variant: "destructive", title: "Error Crítico", description: "No se pudo conectar con el servidor de archivos." });
    }
  };

  const handleAddLink = () => {
    setFormData(prev => ({
      ...prev,
      marketingLinks: [...prev.marketingLinks, { label: '', url: '' }]
    }));
  };

  const handleUpdateLink = (index: number, field: keyof MarketingLink, value: string) => {
    const updatedLinks = [...formData.marketingLinks];
    updatedLinks[index][field] = value;
    setFormData(prev => ({ ...prev, marketingLinks: updatedLinks }));
  };

  const handleRemoveLink = (index: number) => {
    setFormData(prev => ({
      ...prev,
      marketingLinks: prev.marketingLinks.filter((_, i) => i !== index)
    }));
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
      updatedAt: new Date().toISOString()
    };

    if (editingId && db) {
      updateDocumentNonBlocking(doc(db, 'products', editingId), productData);
      toast({ title: "Producto Actualizado" });
    } else if (db) {
      addDocumentNonBlocking(collection(db, 'products'), { ...productData, createdAt: new Date().toISOString() });
      toast({ title: "Producto Publicado" });
    }
    closeDialog();
  }

  const closeDialog = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({ name: '', type: 'Digital', category: 'Curso', code: '', price: '', commission: '', bankAccount: '', bankType: '', bankHolder: '', paymentLink: '', features: '', description: '', imageUrl: '', marketingLinks: [] });
    setImageProgress(null);
  }

  const handleDelete = (id: string) => {
    if(confirm("¿Seguro que quieres eliminar este producto?") && db) {
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
            <h1 className="text-3xl font-headline font-black text-slate-900 tracking-tight uppercase">Catálogo de <span className="text-slate-500">Productos</span></h1>
            <p className="text-slate-500 text-sm font-medium mt-1">Gestiona productos digitales y físicos para la red.</p>
          </div>
          <div className="flex gap-4">
             <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar..." className="pl-10 h-10 rounded-lg bg-white border-slate-200" />
             </div>
             <Button onClick={() => setIsAdding(true)} className="h-10 px-6 bg-slate-900 hover:bg-slate-800 rounded-lg font-black text-[10px] uppercase tracking-widest gap-2">
              <Plus className="h-4 w-4" /> NUEVO PRODUCTO
            </Button>
          </div>
        </div>

        <Dialog open={isAdding} onOpenChange={(open) => !open && closeDialog()}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl p-0 border-none shadow-2xl bg-white">
            <div className="bg-slate-900 p-6 text-white shrink-0 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-slate-800 rounded-lg flex items-center justify-center text-white border border-white/10">
                  {formData.type === 'Digital' ? <GraduationCap className="h-5 w-5" /> : <Package className="h-5 w-5" />}
                </div>
                <div>
                  <DialogTitle className="text-xl font-headline font-black uppercase">{editingId ? 'Editar Producto' : 'Nuevo Producto'}</DialogTitle>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="text-white/40 hover:text-white" onClick={closeDialog}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-slate-400 uppercase">Tipo</Label>
                      <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v})}>
                        <SelectTrigger className="h-10 bg-slate-50 border-slate-200 font-bold rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PRODUCT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-slate-400 uppercase">Categoría</Label>
                      <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})}>
                        <SelectTrigger className="h-10 bg-slate-50 border-slate-200 font-bold rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PRODUCT_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase">Nombre Comercial</Label>
                    <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="h-12 rounded-lg bg-slate-50 border-slate-200 font-bold" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-slate-400 uppercase">Precio ($)</Label>
                      <Input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="h-12 rounded-lg bg-slate-50 border-slate-200 font-black" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-slate-400 uppercase">Comisión (%)</Label>
                      <Input type="number" value={formData.commission} onChange={e => setFormData({...formData, commission: e.target.value})} className="h-12 rounded-lg bg-slate-50 border-slate-200 font-black text-green-600" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase">Imagen del Producto</Label>
                    <div className="relative h-48 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden transition-all hover:bg-slate-100 group">
                      {imageProgress !== null ? (
                        <div className="flex flex-col items-center gap-4 p-8 w-full">
                           <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                           <Progress value={imageProgress} className="h-2 w-full" />
                        </div>
                      ) : formData.imageUrl ? (
                        <div className="relative w-full h-full">
                          <img src={formData.imageUrl} className="w-full h-full object-cover" alt="preview" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                             <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>CAMBIAR</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center space-y-2 p-8 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                          <Upload className="h-6 w-6 text-slate-300 mx-auto" />
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Subir Imagen</p>
                        </div>
                      )}
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                  </div>
                </div>

                <div className="space-y-6">
                   <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                      <div className="flex items-center gap-2">
                        <LinkIcon className="h-4 w-4 text-slate-900" />
                        <h3 className="text-[10px] font-black uppercase text-slate-900">Links de Publicidad (Marketing)</h3>
                      </div>
                      <div className="space-y-3">
                        {formData.marketingLinks.map((link, idx) => (
                          <div key={idx} className="flex gap-2 items-start bg-white p-3 rounded-lg border">
                            <div className="flex-1 space-y-2">
                              <Input 
                                placeholder="Nombre (Ej: Video de Venta)" 
                                value={link.label} 
                                onChange={e => handleUpdateLink(idx, 'label', e.target.value)}
                                className="h-8 text-[10px] font-bold"
                              />
                              <Input 
                                placeholder="https://..." 
                                value={link.url} 
                                onChange={e => handleUpdateLink(idx, 'url', e.target.value)}
                                className="h-8 text-[10px] font-mono"
                              />
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400" onClick={() => handleRemoveLink(idx)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button onClick={handleAddLink} variant="outline" className="w-full h-10 border-dashed border-2 text-[9px] font-black uppercase tracking-widest">
                          <Plus className="h-3 w-3 mr-2" /> AGREGAR LINK PUBLICITARIO
                        </Button>
                      </div>
                   </div>

                   <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-slate-900" />
                        <h3 className="text-[10px] font-black uppercase text-slate-900">Descripción IA</h3>
                      </div>
                      <Input value={formData.features} onChange={e => setFormData({...formData, features: e.target.value})} placeholder="Características clave..." className="bg-white text-xs h-10" />
                      <Button onClick={handleAIHelp} variant="outline" className="w-full h-10 text-[9px] font-black uppercase" disabled={generating}>
                        {generating ? "ESCRIBIENDO..." : "REDACTAR CON IA"}
                      </Button>
                      <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="min-h-[100px] text-xs" />
                   </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="ghost" onClick={closeDialog} className="font-black text-[10px] uppercase">CANCELAR</Button>
                <Button className="h-12 px-10 rounded-lg bg-slate-900 text-white font-black text-[10px] uppercase shadow-xl" onClick={handleSave} disabled={imageProgress !== null}>
                  <Save className="h-4 w-4 mr-2" /> {editingId ? 'GUARDAR CAMBIOS' : 'PUBLICAR PRODUCTO'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Card className="border-none shadow-sm rounded-xl overflow-hidden bg-white ring-1 ring-slate-100">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="animate-spin text-slate-200" /></div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 h-14">
                      <TableHead className="px-6 font-black uppercase text-[10px] text-slate-400">Producto</TableHead>
                      <TableHead className="font-black uppercase text-[10px] text-slate-400">Tipo</TableHead>
                      <TableHead className="font-black uppercase text-[10px] text-slate-400">Precio</TableHead>
                      <TableHead className="font-black uppercase text-[10px] text-slate-400">Comisión</TableHead>
                      <TableHead className="px-6 text-right font-black uppercase text-[10px] text-slate-400">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((p) => (
                      <TableRow key={p.id} className="h-16 border-b last:border-0 hover:bg-slate-50/50 transition-colors">
                        <TableCell className="px-6">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                              {p.imageUrl ? <img src={p.imageUrl} className="h-full w-full object-cover" alt="" /> : <Package className="h-4 w-4 text-slate-300 m-auto mt-2" />}
                            </div>
                            <span className="font-bold text-xs uppercase text-slate-800 truncate max-w-[150px]">{p.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[8px] font-black uppercase rounded-sm border-slate-200 bg-slate-50 text-slate-500">
                            {p.type || 'Digital'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-black text-xs text-slate-900">${p.price?.toFixed(2)}</TableCell>
                        <TableCell className="font-black text-xs text-green-600">{p.commissionRate}%</TableCell>
                        <TableCell className="px-6 text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900" onClick={() => setEditingId(p.id)}><Edit3 className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-red-500" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4" /></Button>
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
