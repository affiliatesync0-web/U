"use client"

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, Tag, Loader2, Landmark, User, Info, Flame, Link as LinkIcon, Check, GraduationCap, ArrowRight, ShieldCheck, Sparkles, Video, PlayCircle, Target, ShoppingBag, CreditCard } from 'lucide-react'
import Image from 'next/image'
import placeholderData from '@/app/lib/placeholder-images.json'
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase'
import { collection } from 'firebase/firestore'
import { useLanguage } from '@/components/language-context'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from '@/hooks/use-toast'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export default function AffiliateProductsPage() {
  const { t } = useLanguage();
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const productsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, 'products');
  }, [db]);
  
  const { data: products, isLoading } = useCollection(productsQuery);

  const handleCopyLink = (productId: string) => {
    const link = `${window.location.origin}/checkout/${productId}?ref=${user?.uid}`;
    navigator.clipboard.writeText(link);
    setCopiedId(productId);
    setTimeout(() => setCopiedId(null), 2000);
    toast({
      title: "¡Link de Venta Copiado!",
      description: "Tu cliente verá directamente el botón de pago digital.",
    });
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
              <span className="text-[10px] font-black uppercase text-primary tracking-[0.4em]">Mercado de Divulgación</span>
            </div>
            <h1 className="text-5xl font-headline font-black text-slate-900 leading-tight tracking-tight">Vende <span className="text-primary">Digital</span></h1>
            <p className="text-lg text-slate-500 font-medium max-w-2xl leading-relaxed">Productos optimizados para cierre con link de pago instantáneo.</p>
          </div>
          <div className="relative w-full md:w-[400px]">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-300" />
            <Input className="pl-16 h-20 rounded-[2.5rem] border-none bg-white shadow-xl text-lg font-bold" placeholder="Buscar curso..." />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-40"><Loader2 className="h-12 w-12 animate-spin text-primary opacity-50" /></div>
        ) : !products || products.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-[4rem] border-2 border-dashed border-slate-100">
            <GraduationCap className="h-16 w-16 text-slate-200 mx-auto mb-4" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Catálogo en preparación</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {products.map((product) => (
              <Card key={product.id} className="border-none shadow-sm hover:shadow-2xl transition-all duration-700 overflow-hidden flex flex-col rounded-[3.5rem] bg-white group ring-1 ring-slate-100">
                <div className="relative h-64 w-full overflow-hidden">
                  <Image 
                    src={product.imageUrl || 'https://picsum.photos/seed/product/600/400'} 
                    alt={product.name} 
                    fill 
                    className="object-cover group-hover:scale-110 transition-transform duration-1000" 
                    unoptimized={product.imageUrl?.startsWith('data:')}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                  <div className="absolute top-6 left-6">
                    <Badge className="bg-primary border-none text-white font-black px-4 py-1 rounded-xl text-[9px] uppercase tracking-widest">DIGITAL READY</Badge>
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
                      <p className="text-[9px] text-slate-400 font-black uppercase">Precio Sugerido</p>
                      <p className="font-black text-2xl text-slate-900">${product.price?.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-green-600 font-black uppercase">Tu Ganancia</p>
                      <p className="font-black text-2xl text-green-600">{product.commissionRate}%</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Button 
                      onClick={() => handleCopyLink(product.id)}
                      className="w-full h-16 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 gap-3"
                    >
                      {copiedId === product.id ? <Check className="h-5 w-5" /> : <LinkIcon className="h-5 w-5" />}
                      COPIAR LINK DE VENTA
                    </Button>
                    <Button asChild variant="outline" className="w-full h-14 rounded-2xl font-black text-[10px] uppercase border-slate-200">
                      <Link href={`/checkout/${product.id}?ref=${user?.uid}`} target="_blank">
                        VER VISTA DEL COMPRADOR
                      </Link>
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
          <Info className="mr-2 h-4 w-4" /> FICHA TÉCNICA
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl rounded-[3.5rem] p-10 overflow-hidden border-none shadow-2xl bg-white">
        <DialogHeader>
          <DialogTitle className="text-3xl font-headline font-black text-slate-900 tracking-tight uppercase italic">Detalles de <span className="text-primary">Cierre</span></DialogTitle>
        </DialogHeader>
        <div className="mt-8 space-y-8">
          <div className="p-6 rounded-[2rem] bg-slate-50 border space-y-3">
            <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Link de Pago Activo</h4>
            <div className="bg-white p-4 rounded-xl border border-primary/10 flex items-center justify-between gap-4">
              <code className="text-[10px] text-slate-500 truncate flex-1">{product.paymentLink || 'No configurado - Usará transferencia manual'}</code>
              <CreditCard className="h-4 w-4 text-primary shrink-0" />
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Descripción para el Cliente</h4>
            <p className="text-sm font-medium text-slate-600 leading-relaxed italic">"{product.description || 'Sin descripción disponible.'}"</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
