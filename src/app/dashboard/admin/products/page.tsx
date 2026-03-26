
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
import { Plus, Trash2, Wand2, Search, Loader2, Landmark, Image as ImageIcon, Upload } from 'lucide-react'
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
    category: '',
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
        description: "Por favor, ingresa el nombre, categoría y características principales."
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
        title: "¡Descripción generada!",
        description: "La IA ha creado una descripción única para tu producto."
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
    const productsRef = collection(db, 'products');
    
    const productToSave = {
      name: formData.name,
      category: formData.category,
      code: formData.code.toUpperCase(),
      price: parseFloat(formData.price),
      commissionRate: parseFloat(formData.commission),
      payoutBankAccountNumber: formData.bankAccount,
      payoutBankId: formData.bankType,
      payoutBankAccountHolderName: formData.bankHolder,
      description: formData.description,
      imageUrl: formData.imageUrl,
      createdAt: new Date().toISOString()
    };

    addDocumentNonBlocking(productsRef, productToSave);

    toast({ title: t.saveProduct, description: `${formData.name} ha sido añadido al catálogo.` })
    setIsAdding(false)
    setFormData({
      name: '', category: '', code: '', price: '', commission: '', bankAccount: '', bankType: '', bankHolder: '', features: '', description: '', imageUrl: ''
    })
  }

  const handleDelete = (id: string) => {
    if (!db) return;
    const productRef = doc(db, 'products', id);
    deleteDocumentNonBlocking(productRef);
    toast({ title: "Producto eliminado", description: "El producto ha sido removido del catálogo." });
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
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-headline font-bold text-primary mb-2">{t.productManagement}</h1>
            <p className="text-muted-foreground">Configura tus productos digitales, servicios y comisiones.</p>
          </div>
          
          <Dialog open={isAdding} onOpenChange={setIsAdding}>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-primary hover:bg-primary/90 font-semibold shadow-lg">
                <Plus className="mr-2 h-5 w-5" /> {t.addProduct}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-headline font-bold text-primary">Configurar Producto</DialogTitle>
                <DialogDescription>Configura los detalles del producto, comisiones y cuenta de destino.</DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b pb-2">Información Básica</h3>
                    <div className="space-y-2">
                      <Label>{t.productName}</Label>
                      <Input 
                        value={formData.name} 
                        onChange={e => setFormData({...formData, name: e.target.value})} 
                        placeholder="Ej: Curso de Marketing Premium" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t.category}</Label>
                      <Select onValueChange={v => setFormData({...formData, category: v})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {PRODUCT_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{t.price} ($)</Label>
                        <Input 
                          type="number" 
                          value={formData.price} 
                          onChange={e => setFormData({...formData, price: e.target.value})} 
                          placeholder="49.99" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t.commission} (%)</Label>
                        <Input 
                          type="number" 
                          value={formData.commission} 
                          onChange={e => setFormData({...formData, commission: e.target.value})} 
                          placeholder="20" 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>{t.productCode}</Label>
                      <Input 
                        value={formData.code} 
                        onChange={e => setFormData({...formData, code: e.target.value})} 
                        placeholder="MARKETING-01" 
                        className="font-mono uppercase"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b pb-2">Imagen del Producto</h3>
                    <div className="flex flex-col gap-4">
                      <div className="relative h-40 w-full rounded-xl bg-slate-100 border-2 border-dashed flex items-center justify-center overflow-hidden">
                        {formData.imageUrl ? (
                          <img src={formData.imageUrl} className="h-full w-full object-cover" alt="Preview" />
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-muted-foreground opacity-40">
                            <ImageIcon className="h-10 w-10" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Previsualización</span>
                          </div>
                        )}
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="absolute bottom-2 right-2 font-bold shadow-lg"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="h-3 w-3 mr-2" /> Subir Imagen
                        </Button>
                      </div>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept="image/*" 
                        className="hidden" 
                      />
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">O usa una URL externa</Label>
                        <Input 
                          value={formData.imageUrl.startsWith('data:') ? 'Imagen subida localmente' : formData.imageUrl} 
                          onChange={e => setFormData({...formData, imageUrl: e.target.value})} 
                          placeholder="https://ejemplo.com/imagen.jpg" 
                          disabled={formData.imageUrl.startsWith('data:')}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-4 bg-muted/30 rounded-xl p-5 border">
                    <h3 className="text-xs font-bold text-[#2870A3] uppercase tracking-widest border-b border-[#2870A3]/20 pb-2 flex items-center gap-2">
                      <Landmark className="h-3 w-3" /> {t.payoutSettings}
                    </h3>
                    <div className="space-y-4">
                       <div className="space-y-2">
                        <Label>{t.accountNumber}</Label>
                        <Input 
                          value={formData.bankAccount} 
                          onChange={e => setFormData({...formData, bankAccount: e.target.value})} 
                          placeholder="Número de cuenta para recibir el pago" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t.bankName}</Label>
                        <Select onValueChange={v => setFormData({...formData, bankType: v})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona el banco" />
                          </SelectTrigger>
                          <SelectContent>
                            {NICA_BANKS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>{t.accountHolder}</Label>
                        <Input 
                          value={formData.bankHolder} 
                          onChange={e => setFormData({...formData, bankHolder: e.target.value})} 
                          placeholder="Nombre completo del titular" 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 bg-accent/5 rounded-xl p-5 border border-accent/10">
                    <h3 className="text-xs font-bold text-accent uppercase tracking-widest border-b border-accent/20 pb-2 flex items-center gap-2">
                      <Wand2 className="h-3 w-3" /> {t.aiAssistant}
                    </h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">{t.features} (separadas por comas)</Label>
                        <Input 
                          value={formData.features} 
                          onChange={e => setFormData({...formData, features: e.target.value})} 
                          placeholder="Rápido, seguro, descargas ilimitadas" 
                        />
                      </div>
                      <Button 
                        onClick={handleAIHelp} 
                        type="button" 
                        variant="outline" 
                        className="w-full border-accent text-accent hover:bg-accent/10 font-bold"
                        disabled={generating}
                      >
                        {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wand2 className="h-4 w-4 mr-2" />}
                        {t.generateDescription}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2 px-1">
                <Label className="font-bold">{t.description}</Label>
                <Textarea 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  placeholder="La descripción generada aparecerá aquí..." 
                  className="min-h-[150px] bg-slate-50"
                />
              </div>

              <DialogFooter className="mt-6">
                <Button variant="ghost" onClick={() => setIsAdding(false)} className="font-bold">{t.cancel}</Button>
                <Button className="bg-primary font-bold px-8" onClick={handleSave}>{t.saveProduct}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-none shadow-sm overflow-hidden rounded-2xl">
          <CardHeader className="bg-white border-b flex flex-row items-center justify-between py-6">
             <CardTitle className="text-xl font-headline font-bold">Catálogo de Productos</CardTitle>
             <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-10 h-10 rounded-xl bg-slate-50 border-none" placeholder={t.search} />
             </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center py-24"><Loader2 className="animate-spin h-10 w-10 text-primary opacity-50" /></div>
            ) : !products || products.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <ImageIcon className="h-16 w-16 mx-auto mb-4 opacity-10" />
                <p className="font-medium">Catálogo vacío. Añade tu primer producto para empezar.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 h-14">
                    <TableHead className="px-6 font-bold uppercase text-[10px] tracking-widest">{t.productCode}</TableHead>
                    <TableHead className="font-bold uppercase text-[10px] tracking-widest">{t.productName}</TableHead>
                    <TableHead className="font-bold uppercase text-[10px] tracking-widest">{t.price}</TableHead>
                    <TableHead className="font-bold uppercase text-[10px] tracking-widest">{t.commission}</TableHead>
                    <TableHead className="font-bold uppercase text-[10px] tracking-widest">{t.bankName}</TableHead>
                    <TableHead className="font-bold uppercase text-[10px] tracking-widest">Cuenta Payout</TableHead>
                    <TableHead className="text-right px-6 font-bold uppercase text-[10px] tracking-widest">{t.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((p) => (
                    <TableRow key={p.id} className="hover:bg-slate-50/30 transition-colors h-16">
                      <TableCell className="px-6 font-mono font-bold text-primary">{p.code}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden border">
                            {p.imageUrl ? (
                              <img src={p.imageUrl} className="h-full w-full object-cover" alt="" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-slate-300">
                                <ImageIcon className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                          <span className="font-semibold text-slate-700">{p.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-slate-900">${p.price?.toFixed(2)}</TableCell>
                      <TableCell className="text-green-600 font-black">{p.commissionRate}%</TableCell>
                      <TableCell className="text-xs font-bold text-slate-500">{p.payoutBankId}</TableCell>
                      <TableCell className="text-xs font-mono font-bold text-slate-400">{p.payoutBankAccountNumber}</TableCell>
                      <TableCell className="text-right px-6">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(p.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}
