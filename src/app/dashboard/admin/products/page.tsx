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
import { PRODUCT_CATEGORIES, PRODUCT_TYPES } from '@/lib/constants'
import { Plus, Trash2, Search, Loader2, Upload, GraduationCap, Sparkles, Package, Edit3, Save, X, Link as LinkIcon } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/components/language-context'
import { generateProductDescription } from '@/ai/flows/generate-product-description-flow'
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, useUser, initializeFirebase, updateDocumentNonBlocking } from '@/firebase'
import { collection, doc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { Badge } from '@/components/ui/badge'

interface MarketingLink {
  label: string;
  url: string;
}

export default function AdminProductsPage() {
  const { toast } = useToast()
  const db = useFirestore()
  const { user } = useUser()
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
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

    if (file.size > 10 * 1024 * 1024) {
      toast({ variant: "destructive", title: "Archivo muy pesado", description: "Máximo 10MB permitido." });
      return;
    }

    setUploadingImage(true);
    try {
      const { storage } = initializeFirebase();
      const fileName = `products/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      const storageRef = ref(storage, fileName);
      
      const result = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(result.ref);
      
      setFormData(prev => ({ ...prev, imageUrl: downloadURL }));
      toast({ title: "Imagen Cargada ✓" });
    } catch (err) {
      console.error("Upload error:", err);
      toast({ variant: "destructive", title: "Error de Subida", description: "Fallo en la conexión con el servidor." });
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

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
    setFormData({ name: '', type: 'Digital', category: 'Curso', code: '', price: '', commission: '', paymentLink: '', features: '', description: '', imageUrl: '', marketingLinks: [] });
    setUploadingImage(false);
  }

  const handleDelete = (id: string) => {
    if(confirm("¿Seguro que quieres eliminar este producto?") && db) {
      deleteDocumentNonBlocking(doc(db, 'products', id));
      toast({ title: "Producto eliminado" });
    }
  }

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
                      {uploadingImage ? (
                        <div className="flex flex-col items-center gap-4 p-8 w-full bg-white/80 backdrop-blur-sm z-20">
                           <Loader2 className="h-10 w-10 animate-spin text-primary" />
                           <p className="text-[11px] font-black uppercase text-slate-500 tracking-widest animate-pulse">Subiendo Archivo...</p>
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
                        <Sparkles className="h-4 w-4 text-slate-900" />
                        <h3 className="text-[10px] font-black uppercase text-slate-900">Descripción IA</h3>
                      </div>
                      <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="min-h-[150px] text-xs" />
                   </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="ghost" onClick={closeDialog} className="font-black text-[10px] uppercase">CANCELAR</Button>
                <Button className="h-12 px-10 rounded-lg bg-slate-900 text-white font-black text-[10px] uppercase shadow-xl" onClick={handleSave} disabled={uploadingImage}>
                  <Save className="h-4 w-4 mr-2" /> {editingId ? 'GUARDAR CAMBIOS' : 'PUBLICA PRODUCTO'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* ... Tabla de productos (permanece igual) ... */}
        <Card className="border-none shadow-sm rounded-xl overflow-hidden bg-white ring-1 ring-slate-100">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 h-14">
                    <TableHead className="px-6 font-black uppercase text-[10px] text-slate-400">Producto</TableHead>
                    <TableHead className="font-black uppercase text-[10px] text-slate-400">Precio</TableHead>
                    <TableHead className="font-black uppercase text-[10px] text-slate-400">Comisión</TableHead>
                    <TableHead className="px-6 text-right font-black uppercase text-[10px] text-slate-400">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(products || []).filter(p => p.name?.toLowerCase().includes(searchTerm.toLowerCase())).map((p) => (
                    <TableRow key={p.id} className="h-16 border-b last:border-0 hover:bg-slate-50/50 transition-colors">
                      <TableCell className="px-6">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                            {p.imageUrl ? <img src={p.imageUrl} className="h-full w-full object-cover" alt="" /> : <Package className="h-4 w-4 text-slate-300 m-auto mt-2" />}
                          </div>
                          <span className="font-bold text-xs uppercase text-slate-800 truncate max-w-[200px]">{p.name}</span>
                        </div>
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
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}
