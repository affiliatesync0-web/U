
"use client"

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, Tag, DollarSign, Percent, TrendingUp, Loader2, Target, Landmark, User, Info, Flame, Star, Sparkles, Link as LinkIcon, Check, Copy } from 'lucide-react'
import Image from 'next/image'
import placeholderData from '@/app/lib/placeholder-images.json'
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase'
import { collection } from 'firebase/firestore'
import { useLanguage } from '@/components/language-context'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { useState } from 'react'

export default function AffiliateProductsPage() {
  const { t } = useLanguage();
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Obtener productos reales de Firestore
  const productsQuery = useMemoFirebase(() => collection(db, 'products'), [db]);
  const { data: products, isLoading } = useCollection(productsQuery);

  const handleCopyLink = (productId: string) => {
    const link = `${window.location.origin}/checkout/${productId}?ref=${user?.uid}`;
    navigator.clipboard.writeText(link);
    setCopiedId(productId);
    setTimeout(() => setCopiedId(null), 2000);
    toast({
      title: t.salesLinkCopied,
      description: "Usa este enlace para enviarlo a tus clientes y cerrar ventas directas.",
    });
  };

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
      <div className="space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner">
                <Flame className="h-6 w-6 animate-pulse" />
              </div>
              <span className="text-[10px] font-black uppercase text-primary tracking-[0.4em]">Sync Connect Marketplace</span>
            </div>
            <h1 className="text-5xl font-headline font-black text-slate-900 leading-tight tracking-tight">Mercado de <span className="text-primary">Afiliación</span></h1>
            <p className="text-lg text-slate-500 font-medium max-w-2xl leading-relaxed">Encuentra los infoproductos y servicios de más alta conversión para potenciar tus ventas y escalar tus comisiones.</p>
          </div>
          <div className="relative w-full md:w-[450px]">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-300" />
            <Input className="pl-16 h-20 rounded-[2rem] border-none bg-white shadow-2xl shadow-slate-200/50 text-lg font-bold placeholder:text-slate-300" placeholder="Buscar productos ganadores..." />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-40">
            <Loader2 className="h-12 w-12 animate-spin text-primary opacity-50" />
          </div>
        ) : !products || products.length === 0 ? (
          <Card className="border-dashed border-4 flex flex-col items-center justify-center p-32 text-center bg-white/50 rounded-[4rem] border-slate-100">
            <div className="h-24 w-24 bg-slate-100 rounded-[2.5rem] flex items-center justify-center mb-8 rotate-12">
              <Tag className="h-12 w-12 text-slate-300" />
            </div>
            <h3 className="text-2xl font-black text-slate-400 mb-3 tracking-tight">Marketplace en Preparación</h3>
            <p className="text-slate-400 max-w-md font-bold text-sm leading-relaxed">Estamos seleccionando las mejores ofertas digitales. Pronto tendrás acceso a productos premium.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {products.map((product) => {
              const placeholderImg = getPlaceholderImage(product.category);
              const displayImageUrl = product.imageUrl || placeholderImg.imageUrl;
              const displayImageHint = product.imageUrl ? "product image" : placeholderImg.imageHint;

              return (
                <Card key={product.id} className="border-none shadow-sm hover:shadow-2xl transition-all duration-700 overflow-hidden flex flex-col rounded-[3rem] bg-white group ring-1 ring-slate-100 hover:-translate-y-3">
                  <div className="relative h-64 w-full overflow-hidden">
                    <Image 
                      src={displayImageUrl} 
                      alt={product.name} 
                      fill 
                      className="object-cover transition-transform duration-1000 group-hover:scale-110" 
                      data-ai-hint={displayImageHint}
                      unoptimized={product.imageUrl?.startsWith('data:')}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80" />
                    <div className="absolute top-6 right-6 flex flex-col gap-2">
                      <Badge className="bg-white/95 backdrop-blur-xl text-primary font-black px-5 py-2 rounded-2xl shadow-2xl border-none text-[10px] tracking-widest">
                        {product.category.toUpperCase()}
                      </Badge>
                      <div className="bg-slate-900/80 backdrop-blur-xl text-white px-3 py-1.5 rounded-xl flex items-center gap-2 text-[9px] font-black uppercase tracking-widest">
                        <Star className="h-3 w-3 text-primary fill-primary" /> HOT
                      </div>
                    </div>
                    <div className="absolute bottom-6 left-8 text-white">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-1.5">IDENTIFICADOR ÚNICO</p>
                      <div className="flex items-center gap-3">
                        <p className="font-mono font-black text-base tracking-[0.2em] uppercase bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-xl border border-white/20">
                          {product.code}
                        </p>
                        <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-lg -rotate-6">
                           <Sparkles className="h-5 w-5 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <CardHeader className="pt-8 pb-3 px-8">
                    <CardTitle className="text-2xl font-headline font-black text-slate-900 group-hover:text-primary transition-colors duration-500 line-clamp-2 min-h-[4rem] tracking-tight">
                      {product.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-8 pb-10 pt-3 flex-1 flex flex-col gap-6">
                    <div className="flex items-center justify-between p-6 rounded-[2rem] bg-slate-50 border border-slate-100 shadow-inner group-hover:bg-primary/5 transition-colors duration-500">
                      <div className="space-y-1.5">
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest flex items-center gap-2">
                          <DollarSign className="h-3 w-3" /> PRECIO FINAL
                        </p>
                        <p className="font-black text-3xl text-slate-900 tracking-tighter">${product.price?.toFixed(2)}</p>
                      </div>
                      <div className="h-12 w-[1.5px] bg-slate-200 mx-4 opacity-50" />
                      <div className="space-y-1.5 text-right">
                        <p className="text-[10px] text-primary uppercase font-black tracking-widest flex items-center gap-2 justify-end">
                          <Percent className="h-3 w-3" /> COMISIÓN
                        </p>
                        <p className="font-black text-3xl text-green-600 tracking-tighter">{product.commissionRate}%</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <Button 
                        onClick={() => handleCopyLink(product.id)}
                        variant="outline"
                        className="w-full h-14 rounded-2xl border-2 border-slate-100 font-black text-[10px] uppercase tracking-widest gap-3 hover:bg-slate-50"
                      >
                        {copiedId === product.id ? <Check className="h-4 w-4 text-green-600" /> : <LinkIcon className="h-4 w-4 text-primary" />}
                        {t.copySalesLink}
                      </Button>
                      <AffiliateDialog product={product} t={t} />
                    </div>
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
        <Button className="w-full bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-widest rounded-2xl h-14 shadow-xl shadow-primary/20 transition-all active:scale-95 group">
          <Target className="mr-2 h-4 w-4 transition-transform group-hover:rotate-12" /> {t.affiliateMe}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg rounded-[3.5rem] p-0 overflow-hidden border-none shadow-2xl bg-white">
        <div className="bg-primary p-12 text-white text-center relative overflow-hidden">
           <div className="absolute top-0 right-0 h-full w-40 bg-white/10 -skew-x-12 translate-x-20" />
           <Flame className="h-20 w-20 mx-auto mb-6 drop-shadow-2xl animate-pulse" />
           <DialogHeader>
             <DialogTitle className="text-4xl font-headline font-black text-white text-center tracking-tighter leading-tight">
                ¡Empieza a ganar comisiones hoy!
             </DialogTitle>
           </DialogHeader>
        </div>
        <div className="p-10 space-y-8">
          <div className="p-8 rounded-[2.5rem] bg-slate-50 border border-slate-200 space-y-6 shadow-inner">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
               <Landmark className="h-5 w-5 text-primary" /> Datos de Pago Directo
            </h3>
            
            <div className="space-y-6">
               <div className="space-y-2">
                 <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest px-1">{t.bankName}</p>
                 <p className="font-black text-2xl text-slate-900 tracking-tight">{product.payoutBankId}</p>
               </div>
               
               <div className="space-y-2">
                 <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest px-1">{t.accountNumber}</p>
                 <div className="p-6 bg-white rounded-[1.5rem] border-2 border-primary/20 font-mono font-black text-3xl tracking-[0.3em] text-primary text-center shadow-2xl shadow-primary/5">
                   {product.payoutBankAccountNumber}
                 </div>
               </div>

               <div className="space-y-2">
                 <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest px-1">{t.accountHolder}</p>
                 <p className="font-black text-lg flex items-center gap-3 text-slate-800">
                   <span className="h-8 w-8 bg-slate-200 rounded-xl flex items-center justify-center"><User className="h-4 w-4 text-slate-500" /></span> {product.payoutBankAccountHolderName}
                 </p>
               </div>
            </div>
          </div>

          <div className="flex gap-5 items-start p-6 bg-amber-50 rounded-[2rem] border border-amber-100 shadow-sm">
            <div className="h-10 w-10 bg-amber-500 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg">
              <Info className="h-6 w-6" />
            </div>
            <p className="text-xs text-amber-900 font-bold leading-relaxed">
              Realiza el depósito bancario a esta cuenta oficial. Luego, registra tu venta en el panel adjuntando la referencia del voucher para validar tu comisión de inmediato.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
