"use client"

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, Loader2, ShieldCheck, MessageCircle, Package, CreditCard } from 'lucide-react'
import Image from 'next/image'
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase'
import { collection } from 'firebase/firestore'
import { useLanguage } from '@/components/language-context'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

export default function BuyerProductsPage() {
  const { t } = useLanguage();
  const db = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');
  
  const configQuery = useMemoFirebase(() => collection(db, 'site_config'), [db]);
  const { data: configs } = useCollection(configQuery);
  const supportPhone = configs?.find(c => c.id === 'site-whatsapp')?.value || "";

  const productsQuery = useMemoFirebase(() => collection(db, 'products'), [db]);
  const { data: products, isLoading } = useCollection(productsQuery);

  const filteredProducts = (products || []).filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleWhatsAppPurchase = (productName: string, productCode: string) => {
    if (!supportPhone) return;
    const cleanPhone = supportPhone.replace(/\D/g, '');
    const message = encodeURIComponent(`Hola, soy cliente de Sync Connect y quiero adquirir el producto: ${productName} (Código: ${productCode}). ¿Me indica los pasos para el pago?`);
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  return (
    <DashboardShell role="buyer">
      <div className="space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-black uppercase text-primary tracking-[0.4em]">Tienda Sync Connect</span>
            </div>
            <h1 className="text-5xl font-headline font-black text-slate-900 leading-tight tracking-tight italic">Catálogo <span className="text-primary">VIP</span></h1>
            <p className="text-lg text-slate-500 font-medium max-w-2xl leading-relaxed">Venta directa por WhatsApp. Rapidez y seguridad garantizada.</p>
          </div>
          <div className="relative w-full md:w-[400px]">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-300" />
            <Input 
              className="pl-16 h-20 rounded-[2.5rem] border-none bg-white shadow-xl text-lg font-bold" 
              placeholder="Buscar..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-40">
            <Loader2 className="h-12 w-12 animate-spin text-primary opacity-50" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-32 opacity-20">
            <Package className="h-20 w-20 mx-auto mb-4" />
            <p className="font-black uppercase tracking-widest">Catálogo en preparación</p>
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
                  <div className="absolute top-6 right-6">
                    <Badge className="bg-white/95 text-primary font-black px-5 py-2 rounded-2xl shadow-2xl border-none text-[9px] tracking-widest uppercase">
                      {product.category}
                    </Badge>
                  </div>
                </div>
                <CardHeader className="pt-8 pb-3 px-8 text-center">
                  <CardTitle className="text-2xl font-headline font-black text-slate-900 group-hover:text-primary transition-colors line-clamp-2 min-h-[4rem] tracking-tight uppercase">
                    {product.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-8 pb-10 pt-3 flex-1 flex flex-col gap-8">
                  <div className="flex items-center justify-center p-6 rounded-[2rem] bg-slate-50 border border-slate-100 shadow-inner">
                    <div className="text-center">
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Inversión Única</p>
                      <p className="font-black text-4xl text-slate-900 tracking-tighter">${product.price?.toFixed(2)}</p>
                    </div>
                  </div>

                  <Button 
                    onClick={() => handleWhatsAppPurchase(product.name, product.code)}
                    className="w-full bg-primary hover:bg-primary/90 text-white font-black text-xl rounded-[2rem] h-20 shadow-2xl shadow-primary/30 transition-all duration-500 gap-3"
                  >
                    <MessageCircle className="h-6 w-6" /> COMPRAR POR WHATSAPP
                  </Button>
                  
                  <div className="flex items-center justify-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    <ShieldCheck className="h-4 w-4 text-green-500" /> Venta protegida por Sync Connect
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
