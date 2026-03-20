"use client"

import { useState } from 'react'
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
import { Plus, Pencil, Trash2, Wand2, Search } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/components/language-context'
import { generateProductDescription } from '@/ai/flows/generate-product-description-flow'

export default function AdminProductsPage() {
  const { toast } = useToast()
  const { t } = useLanguage()
  const [isAdding, setIsAdding] = useState(false)
  const [generating, setGenerating] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    code: '',
    price: '',
    commission: '',
    bankAccount: '',
    bankType: '',
    features: '',
    description: ''
  })

  const [products, setProducts] = useState([
    { id: "1", name: "Curso de Excel", code: "EXCEL24", category: "Course", price: 49.99, commission: "20%", bank: "Banpro" },
    { id: "2", name: "Paquete SEO", code: "SEO-OPT", category: "Service", price: 199.00, commission: "15%", bank: "BAC" },
  ])

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
    toast({ title: t.saveProduct, description: `${formData.name} ha sido añadido al catálogo.` })
    setIsAdding(false)
    setFormData({
      name: '', category: '', code: '', price: '', commission: '', bankAccount: '', bankType: '', features: '', description: ''
    })
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
              <Button size="lg" className="bg-[#2870A3] hover:bg-[#1e5a82] font-semibold shadow-lg">
                <Plus className="mr-2 h-5 w-5" /> {t.addProduct}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-headline font-bold text-primary">Configurar Producto</DialogTitle>
                <DialogDescription>Configura los detalles del producto, comisiones y cuenta de destino.</DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                <div className="space-y-4">
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
                      placeholder="CURSO-2024" 
                      className="font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-4 border-l pl-6 bg-muted/20 rounded-lg p-4">
                   <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">{t.payoutSettings}</h3>
                   <div className="space-y-2">
                    <Label>{t.accountNumber} (Nicaragua)</Label>
                    <Input 
                      value={formData.bankAccount} 
                      onChange={e => setFormData({...formData, bankAccount: e.target.value})} 
                      placeholder="Número de cuenta para ingresos" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t.bankName}</Label>
                    <Select onValueChange={v => setFormData({...formData, bankType: v})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Banco para pagos" />
                      </SelectTrigger>
                      <SelectContent>
                        {NICA_BANKS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="pt-4 border-t mt-4">
                    <Label className="flex items-center gap-2 mb-2">
                      <Wand2 className="h-4 w-4 text-[#A37EDC]" /> {t.aiAssistant}
                    </Label>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase">{t.features} (separadas por comas)</Label>
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
                      className="w-full mt-2 border-[#A37EDC] text-[#A37EDC] hover:bg-[#f3effb]"
                      disabled={generating}
                    >
                      {generating ? "Creando..." : t.generateDescription}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t.description}</Label>
                <Textarea 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  placeholder="La descripción generada aparecerá aquí..." 
                  className="min-h-[120px]"
                />
              </div>

              <DialogFooter>
                <Button variant="ghost" onClick={() => setIsAdding(false)}>{t.cancel}</Button>
                <Button className="bg-[#2870A3]" onClick={handleSave}>{t.saveProduct}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-white border-b flex flex-row items-center justify-between py-4">
             <CardTitle className="text-xl font-headline">{t.catalog}</CardTitle>
             <div className="relative w-64">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input className="pl-7 h-8 text-xs" placeholder={t.search} />
             </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>{t.productCode}</TableHead>
                  <TableHead>{t.productName}</TableHead>
                  <TableHead>{t.category}</TableHead>
                  <TableHead>{t.price}</TableHead>
                  <TableHead>{t.commission}</TableHead>
                  <TableHead>{t.bankName}</TableHead>
                  <TableHead className="text-right">{t.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono font-bold text-primary">{p.code}</TableCell>
                    <TableCell className="font-semibold">{p.name}</TableCell>
                    <TableCell>
                      <span className="text-xs px-2 py-1 rounded-full bg-muted border font-medium">{p.category}</span>
                    </TableCell>
                    <TableCell>${p.price.toFixed(2)}</TableCell>
                    <TableCell className="text-green-600 font-bold">{p.commission}</TableCell>
                    <TableCell className="text-xs">{p.bank}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600"><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}
