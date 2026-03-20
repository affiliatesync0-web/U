
"use client"

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, Tag, DollarSign, Percent, TrendingUp, Loader2, Target, Landmark, User, Info } from 'lucide-react'
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
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-3 w-3 text-[#A37EDC]" />
              <span className="text-[10px] font-bold uppercase text-[#A37EDC] tracking-widest">Oportunidades de Marketing</span>
            </div>
            <h1 className="text-2xl font-headline font-bold text-[#2870A3] leading-tight">{t.catalog}</h1>
            <p className="text-sm text-muted-foreground">{t.highConversion}</p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-10 h-10 rounded-xl border-none bg-white shadow-sm" placeholder={t.search} />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !products || products.length === 0 ? (
          <Card className="border-dashed border-2 flex flex-col items-center justify-center p-20 text-center bg-white/50">
            <Tag className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
            <p className="text-muted-foreground font-medium">No hay productos disponibles en el catálogo.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => {
              const placeholderImg = getPlaceholderImage(product.category);
              const displayImageUrl = product.imageUrl || placeholderImg.imageUrl;
              const displayImageHint = product.imageUrl ? "product image" : placeholderImg.imageHint;

              return (
                <Card key={product.id} className="border-none shadow-sm overflow-hidden flex flex-col rounded-[1.25rem] bg-white group hover:shadow-md transition-all">
                  <div className="relative h-48 w-full">
                    <Image 
                      src={displayImageUrl} 
                      alt={product.name} 
                      fill 
                      className="object-cover" 
                      data-ai-hint={displayImageHint}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4 text-white">
                      <p className="text-[9px] font-bold uppercase tracking-widest opacity-80">CÓDIGO DE -</p>
                      <p className="font-mono font-bold text-sm tracking-wider uppercase">{product.code}</p>
                    </div>
                  </div>
                  <CardHeader className="pt-4 pb-2 px-5">
                    <CardTitle className="text-lg font-headline font-bold lowercase">{product.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="px-5 pb-5 pt-2 flex-1 flex flex-col gap-4">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50/80 border border-slate-100">
                      <div className="space-y-0.5">
                        <p className="text-[9px] text-muted-foreground uppercase font-bold flex items-center gap-1">
                          <DollarSign className="h-2 w-2" /> PRECIO
                        </p>
                        <p className="font-bold text-lg text-slate-900">${product.price?.toFixed(2)}</p>
                      </div>
                      <div className="h-8 w-[1px] bg-slate-200 mx-2" />
                      <div className="space-y-0.5 text-right">
                        <p className="text-[9px] text-muted-foreground uppercase font-bold flex items-center gap-1 justify-end">
                          <Percent className="h-2 w-2" /> COMISIÓN
                        </p>
                        <p className="font-bold text-lg text-green-600">{product.commissionRate}%</p>
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
        <Button className="w-full bg-[#A37EDC] hover:bg-[#8e69c4] text-white font-bold rounded-xl h-11 shadow-sm">
          <Target className="mr-2 h-4 w-4" /> {t.affiliateMe}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-headline font-bold text-primary flex items-center gap-2">
            <Landmark className="h-6 w-6" /> {t.instructions}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="p-5 rounded-2xl bg-[#2870A3]/5 border border-[#2870A3]/10 space-y-4">
            <h3 className="text-sm font-bold text-[#2870A3] uppercase tracking-wider flex items-center gap-2">
               <Landmark className="h-4 w-4" /> {t.depositAccount}
            </h3>
            
            <div className="space-y-4">
               <div className="space-y-1">
                 <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{t.bankName}</p>
                 <p className="font-bold text-lg text-[#2870A3]">{product.payoutBankId}</p>
               </div>
               
               <div className="space-y-1">
                 <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{t.accountNumber}</p>
                 <div className="p-3 bg-white rounded-lg border font-mono font-bold text-xl tracking-wider text-center shadow-inner">
                   {product.payoutBankAccountNumber}
                 </div>
               </div>

               <div className="space-y-1">
                 <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{t.accountHolder}</p>
                 <p className="font-semibold text-sm flex items-center gap-2">
                   <User className="h-3 w-3 text-muted-foreground" /> {product.payoutBankAccountHolderName}
                 </p>
               </div>
            </div>
          </div>

          <div className="flex gap-3 items-start p-4 bg-amber-50 rounded-xl border border-amber-100">
            <Info className="h-5 w-5 text-amber-600 mt-0.5" />
            <p className="text-xs text-amber-800 leading-relaxed">
              Realiza el depósito a esta cuenta para completar tu afiliación o registrar ventas de este producto. Una vez hecho, usa el portal para subir el comprobante.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
