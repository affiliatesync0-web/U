"use client"

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, Loader2, Info, Flame, Link as LinkIcon, Check, MessageCircle, Package, ShieldCheck } from 'lucide-react'
import Image from 'next/image'
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase'
import { collection } from 'firebase/firestore'
import { useLanguage } from '@/components/language-context'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export default function AffiliateProductsPage() {
  const { t } = useLanguage();
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const productsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, 'products');
  }, [db]);
  
  const { data: products, isLoading } = useCollection(productsQuery);

  const filteredProducts = (products || []).filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCopyLink = (productId: string) => {
    const link = `${window.location.origin}/checkout/${productId}?ref=${user?.uid}`;
    navigator.clipboard.writeText(link);
    setCopiedId(productId);
    setTimeout(() => setCopiedId(null), 2000);
    toast({
      title: "¡Link de Venta Copiado!",
      description: "Tus clientes pueden registrar sus datos antes de pagar.",
    });
  };

  const handleShareWhatsApp = (productName: string, productCode: string) => {
    const link = `${window.location.origin}/checkout/${productCode}?ref=${user?.uid}`;
    const message = encodeURIComponent(`¡Hola! Mira esta oportunidad increíble: ${productName}. Puedes ver más detalles y adquirirlo aquí: ${link}`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  return (
    <DashboardShell role="affiliate">
      <div className="space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner">
                <Flame className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-black uppercase text-primary tracking-[0.4em]">Herramientas de Venta</span>
            </div>
            <h1 className="text-5xl font-headline font-black text-slate-900 leading-tight tracking-tight">Estrategia de <span className="text-primary">Cierre Directo</span></h1>
            <p className="text-lg text-slate-500 font-medium max-w-2xl leading-relaxed">Vende por WhatsApp o comparte tu link personalizado para ganar comisiones.</p>
          </div>
          <div className="relative w-full md:w-[400px]">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-300" />
            <Input 
              className="pl-16 h-20 rounded-[2.5rem] border-none bg-white shadow-xl text-lg font-bold" 
              placeholder="Buscar curso..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-40"><Loader2 className="animate-spin h-12 w-12 text-primary opacity-50" /></div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-[4rem] border-2 border-dashed border-slate-100">
            <Package className="h-16 w-16 text-slate-200 mx-auto mb-4" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Catálogo en preparación</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="border-none shadow-sm hover:shadow-2xl transition-all duration-700 overflow-hidden flex flex-col rounded-[3.5rem] bg-white group ring-1 ring-slate-100">
                <div className="relative h-64 w-full overflow-hidden">
                  <Image 
                    src={product.imageUrl || 'https://picsum.photos/seed/product/600/400'} 
                    alt={product.name} 
                    fill 
                    className="object-cover group-hover:scale-110 transition-transform duration-1000" 
                    unoptimized
                  />
                  <div className="absolute top-6 left-6 flex gap-2">
                    <Badge className="bg-primary text-white border-none font-black px-4 py-1 rounded-xl text-[9px] uppercase tracking-widest shadow-xl">
                      VENTA POR WHATSAPP
                    </Badge>
                  </div>
                  <div className="absolute bottom-8 left-8 right-8 text-white">
                    <h3 className="text-xl font-headline font-black tracking-tight leading-tight uppercase line-clamp-2">
                      {product.name}
                    </h3>
                  </div>
                </div>
                
                <CardContent className="p-10 flex-1 flex flex-col gap-6">
                  <div className="flex items-center justify-between p-6 rounded-[2rem] bg-slate-50 border shadow-inner">
                    <div>
                      <p className="text-[9px] text-slate-400 font-black uppercase">Precio</p>
                      <p className="font-black text-2xl text-slate-900">${product.price?.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-green-600 font-black uppercase">Tu Ganancia</p>
                      <p className="font-black text-2xl text-green-600">{product.commissionRate}%</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Button 
                      onClick={() => handleShareWhatsApp(product.name, product.code)}
                      className="w-full h-16 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-xs uppercase tracking-widest shadow-xl gap-3 transition-all active:scale-95"
                    >
                      <MessageCircle className="h-6 w-6 fill-current" /> COMPARTIR EN WHATSAPP
                    </Button>
                    <Button 
                      onClick={() => handleCopyLink(product.id)}
                      variant="outline"
                      className="w-full h-14 rounded-2xl font-black text-[10px] uppercase border-slate-200 gap-2"
                    >
                      {copiedId === product.id ? <Check className="h-4 w-4" /> : <LinkIcon className="h-4 w-4" />}
                      COPIAR LINK DE REGISTRO
                    </Button>
                    <ProductDetailsDialog product={product} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  )
}

function ProductDetailsDialog({ product }: any) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className="w-full text-slate-400 font-black text-[9px] uppercase tracking-widest h-10 hover:text-primary">
          <Info className="mr-2 h-4 w-4" /> INFO PARA CIERRE
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl rounded-[3.5rem] p-10 overflow-hidden border-none shadow-2xl bg-white">
        <div className="space-y-8">
          <DialogHeader>
            <DialogTitle className="text-3xl font-headline font-black text-slate-900 tracking-tight uppercase italic">Estrategia de <span className="text-primary">Venta</span></DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="p-6 rounded-[2rem] bg-slate-50 border space-y-4">
              <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" /> Guía de Pago Directo
              </h4>
              <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                Este producto se vende cerrando el chat en WhatsApp. Puedes usar el link de registro para capturar los datos del cliente antes de que realice el depósito bancario oficial.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Características Técnicas</h4>
              <p className="text-sm font-medium text-slate-600 leading-relaxed italic border-l-4 border-primary/20 pl-4">
                "{product.description || 'Sin descripción disponible.'}"
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
