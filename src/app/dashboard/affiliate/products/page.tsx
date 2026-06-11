"use client"

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, Loader2, Link as LinkIcon, Check, Package, ShoppingCart, Copy } from 'lucide-react'
import Image from 'next/image'
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase'
import { collection } from 'firebase/firestore'
import { useLanguage } from '@/components/language-context'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { useState } from 'react'

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
      title: "🚀 Link de Afiliado Copiado",
      description: "Este enlace asegura el rastreo de tu comisión.",
    });
  };

  return (
    <DashboardShell role="affiliate">
      <div className="space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em]">Marketplace Platinum</span>
            </div>
            <h1 className="text-5xl font-headline font-black text-slate-900 leading-tight tracking-tight uppercase">Catálogo de <span className="text-primary">Venta</span></h1>
            <p className="text-lg text-slate-500 font-medium max-w-2xl leading-relaxed">Copia tu enlace de socio y compártelo para ganar comisiones automáticas.</p>
          </div>
          <div className="relative w-full md:w-[400px]">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
            <Input 
              className="pl-16 h-18 rounded-2xl border-none bg-white shadow-xl text-md font-bold" 
              placeholder="Buscar producto..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-40"><Loader2 className="animate-spin h-12 w-12 text-primary opacity-20" /></div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
            <Package className="h-16 w-16 text-slate-100 mx-auto mb-4" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No hay productos disponibles</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="border-none shadow-sm hover:shadow-2xl transition-all duration-700 overflow-hidden flex flex-col rounded-[2.5rem] bg-white group ring-1 ring-slate-100">
                <div className="relative h-60 w-full overflow-hidden">
                  <Image 
                    src={product.imageUrl || 'https://picsum.photos/seed/product/600/400'} 
                    alt={product.name} 
                    fill 
                    className="object-cover group-hover:scale-110 transition-transform duration-1000" 
                    unoptimized
                  />
                  <div className="absolute top-6 left-6">
                    <Badge className="bg-slate-900 text-white border-none font-black px-4 py-1.5 rounded-xl text-[8px] uppercase tracking-widest shadow-2xl">
                      LISTO PARA VENDER
                    </Badge>
                  </div>
                </div>
                
                <CardContent className="p-10 flex-1 flex flex-col gap-6">
                  <div className="space-y-2">
                    <h3 className="text-xl font-headline font-black text-slate-900 uppercase leading-tight line-clamp-1">{product.name}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{product.category} • {product.type}</p>
                  </div>

                  <div className="flex items-center justify-between p-6 rounded-2xl bg-slate-50 border ring-1 ring-black/5">
                    <div>
                      <p className="text-[9px] text-slate-400 font-black uppercase">Precio Cliente</p>
                      <p className="font-black text-2xl text-slate-900">${product.price?.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-green-600 font-black uppercase">Tu Ganancia</p>
                      <p className="font-black text-2xl text-green-600">%{product.commissionRate}</p>
                    </div>
                  </div>

                  <Button 
                    onClick={() => handleCopyLink(product.id)}
                    className="w-full h-20 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm uppercase tracking-widest shadow-2xl gap-3 transition-all active:scale-95"
                  >
                    {copiedId === product.id ? (
                      <><Check className="h-6 w-6 text-primary" /> COPIADO CON ÉXITO</>
                    ) : (
                      <><LinkIcon className="h-6 w-6 text-primary" /> COPIAR LINK DE VENTA</>
                    )}
                  </Button>
                  
                  <p className="text-[9px] text-center text-slate-400 font-black uppercase tracking-widest leading-relaxed">
                    Usa este link para asegurar que la comisión<br/> se acredite a tu saldo de socio.
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
