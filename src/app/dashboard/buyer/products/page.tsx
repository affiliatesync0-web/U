
"use client"

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, DollarSign, Loader2, Landmark, User, Info, Flame, Star, Sparkles, ShoppingCart } from 'lucide-react'
import Image from 'next/image'
import placeholderData from '@/app/lib/placeholder-images.json'
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase'
import { collection } from 'firebase/firestore'
import { useLanguage } from '@/components/language-context'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

export default function BuyerProductsPage() {
  const { t } = useLanguage();
  const db = useFirestore();
  
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
    <DashboardShell role="buyer">
      <div className="space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner">
                <ShoppingCart className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-black uppercase text-primary tracking-[0.4em]">Sync Connect Marketplace</span>
            </div>
            <h1 className="text-5xl font-headline font-black text-slate-900 leading-tight tracking-tight">Explora <span className="text-primary">Soluciones</span></h1>
            <p className="text-lg text-slate-500 font-medium max-w-2xl leading-relaxed">Encuentra los mejores productos digitales y servicios premium seleccionados para ti.</p>
          </div>
          <div className="relative w-full md:w-[400px]">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-300" />
            <Input className="pl-16 h-20 rounded-[2rem] border-none bg-white shadow-2xl shadow-slate-200/50 text-lg font-bold" placeholder="Buscar productos..." />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-40">
            <Loader2 className="h-12 w-12 animate-spin text-primary opacity-50" />
          </div>
        ) : !products || products.length === 0 ? (
          <Card className="border-dashed border-4 flex flex-col items-center justify-center p-32 text-center bg-white/50 rounded-[4rem] border-slate-100">
            <h3 className="text-2xl font-black text-slate-400">Catálogo próximamente disponible.</h3>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {products.map((product) => {
              const placeholderImg = getPlaceholderImage(product.category);
              const displayImageUrl = product.imageUrl || placeholderImg.imageUrl;

              return (
                <Card key={product.id} className="border-none shadow-sm hover:shadow-2xl transition-all duration-700 overflow-hidden flex flex-col rounded-[3rem] bg-white group ring-1 ring-slate-100">
                  <div className="relative h-64 w-full overflow-hidden">
                    <Image 
                      src={displayImageUrl} 
                      alt={product.name} 
                      fill 
                      className="object-cover transition-transform duration-1000 group-hover:scale-110" 
                      unoptimized={product.imageUrl?.startsWith('data:')}
                    />
                    <div className="absolute top-6 right-6">
                      <Badge className="bg-white/95 text-primary font-black px-5 py-2 rounded-2xl shadow-2xl border-none text-[10px] tracking-widest">
                        {product.category.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  <CardHeader className="pt-8 pb-3 px-8">
                    <CardTitle className="text-2xl font-headline font-black text-slate-900 group-hover:text-primary transition-colors line-clamp-2 min-h-[4rem] tracking-tight">
                      {product.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-8 pb-10 pt-3 flex-1 flex flex-col gap-8">
                    <div className="flex items-center justify-between p-6 rounded-[2rem] bg-slate-50 border border-slate-100 shadow-inner">
                      <div className="space-y-1.5">
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">PRECIO</p>
                        <p className="font-black text-3xl text-slate-900 tracking-tighter">${product.price?.toFixed(2)}</p>
                      </div>
                      <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center">
                         <Star className="h-5 w-5 text-primary fill-primary" />
                      </div>
                    </div>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="w-full bg-primary hover:bg-primary/90 text-white font-black text-xl rounded-[1.75rem] h-20 shadow-2xl shadow-primary/30 transition-all active:scale-95 duration-500">
                          {t.buyNow.toUpperCase()}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg rounded-[3.5rem] p-0 overflow-hidden border-none shadow-2xl bg-white">
                        <div className="bg-primary p-12 text-white text-center">
                           <ShoppingCart className="h-16 w-16 mx-auto mb-6" />
                           <DialogHeader>
                             <DialogTitle className="text-3xl font-headline font-black text-white text-center tracking-tighter">
                               Instrucciones de Pago
                             </DialogTitle>
                           </DialogHeader>
                        </div>
                        <div className="p-10 space-y-8">
                          <div className="p-8 rounded-[2.5rem] bg-slate-50 border border-slate-200 space-y-6">
                            <div className="space-y-2">
                               <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">BANCO</p>
                               <p className="font-black text-2xl text-slate-900">{product.payoutBankId}</p>
                            </div>
                            <div className="space-y-2">
                               <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">NÚMERO DE CUENTA</p>
                               <div className="p-6 bg-white rounded-[1.5rem] border-2 border-primary/20 font-mono font-black text-3xl tracking-widest text-primary text-center">
                                 {product.payoutBankAccountNumber}
                               </div>
                            </div>
                            <div className="space-y-2">
                               <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">TITULAR</p>
                               <p className="font-black text-lg text-slate-800">{product.payoutBankAccountHolderName}</p>
                            </div>
                          </div>
                          <div className="p-6 bg-amber-50 rounded-[2rem] border border-amber-100">
                            <p className="text-xs text-amber-900 font-bold leading-relaxed">
                              IMPORTANTE: Realiza el depósito y envía el voucher al asesor que te recomendó este producto para validar tu acceso inmediatamente.
                            </p>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
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
