
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
import { Plus, Trash2, Wand2, Search, Loader2, Landmark, Image as ImageIcon, Upload, GraduationCap, Sparkles } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/components/language-context'
import { generateProductDescription } from '@/ai/flows/generate-product-description-flow'
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, useUser } from '@/firebase'
import { collection, doc } from 'firebase/firestore'

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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    addDocumentNonBlocking(productsRef, productToSave);

    toast({ title: "¡Producto Creado!", description: `El curso "${formData.name}" ya está disponible para tus afiliados.` })
    setIsAdding(false)
    setFormData({
      name: '', category: 'Course', code: '', price: '', commission: '', bankAccount: '', bankType: '', bankHolder: '', features: '', description: '', imageUrl: ''
    })
  }

  const handleDelete = (id: string) => {
    if (!db) return;
    const productRef = doc(db, 'products', id);
    deleteDocumentNonBlocking(productRef);
    toast({ title: "Producto eliminado", description: "El curso ha sido removido del catálogo." });
  }

  if (isUserLoading) {
    return (
      <DashboardShell role="admin">
        <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
      </DashboardShell>
    )
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
            <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto rounded-[3rem] p-0 border-none shadow-2xl">
              <div className="bg-slate-900 p-10 text-white">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary shadow-xl">
                    <GraduationCap className="h-6 w-6" />
                  </div>
                  <DialogHeader>
                    <DialogTitle className="text-3xl font-headline font-black text-white tracking-tight">Nuevo Curso o Producto</DialogTitle>
                    <DialogDescription className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Define las reglas de venta y ganancias</DialogDescription>
                  </DialogHeader>
                </div>
              </div>
              
              <div className="p-10 bg-white">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-8">
                    <div className="space-y-6">
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] border-b pb-3">1. Datos del Curso</h3>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-500 ml-1">{t.productName}</Label>
                        <Input 
                          value={formData.name} 
                          onChange={e => setFormData({...formData, name: e.target.value})} 
                          placeholder="Ej: Master en Marketing Digital 2024" 
                          className="h-12 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-primary/20 font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-500 ml-1">{t.category}</Label>
                        <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})}>
                          <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200">
                            <SelectValue placeholder="Selecciona tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            {PRODUCT_CATEGORIES.map(c => <SelectItem key={c} value={c} className="font-bold">{c}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-slate-500 ml-1">Precio Venta ($)</Label>
                          <Input 
                            type="number" 
                            value={formData.price} 
                            onChange={e => setFormData({...formData, price: e.target.value})} 
                            placeholder="49.99" 
                            className="h-12 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 font-black text-primary"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-slate-500 ml-1">Comisión Afiliado (%)</Label>
                          <Input 
                            type="number" 
                            value={formData.commission} 
                            onChange={e => setFormData({...formData, commission: e.target.value})} 
                            placeholder="50" 
                            className="h-12 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 font-black text-green-600"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] border-b pb-3">2. Identidad Visual</h3>
                      <div className="flex flex-col gap-4">
                        <div className="relative h-48 w-full rounded-[2rem] bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden group">
                          {formData.imageUrl ? (
                            <img src={formData.imageUrl} className="h-full w-full object-cover" alt="Preview" />
                          ) : (
                            <div className="flex flex-col items-center gap-3 text-slate-300">
                              <ImageIcon className="h-12 w-12 opacity-50" />
                              <span className="text-[9px] font-black uppercase tracking-widest">Previsualización del Arte</span>
                            </div>
                          )}
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            className="absolute bottom-4 right-4 font-black text-[10px] uppercase tracking-widest rounded-xl shadow-xl transition-all active:scale-95"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Upload className="h-3 w-3 mr-2" /> Subir Imagen
                          </Button>
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                        <Input 
                          value={formData.imageUrl.startsWith('data:') ? 'Archivo local seleccionado' : formData.imageUrl} 
                          onChange={e => setFormData({...formData, imageUrl: e.target.value})} 
                          placeholder="O pega una URL de Unsplash/Google Drive" 
                          className="h-10 rounded-xl text-[10px] font-bold bg-slate-50/50"
                          disabled={formData.imageUrl.startsWith('data:')}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="space-y-6 p-8 bg-primary/5 rounded-[2.5rem] border border-primary/10 shadow-inner">
                      <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2">
                        <Landmark className="h-4 w-4" /> Datos de Recaudación
                      </h3>
                      <div className="space-y-4">
                         <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">Cuenta para el Pago del Cliente</Label>
                          <Input 
                            value={formData.bankAccount} 
                            onChange={e => setFormData({...formData, bankAccount: e.target.value})} 
                            placeholder="Número de cuenta" 
                            className="h-12 rounded-xl bg-white border-none ring-1 ring-slate-200 font-mono font-bold text-primary"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">Banco</Label>
                          <Select onValueChange={v => setFormData({...formData, bankType: v})}>
                            <SelectTrigger className="h-12 rounded-xl bg-white border-none ring-1 ring-slate-200 font-bold">
                              <SelectValue placeholder="Selecciona el banco" />
                            </SelectTrigger>
                            <SelectContent>
                              {NICA_BANKS.map(b => <SelectItem key={b} value={b} className="font-bold">{b}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">Titular de la Cuenta</Label>
                          <Input 
                            value={formData.bankHolder} 
                            onChange={e => setFormData({...formData, bankHolder: e.target.value})} 
                            placeholder="Nombre completo" 
                            className="h-12 rounded-xl bg-white border-none ring-1 ring-slate-200 font-bold"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6 p-8 bg-slate-900 rounded-[2.5rem] text-white">
                      <div className="flex items-center justify-between">
                        <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2">
                          <Sparkles className="h-4 w-4" /> Generador de Ventas IA
                        </h3>
                        {generating && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase text-slate-500 ml-1">Características (Separa por comas)</Label>
                          <Input 
                            value={formData.features} 
                            onChange={e => setFormData({...formData, features: e.target.value})} 
                            placeholder="Ej: Clases grabadas, Soporte 24/7, Certificado" 
                            className="h-12 rounded-xl bg-white/5 border-none ring-1 ring-white/10 text-white font-bold"
                          />
                        </div>
                        <Button 
                          onClick={handleAIHelp} 
                          type="button" 
                          variant="outline" 
                          className="w-full h-14 border-primary text-primary hover:bg-primary hover:text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all"
                          disabled={generating}
                        >
                          {generating ? "REDAPTANDO..." : "GENERAR DESCRIPCIÓN CON IA"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-10 space-y-3">
                  <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Descripción de Ventas (Copywriting)</Label>
                  <Textarea 
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})} 
                    placeholder="La descripción persuasiva para tus afiliados aparecerá aquí..." 
                    className="min-h-[180px] bg-slate-50 rounded-[2rem] border-none ring-1 ring-slate-100 p-8 text-sm font-medium leading-relaxed"
                  />
                </div>

                <div className="mt-12 flex flex-col md:flex-row gap-4">
                  <Button variant="ghost" onClick={() => setIsAdding(false)} className="h-16 px-10 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 flex-1">DESCARTAR</Button>
                  <Button className="h-16 px-12 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest shadow-2xl flex-[2] transition-all active:scale-95" onClick={handleSave}>PUBLICAR EN MARKETPLACE</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden ring-1 ring-slate-100">
          <CardHeader className="bg-slate-50/50 border-b p-10 flex flex-row items-center justify-between">
             <div className="space-y-1">
                <CardTitle className="text-2xl font-headline font-black text-slate-900 tracking-tight">Catálogo de Cursos</CardTitle>
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Gestión de inventario digital</p>
             </div>
             <div className="relative w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                <Input className="pl-12 h-14 rounded-2xl bg-white border-none ring-1 ring-slate-100 font-bold" placeholder="Buscar curso..." />
             </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center py-32"><Loader2 className="animate-spin h-12 w-12 text-primary opacity-50" /></div>
            ) : !products || products.length === 0 ? (
              <div className="text-center py-32 text-slate-400">
                <GraduationCap className="h-20 w-20 mx-auto mb-6 opacity-10" />
                <p className="font-black uppercase text-xs tracking-widest">Tu catálogo está vacío. Comienza añadiendo un curso.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/30 hover:bg-slate-50/30 h-20 border-b border-slate-100">
                      <TableHead className="px-10 font-black uppercase text-[10px] tracking-widest text-slate-400">Código</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400">Curso / Producto</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400">Venta ($)</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400">Comisión</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400">Banco Receptor</TableHead>
                      <TableHead className="px-10 text-right font-black uppercase text-[10px] tracking-widest text-slate-400">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((p) => (
                      <TableRow key={p.id} className="hover:bg-slate-50/20 transition-all h-24 border-b border-slate-50 last:border-0 group">
                        <TableCell className="px-10 font-mono font-black text-sm text-primary">{p.code}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-5">
                            <div className="h-14 w-14 rounded-2xl bg-slate-100 flex-shrink-0 overflow-hidden border border-slate-200 shadow-inner group-hover:rotate-2 transition-transform">
                              {p.imageUrl ? (
                                <img src={p.imageUrl} className="h-full w-full object-cover" alt="" />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center text-slate-300">
                                  <GraduationCap className="h-6 w-6" />
                                </div>
                              )}
                            </div>
                            <span className="font-black text-slate-800 text-lg tracking-tight uppercase line-clamp-1">{p.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-black text-slate-900 text-xl tracking-tighter">${p.price?.toFixed(2)}</TableCell>
                        <TableCell>
                           <div className="bg-green-50 text-green-600 font-black px-4 py-2 rounded-xl text-lg tracking-tighter inline-block shadow-sm">
                             {p.commissionRate}%
                           </div>
                        </TableCell>
                        <TableCell>
                           <div className="space-y-1">
                             <p className="text-xs font-black text-slate-700">{p.payoutBankId}</p>
                             <p className="text-[10px] font-mono font-bold text-slate-400">{p.payoutBankAccountNumber}</p>
                           </div>
                        </TableCell>
                        <TableCell className="px-10 text-right">
                          <Button variant="ghost" size="icon" className="h-12 w-12 text-destructive hover:bg-destructive/10 rounded-2xl transition-colors" onClick={() => handleDelete(p.id)}>
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
