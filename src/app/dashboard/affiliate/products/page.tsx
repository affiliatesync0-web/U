
"use client"

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, Tag, DollarSign, Percent, TrendingUp, Loader2 } from 'lucide-react'
import Image from 'next/image'
import placeholderData from '@/app/lib/placeholder-images.json'
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase'
import { collection } from 'firebase/firestore'
import { useLanguage } from '@/components/language-context'

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
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-3 w-3 text-[#A37EDC]" />
            <span className="text-[10px] font-bold uppercase text-[#A37EDC] tracking-widest">Oportunidades de Marketing</span>
          </div>
          <h1 className="text-2xl font-headline font-bold text-[#2870A3] leading-tight">{t.catalog}</h1>
          <p className="text-sm text-muted-foreground">{t.highConversion}</p>
        </div>

        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-10 h-12 rounded-xl border-none bg-white shadow-sm" placeholder={t.search} />
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
                  <CardContent className="px-5 pb-5 pt-2 flex-1 flex flex-col justify-end">
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
