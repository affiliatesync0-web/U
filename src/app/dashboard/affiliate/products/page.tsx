"use client"

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, Tag, DollarSign, Percent, TrendingUp, Loader2, Target, Landmark, User, Info, Flame, Star, Sparkles, Link as LinkIcon, Check, Copy, MessageSquare } from 'lucide-react'
import Image from 'next/image'
import placeholderData from '@/app/lib/placeholder-images.json'
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase'
import { collection, doc } from 'firebase/firestore'
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
  
  const productsQuery = useMemoFirebase(() => collection(db, 'products'), [db]);
  const { data: products, isLoading } = useCollection(productsQuery);

  const affiliateRef = useMemoFirebase(() => (user ? doc(db, 'affiliates', user.uid) : null), [db, user]);
  const { data: profile } = useDoc(affiliateRef);

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

  const handleCopyWhatsAppLink = (productCode: string) => {
    if (!profile?.whatsappNumber) {
      toast({
        variant: "destructive",
        title: "WhatsApp no vinculado",
        description: "Primero vincula tu número en la sección de 'Configuración de Bot'.",
      });
      return;
    }
    const message = encodeURIComponent(`Hola, me interesa el producto ${productCode}. ¿Cómo puedo adquirirlo?`);
    const link = `https://wa.me/${profile.whatsappNumber}?text=${message}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link de Venta WhatsApp Copiado",
      description: "Este link activará tu bot de ventas automáticamente para este producto.",
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
            <p className="text-lg text-slate-500 font-medium max-w-2xl leading-relaxed">Encuentra productos ganadores y usa el **Bot de Venta Automática** para cerrar tratos mientras duermes.</p>
          </div>
          <div className="relative w-full md:w-[450px]">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-300" />
            <Input className="pl-16 h-20 rounded-[2rem] border-none bg-white shadow-2xl shadow-slate-200/50 text-lg font-bold placeholder:text-slate-300" placeholder="Buscar productos..." />
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
            <h3 className="text-2xl font-black text-slate-400 mb-3">Marketplace en Preparación</h3>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {products.map((product) => {
              const placeholderImg = getPlaceholderImage(product.category);
              const displayImageUrl = product.imageUrl || placeholderImg.imageUrl;

              return (
                <Card key={product.id} className="border-none shadow-sm hover:shadow-2xl transition-all duration-700 overflow-hidden flex flex-col rounded-[3rem] bg-white group ring-1 ring-slate-100 hover:-translate-y-3">
                  <div className="relative h-64 w-full overflow-hidden">
                    <Image 
                      src={displayImageUrl} 
                      alt={product.name} 
                      fill 
                      className="object-cover transition-transform duration-1000 group-hover:scale-110" 
                      unoptimized={product.imageUrl?.startsWith('data:')}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80" />
                    <div className="absolute top-6 right-6">
                      <Badge className="bg-white/95 text-primary font-black px-5 py-2 rounded-2xl shadow-2xl border-none text-[10px] tracking-widest">
                        {product.category.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="absolute bottom-6 left-8 text-white">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-1.5">CÓDIGO DE VENTA</p>
                      <p className="font-mono font-black text-base tracking-[0.2em] uppercase bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-xl border border-white/20">
                        {product.code}
                      </p>
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
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">PRECIO</p>
                        <p className="font-black text-3xl text-slate-900 tracking-tighter">${product.price?.toFixed(2)}</p>
                      </div>
                      <div className="space-y-1.5 text-right">
                        <p className="text-[10px] text-primary uppercase font-black tracking-widest">COMISIÓN</p>
                        <p className="font-black text-3xl text-green-600 tracking-tighter">{product.commissionRate}%</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <Button 
                        onClick={() => handleCopyWhatsAppLink(product.code)}
                        className="w-full h-14 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-black text-[10px] uppercase tracking-widest gap-3 shadow-xl shadow-green-200"
                      >
                        <MessageSquare className="h-4 w-4" /> Link Venta WhatsApp IA
                      </Button>
                      <Button 
                        onClick={() => handleCopyLink(product.id)}
                        variant="outline"
                        className="w-full h-14 rounded-2xl border-2 border-slate-100 font-black text-[10px] uppercase tracking-widest gap-3 hover:bg-slate-50"
                      >
                        {copiedId === product.id ? <Check className="h-4 w-4 text-green-600" /> : <LinkIcon className="h-4 w-4 text-primary" />}
                        Copiar Link de Pago Directo
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
        <Button variant="ghost" className="w-full text-slate-400 font-black text-[10px] uppercase tracking-widest h-10 hover:text-primary">
          <Info className="mr-2 h-3 w-3" /> Ver detalles bancarios
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg rounded-[3.5rem] p-0 overflow-hidden border-none shadow-2xl bg-white">
        <div className="bg-primary p-12 text-white text-center relative overflow-hidden">
           <Flame className="h-20 w-20 mx-auto mb-6 drop-shadow-2xl animate-pulse" />
           <DialogHeader>
             <DialogTitle className="text-4xl font-headline font-black text-white text-center tracking-tighter leading-tight">
                Datos de Venta Directa
             </DialogTitle>
           </DialogHeader>
        </div>
        <div className="p-10 space-y-8">
          <div className="p-8 rounded-[2.5rem] bg-slate-50 border border-slate-200 space-y-6 shadow-inner">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
               <Landmark className="h-5 w-5 text-primary" /> Información de Depósito
            </h3>
            <div className="space-y-6">
               <div className="space-y-2">
                 <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest px-1">Banco</p>
                 <p className="font-black text-2xl text-slate-900 tracking-tight">{product.payoutBankId}</p>
               </div>
               <div className="space-y-2">
                 <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest px-1">Número de Cuenta</p>
                 <div className="p-6 bg-white rounded-[1.5rem] border-2 border-primary/20 font-mono font-black text-3xl tracking-[0.3em] text-primary text-center">
                   {product.payoutBankAccountNumber}
                 </div>
               </div>
               <div className="space-y-2">
                 <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest px-1">Titular</p>
                 <p className="font-black text-lg flex items-center gap-3 text-slate-800">
                   <User className="h-4 w-4 text-slate-500" /> {product.payoutBankAccountHolderName}
                 </p>
               </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
