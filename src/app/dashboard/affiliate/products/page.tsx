
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

  const getImage = (category: string) => {
    // Intentar encontrar una imagen que coincida con la categoría o usar una por defecto
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
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-[#A37EDC]" />
              <span className="text-xs font-bold uppercase text-[#A37EDC] tracking-widest">Oportunidades de Marketing</span>
            </div>
            <h1 className="text-3xl font-headline font-bold text-primary">{t.catalog}</h1>
            <p className="text-muted-foreground">{t.highConversion}</p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-10 h-11 rounded-xl shadow-sm border-none bg-white" placeholder={t.search} />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !products || products.length === 0 ? (
          <Card className="border-dashed border-2 flex flex-col items-center justify-center p-20 text-center bg-white/50">
            <Tag className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
            <p className="text-muted-foreground font-medium">No hay productos disponibles en el catálogo en este momento.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => {
              const imageData = getImage(product.category);
              return (
                <Card key={product.id} className="border-none shadow-sm overflow-hidden flex flex-col hover:shadow-2xl transition-all group rounded-[1.5rem] bg-white">
                  <div className="relative h-56 w-full">
                    <Image 
                      src={imageData.imageUrl} 
                      alt={product.name} 
                      fill 
                      className="object-cover group-hover:scale-110 transition-transform duration-500" 
                      data-ai-hint={imageData.imageHint}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <Badge className="absolute top-4 right-4 bg-white/90 text-primary hover:bg-white">{product.category}</Badge>
                    <div className="absolute bottom-4 left-4">
                      <p className="text-[10px] font-bold text-white/80 uppercase tracking-widest">Código de Producto</p>
                      <p className="font-mono font-bold text-white">{product.code}</p>
                    </div>
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl font-headline font-bold group-hover:text-primary transition-colors">{product.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 pb-6">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50">
                      <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1">
                          <DollarSign className="h-3 w-3" /> {t.price}
                        </p>
                        <p className="font-bold text-xl">${product.price?.toFixed(2)}</p>
                      </div>
                      <div className="h-10 w-[1px] bg-slate-200" />
                      <div className="space-y-1 text-right">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1 justify-end">
                          <Percent className="h-3 w-3" /> {t.commission}
                        </p>
                        <p className="font-bold text-xl text-green-600">{product.commissionRate}%</p>
                      </div>
                    </div>
                    {product.description && (
                      <p className="mt-4 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>
                    )}
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
