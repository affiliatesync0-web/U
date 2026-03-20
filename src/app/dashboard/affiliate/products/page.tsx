
"use client"

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Tag, DollarSign, Percent, TrendingUp } from 'lucide-react'
import Image from 'next/image'
import placeholderData from '@/app/lib/placeholder-images.json'

export default function AffiliateProductsPage() {
  const products = [
    { id: "P-101", name: "Social Media Growth", type: "Service", price: "$89.99", commission: "25%", code: "SOCIAL-X", imageId: "product-social" },
    { id: "P-102", name: "SEO Masterclass", type: "Course", price: "$149.00", commission: "20%", code: "SEO-PRO", imageId: "product-seo" },
    { id: "P-103", name: "Google Ads Strategy", type: "Infoproduct", price: "$45.50", commission: "35%", code: "ADS-GA", imageId: "product-ads" },
    { id: "P-104", name: "Email Copy Templates", type: "Digital Product", price: "$27.00", commission: "40%", code: "EMAIL-CP", imageId: "product-email" },
    { id: "P-105", name: "Marketing Analytics Tool", type: "Software", price: "$19.99/mo", commission: "15%", code: "KPI-TOOL", imageId: "product-growth" },
  ]

  const getImage = (id: string) => {
    return placeholderData.placeholderImages.find(img => img.id === id) || placeholderData.placeholderImages[0];
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
            <h1 className="text-3xl font-headline font-bold text-primary">Catálogo de Productos</h1>
            <p className="text-muted-foreground">Productos de alta conversión listos para promocionar.</p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-10 h-11 rounded-xl shadow-sm border-none bg-white" placeholder="Buscar por nicho o código..." />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => {
            const imageData = getImage(product.imageId);
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
                  <Badge className="absolute top-4 right-4 bg-white/90 text-primary hover:bg-white">{product.type}</Badge>
                  <div className="absolute bottom-4 left-4">
                    <p className="text-[10px] font-bold text-white/80 uppercase tracking-widest">Código de Producto</p>
                    <p className="font-mono font-bold text-white">{product.code}</p>
                  </div>
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl font-headline font-bold group-hover:text-primary transition-colors">{product.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 pb-4">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50">
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1">
                        <DollarSign className="h-3 w-3" /> Precio Final
                      </p>
                      <p className="font-bold text-xl">{product.price}</p>
                    </div>
                    <div className="h-10 w-[1px] bg-slate-200" />
                    <div className="space-y-1 text-right">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1 justify-end">
                        <Percent className="h-3 w-3" /> Comisión
                      </p>
                      <p className="font-bold text-xl text-green-600">{product.commission}</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0 pb-6 px-6">
                  <Button className="w-full font-bold h-12 rounded-xl group-hover:bg-primary transition-all" variant="outline">
                    Generar Enlace
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardShell>
  )
}
