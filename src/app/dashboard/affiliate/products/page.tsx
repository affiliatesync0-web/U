
"use client"

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, Tag, DollarSign, Percent, TrendingUp, Loader2, Target, Landmark, User, Info, Flame } from 'lucide-react'
import Image from 'next/image'
import placeholderData from '@/app/lib/placeholder-images.json'
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase'
import { collection } from 'firebase/firestore'
import { useLanguage } from '@/components/language-context'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

export default function AffiliateProductsPage() {
  const { t } = useLanguage();
  const db = useFirestore();
  
  // Obtener productos reales de Firestore
  const productsQuery = useMemoFirebase(() => collection(db, 'products'), [db]);
  const { data: products, isLoading } = useCollection(productsQuery);

  const getPlaceholderImage = (category: string) => {
    const mapping: Record<string, string> = {
      'Service': 'product-social',
      'Course': 'product-seo',
      'Infoproduct': 'product-ads',
      'Digital Product': 'product-email'
    };
    const imageId = mapping[category] || 'product-growth';
    return placeholderData.placeholderImages.find(img => img.id === imageId) || placeholderData.placeholderImages[0];
  }

  return (
    <DashboardShell role="affiliate">
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-primary animate-pulse" />
              <span className="text-xs font-black uppercase text-primary tracking-[0.2em]">Sync Marketplace</span>
            </div>
            <h1 className="text-4xl font-headline font-black text-slate-900 leading-tight">Mercado de Afiliación</h1>
            <p className="text-base text-slate-500 font-medium">Encuentra los productos de más alta conversión para potenciar tus ventas.</p>
          </div>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input className="pl-12 h-14 rounded-2xl border-none bg-white shadow-xl shadow-slate-200/50" placeholder="Buscar productos ganadores..." />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-32">
            <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
          </div>
        ) : !products || products.length === 0 ? (
          <Card className="border-dashed border-2 flex flex-col items-center justify-center p-24 text-center bg-white/50 rounded-[3rem]">
            <Tag className="h-16 w-16 text-slate-200 mb-6" />
            <h3 className="text-xl font-bold text-slate-400 mb-2">Marketplace Vacío</h3>
            <p className="text-slate-400 max-w-xs font-medium">Pronto tendremos nuevos productos digitales disponibles para ti.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => {
              const placeholderImg = getPlaceholderImage(product.category);
              const displayImageUrl = product.imageUrl || placeholderImg.imageUrl;
              const displayImageHint = product.imageUrl ? "product image" : placeholderImg.imageHint;

              return (
                <Card key={product.id} className="border-none shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col rounded-[2.5rem] bg-white group ring-1 ring-slate-100">
                  <div className="relative h-56 w-full overflow-hidden">
                    <Image 
                      src={displayImageUrl} 
                      alt={product.name} 
                      fill 
                      className="object-cover transition-transform duration-700 group-hover:scale-110" 
                      data-ai-hint={displayImageHint}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                    <Badge className="absolute top-4 right-4 bg-white/90 backdrop-blur-md text-primary font-black px-4 py-1.5 rounded-full shadow-lg">
                      {product.category}
                    </Badge>
                    <div className="absolute bottom-4 left-6 text-white">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-1">CÓDIGO</p>
                      <p className="font-mono font-black text-sm tracking-wider uppercase bg-primary/20 backdrop-blur-sm px-2 py-0.5 rounded-md inline-block">
                        {product.code}
                      </p>
                    </div>
                  </div>
                  <CardHeader className="pt-6 pb-2 px-6">
                    <CardTitle className="text-xl font-headline font-black text-slate-900 group-hover:text-primary transition-colors line-clamp-2 min-h-[3.5rem]">
                      {product.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-6 pb-6 pt-2 flex-1 flex flex-col gap-6">
                    <div className="flex items-center justify-between p-5 rounded-[1.5rem] bg-slate-50 border border-slate-100">
                      <div className="space-y-1">
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest flex items-center gap-1">
                          <DollarSign className="h-3 w-3" /> PRECIO
                        </p>
                        <p className="font-black text-2xl text-slate-900">${product.price?.toFixed(2)}</p>
                      </div>
                      <div className="h-10 w-[1px] bg-slate-200 mx-2" />
                      <div className="space-y-1 text-right">
                        <p className="text-[10px] text-primary uppercase font-black tracking-widest flex items-center gap-1 justify-end">
                          <Percent className="h-3 w-3" /> COMISIÓN
                        </p>
                        <p className="font-black text-2xl text-green-600">{product.commissionRate}%</p>
                      </div>
                    </div>

                    <AffiliateDialog product={product} t={t} />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardShell>
  )
}

function AffiliateDialog({ product, t }: any) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full bg-primary hover:bg-primary/90 text-white font-black text-lg rounded-2xl h-16 shadow-xl shadow-primary/20 hover:-translate-y-1 transition-all active:scale-95">
          <Target className="mr-2 h-6 w-6" /> {t.affiliateMe}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
        <div className="bg-primary p-8 text-white text-center">
           <Flame className="h-12 w-12 mx-auto mb-4" />
           <DialogHeader>
             <DialogTitle className="text-2xl font-headline font-black text-white text-center">
                ¡Empieza a ganar hoy!
             </DialogTitle>
           </DialogHeader>
        </div>
        <div className="p-8 space-y-6">
          <div className="p-6 rounded-[1.5rem] bg-slate-50 border border-slate-200 space-y-5">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
               <Landmark className="h-4 w-4" /> Datos de Pago
            </h3>
            
            <div className="space-y-4">
               <div className="space-y-1">
                 <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">{t.bankName}</p>
                 <p className="font-black text-lg text-slate-900">{product.payoutBankId}</p>
               </div>
               
               <div className="space-y-1">
                 <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">{t.accountNumber}</p>
                 <div className="p-4 bg-white rounded-xl border-2 border-primary/20 font-mono font-black text-2xl tracking-widest text-primary text-center shadow-inner">
                   {product.payoutBankAccountNumber}
                 </div>
               </div>

               <div className="space-y-1">
                 <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">{t.accountHolder}</p>
                 <p className="font-bold text-sm flex items-center gap-2 text-slate-700">
                   <User className="h-4 w-4 text-slate-400" /> {product.payoutBankAccountHolderName}
                 </p>
               </div>
            </div>
          </div>

          <div className="flex gap-4 items-start p-5 bg-amber-50 rounded-[1.25rem] border border-amber-100">
            <div className="h-8 w-8 bg-amber-500 text-white rounded-full flex items-center justify-center shrink-0 shadow-lg">
              <Info className="h-5 w-5" />
            </div>
            <p className="text-xs text-amber-900 font-bold leading-relaxed">
              Realiza el depósito a esta cuenta oficial. Luego, registra tu venta adjuntando el voucher para que validemos tu comisión de inmediato.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
