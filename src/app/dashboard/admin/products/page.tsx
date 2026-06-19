"use client"

import { useState, useEffect } from 'react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Trash2, Search, Loader2, GraduationCap, Sparkles, Package, Edit3, Save, X, Link as LinkIcon, Image as ImageIcon } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, useUser, updateDocumentNonBlocking } from '@/firebase'
import { collection, doc } from 'firebase/firestore'

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
  const [searchTerm, setSearchTerm] = useState('')
  
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

  const handleSave = () => {
    if (!formData.name || !formData.price || !formData.commission || !formData.imageUrl) {
      toast({ variant: "destructive", title: "Campos Requeridos", description: "Por favor completa el nombre, precio, comisión y link de imagen." });
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
      toast({ title: "Producto Actualizado ✓" });
    } else if (db) {
      addDocumentNonBlocking(collection(db, 'products'), { ...productData, createdAt: new Date().toISOString() });
      toast({ title: "Producto Publicado ✓" });
    }
    closeDialog();
  }

  const closeDialog = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({ name: '', type: 'Digital', category: 'Curso', code: '', price: '', commission: '', paymentLink: '', features: '', description: '', imageUrl: '', marketingLinks: [] });
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
            <h1 className="text-3xl font-headline font-black text-slate-900 tracking-tight uppercase italic">Catálogo de <span className="text-primary">Productos</span></h1>
            <p className="text-slate-500 text-sm font-medium mt-1">Gestiona productos digitales y físicos para la red mediante links directos.</p>
          </div>
          <div className="flex gap-4">
             <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar..." className="pl-10 h-10 rounded-lg bg-white border-slate-200" />
             </div>
             <Button onClick={() => setIsAdding(true)} className="h-10 px-6 bg-slate-900 hover:bg-slate-800 rounded-lg font-black text-[10px] uppercase tracking-widest gap-2 shadow-xl">
              <Plus className="h-4 w-4" /> NUEVO PRODUCTO
            </Button>
          </div>
        </div>

        <Dialog open={isAdding} onOpenChange={(open) => !open && closeDialog()}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl p-0 border-none shadow-2xl bg-white">
            <div className="bg-slate-900 p-8 text-white shrink-0 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-slate-800 rounded-xl flex items-center justify-center text-white border border-white/10 shadow-inner">
                  {formData.type === 'Digital' ? <GraduationCap className="h-6 w-6 text-primary" /> : <Package className="h-6 w-6 text-primary" />}
                </div>
                <div>
                  <DialogTitle className="text-2xl font-headline font-black uppercase italic tracking-tight">{editingId ? 'Editar Producto' : 'Nuevo Producto'}</DialogTitle>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Configuración de activo comercial</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="text-white/40 hover:text-white rounded-full" onClick={closeDialog}>
                <X className="h-6 w-6" />
              </Button>
            </div>
            
            <div className="p-10 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-8">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Comercial</Label>
                    <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="h-14 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-primary font-bold px-6" placeholder="Ej: Curso de Marketing Pro" />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Precio ($)</Label>
                      <Input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="h-14 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-primary font-black px-6" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Comisión (%)</Label>
                      <Input type="number" value={formData.commission} onChange={e => setFormData({...formData, commission: e.target.value})} className="h-14 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-primary font-black text-green-600 px-6" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Imagen del Producto (URL)</Label>
                    <div className="relative">
                      <ImageIcon className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                      <Input 
                        value={formData.imageUrl} 
                        onChange={e => setFormData({...formData, imageUrl: e.target.value})} 
                        className="h-14 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-primary font-bold pl-14 pr-6" 
                        placeholder="https://link-de-tu-imagen.com/foto.jpg"
                      />
                    </div>
                    
                    {formData.imageUrl && (
                      <div className="mt-4 p-2 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 overflow-hidden aspect-video relative group">
                        <img src={formData.imageUrl} className="w-full h-full object-cover rounded-[1.5rem]" alt="preview" onError={(e) => (e.currentTarget.src = "https://picsum.photos/seed/error/600/400")} />
                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                           <p className="text-white font-black text-[10px] uppercase">Vista Previa del Activo</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Link de Pago Seguro (Pocket/Directo)</Label>
                    <div className="relative">
                      <LinkIcon className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                      <Input value={formData.paymentLink} onChange={e => setFormData({...formData, paymentLink: e.target.value})} className="h-14 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 font-bold pl-14 pr-6" placeholder="https://checkout..." />
                    </div>
                  </div>

                  <div className="p-8 bg-slate-900 rounded-[2.5rem] space-y-6 shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-6 opacity-10"><Sparkles className="h-20 w-20 text-primary" /></div>
                      <div className="flex items-center gap-3 relative z-10">
                        <Sparkles className="h-5 w-5 text-primary" />
                        <h3 className="text-sm font-black uppercase text-white tracking-widest italic">Descripción Estratégica</h3>
                      </div>
                      <Textarea 
                        value={formData.description} 
                        onChange={e => setFormData({...formData, description: e.target.value})} 
                        className="min-h-[180px] bg-white/5 border-none ring-1 ring-white/10 text-white text-xs leading-relaxed focus:ring-primary rounded-2xl p-6 relative z-10" 
                        placeholder="Escribe los beneficios clave que verá el cliente..."
                      />
                   </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-8 border-t">
                <Button variant="ghost" onClick={closeDialog} className="h-14 px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50">CANCELAR</Button>
                <Button className="h-14 px-12 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-[0.2em] shadow-2xl gap-3 transition-all active:scale-95" onClick={handleSave}>
                  <Save className="h-5 w-5 text-primary" /> {editingId ? 'GUARDAR CAMBIOS' : 'PUBLICAR PRODUCTO'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white ring-1 ring-slate-100">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50 h-20">
                    <TableHead className="px-10 font-black uppercase text-[10px] tracking-widest text-slate-400">Producto / Activo</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400">Precio de Venta</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400">Comisión Socio</TableHead>
                    <TableHead className="px-10 text-right font-black uppercase text-[10px] tracking-widest text-slate-400">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={4} className="h-40 text-center"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" /></TableCell></TableRow>
                  ) : products?.filter(p => p.name?.toLowerCase().includes(searchTerm.toLowerCase())).map((p) => (
                    <TableRow key={p.id} className="h-24 border-b last:border-0 hover:bg-slate-50/30 transition-colors group">
                      <TableCell className="px-10">
                        <div className="flex items-center gap-5">
                          <div className="h-14 w-14 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border-2 border-white shadow-lg group-hover:rotate-2 transition-transform">
                            {p.imageUrl ? <img src={p.imageUrl} className="h-full w-full object-cover" alt="" /> : <Package className="h-6 w-6 text-slate-300 m-auto mt-4" />}
                          </div>
                          <div>
                            <span className="font-black text-sm uppercase text-slate-900 block truncate max-w-[250px]">{p.name}</span>
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{p.code}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-black text-sm text-slate-900">${p.price?.toFixed(2)}</TableCell>
                      <TableCell className="font-black text-sm text-green-600">%{p.commissionRate}</TableCell>
                      <TableCell className="px-10 text-right">
                        <div className="flex justify-end gap-3">
                          <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl text-slate-400 hover:text-slate-900 hover:bg-slate-100" onClick={() => setEditingId(p.id)}><Edit3 className="h-5 w-5" /></Button>
                          <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl text-red-200 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(p.id)}><Trash2 className="h-5 w-5" /></Button>
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
