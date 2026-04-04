
"use client"

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, Tag, Loader2, Landmark, User, Info, Flame, Link as LinkIcon, Check, GraduationCap, ArrowRight, ShieldCheck, Sparkles, Video, PlayCircle, Target } from 'lucide-react'
import Image from 'next/image'
import placeholderData from '@/app/lib/placeholder-images.json'
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase'
import { collection } from 'firebase/firestore'
import { useLanguage } from '@/components/language-context'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from '@/hooks/use-toast'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export default function AffiliateProductsPage() {
  const { t } = useLanguage();
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const productsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, 'products');
  }, [db]);
  
  const { data: products, isLoading } = useCollection(productsQuery);

  const handleCopyLink = (productId: string) => {
    const link = `${window.location.origin}/checkout/${productId}?ref=${user?.uid}`;
    navigator.clipboard.writeText(link);
    setCopiedId(productId);
    setTimeout(() => setCopiedId(null), 2000);
    toast({
      title: "¡Link de Venta Copiado!",
      description: "Usa este enlace para enviarlo a tus clientes. La comisión se asignará automáticamente a tu cuenta.",
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
              <span className="text-[10px] font-black uppercase text-primary tracking-[0.4em]">Sync Marketplace Elite</span>
            </div>
            <h1 className="text-5xl font-headline font-black text-slate-900 leading-tight tracking-tight">Oportunidades de <span className="text-primary">Ganancia</span></h1>
            <p className="text-lg text-slate-500 font-medium max-w-2xl leading-relaxed">Elige los cursos ganadores, obtén tus videos de entrenamiento y empieza a vender hoy mismo.</p>
          </div>
          <div className="relative w-full md:w-[450px]">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-300" />
            <Input className="pl-16 h-20 rounded-[2.5rem] border-none bg-white shadow-2xl shadow-slate-200/50 text-lg font-bold placeholder:text-slate-300 focus:ring-4 focus:ring-primary/5 transition-all" placeholder="Buscar cursos ganadores..." />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-40">
            <Loader2 className="h-12 w-12 animate-spin text-primary opacity-50" />
          </div>
        ) : !products || products.length === 0 ? (
          <Card className="border-dashed border-4 flex flex-col items-center justify-center p-32 text-center bg-white/50 rounded-[4rem] border-slate-100">
            <div className="h-24 w-24 bg-slate-100 rounded-[2.5rem] flex items-center justify-center mb-8 rotate-12">
              <GraduationCap className="h-12 w-12 text-slate-300" />
            </div>
            <h3 className="text-2xl font-black text-slate-400 mb-3">Próximamente Cursos VIP</h3>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">La administración está preparando los mejores productos para ti.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {products.map((product) => {
              const placeholderImg = getPlaceholderImage(product.category);
              const displayImageUrl = product.imageUrl || placeholderImg.imageUrl;

              return (
                <Card key={product.id} className="border-none shadow-sm hover:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.1)] transition-all duration-700 overflow-hidden flex flex-col rounded-[3.5rem] bg-white group ring-1 ring-slate-100 hover:-translate-y-4">
                  <div className="relative h-72 w-full overflow-hidden">
                    <Image 
                      src={displayImageUrl} 
                      alt={product.name} 
                      fill 
                      className="object-cover transition-transform duration-1000 group-hover:scale-110" 
                      unoptimized={product.imageUrl?.startsWith('data:')}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/20 to-transparent opacity-90" />
                    <div className="absolute top-6 left-6">
                      <div className="bg-primary px-5 py-2 rounded-2xl shadow-2xl flex items-center gap-2">
                        <Sparkles className="h-3 w-3 text-white animate-pulse" />
                        <span className="text-white font-black text-[9px] uppercase tracking-widest">TOP VENTAS</span>
                      </div>
                    </div>
                    <div className="absolute top-6 right-6">
                      <Badge className="bg-white/95 text-slate-900 font-black px-5 py-2 rounded-2xl shadow-2xl border-none text-[9px] tracking-widest">
                        {product.category.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="absolute bottom-8 left-8 right-8 text-white">
                      <p className="text-[9px] font-black uppercase tracking-[0.4em] text-primary mb-2">ID: {product.code}</p>
                      <h3 className="text-2xl font-headline font-black tracking-tight leading-tight line-clamp-2 uppercase">
                        {product.name}
                      </h3>
                    </div>
                  </div>
                  
                  <CardContent className="p-10 flex-1 flex flex-col gap-8">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100 shadow-inner group-hover:bg-primary/5 transition-colors duration-500">
                        <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1.5">PRECIO PUBLICO</p>
                        <p className="font-black text-3xl text-slate-900 tracking-tighter">${product.price?.toFixed(2)}</p>
                      </div>
                      <div className="p-6 rounded-[2rem] bg-green-50 border border-green-100 shadow-inner group-hover:bg-green-100/50 transition-colors duration-500 text-right">
                        <p className="text-[9px] text-green-600 uppercase font-black tracking-widest mb-1.5">TU GANANCIA</p>
                        <p className="font-black text-3xl text-green-600 tracking-tighter">{product.commissionRate}%</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Button 
                        onClick={() => handleCopyLink(product.id)}
                        className="w-full h-20 rounded-[2rem] bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-widest gap-4 shadow-2xl shadow-primary/30 transition-all hover:scale-[1.03] active:scale-95"
                      >
                        {copiedId === product.id ? <Check className="h-6 w-6" /> : <LinkIcon className="h-6 w-6" />}
                        COPIAR LINK DE DIVULGACIÓN
                      </Button>
                      <ProductDetailsDialog product={product} />
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

function ProductDetailsDialog({ product }: any) {
  const trainingVideos = product.videos?.filter((v: any) => v.type === 'training') || [];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className="w-full text-slate-400 font-black text-[9px] uppercase tracking-widest h-12 rounded-2xl hover:bg-slate-50 hover:text-primary transition-all">
          <Info className="mr-2 h-4 w-4" /> Ficha Técnica y Entrenamiento
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl rounded-[3.5rem] p-0 overflow-hidden border-none shadow-2xl bg-white">
        <div className="bg-slate-900 p-12 text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 p-12 opacity-10">
             <GraduationCap className="h-40 w-40" />
           </div>
           <div className="relative z-10">
             <Badge className="bg-primary border-none text-white font-black px-4 py-1.5 rounded-full text-[9px] tracking-[0.2em] mb-6">CURSO PREMIUM</Badge>
             <DialogHeader>
               <DialogTitle className="text-4xl font-headline font-black text-white tracking-tighter leading-[1.1] uppercase">
                  {product.name}
               </DialogTitle>
             </DialogHeader>
           </div>
        </div>
        
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="w-full h-16 bg-slate-50 rounded-none border-b border-slate-100 flex p-0">
            <TabsTrigger value="info" className="flex-1 h-full font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-primary rounded-none">Información General</TabsTrigger>
            <TabsTrigger value="training" className="flex-1 h-full font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-primary rounded-none">Capacitación de Ventas ({trainingVideos.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="p-12 space-y-10 focus-visible:ring-0 m-0">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Propuesta de Valor</h4>
              <div className="p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100 shadow-inner">
                <p className="text-sm font-medium text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {product.description || "Este curso ha sido diseñado para transformar los resultados de tus clientes. Incluye material actualizado, soporte experto y una comunidad activa."}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Resumen de Pagos</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm font-bold text-slate-700">
                    <span className="opacity-50">Precio Final:</span>
                    <span>${product.price?.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-black text-green-600">
                    <span className="opacity-50">Tu Comisión:</span>
                    <span className="bg-green-50 px-3 py-1 rounded-lg border border-green-100">${((product.price * product.commissionRate) / 100).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Garantía Sync</h4>
                <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <ShieldCheck className="h-8 w-8 text-blue-500 shrink-0" />
                  <p className="text-[9px] font-black text-blue-700 uppercase tracking-widest leading-relaxed">
                    Pago 100% seguro y comisiones garantizadas por la plataforma Sync Connect.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="training" className="p-12 space-y-8 focus-visible:ring-0 m-0 bg-slate-50/50">
            <div className="space-y-2">
              <h4 className="text-2xl font-headline font-black text-slate-900 tracking-tight flex items-center gap-3">
                <Video className="h-6 w-6 text-primary" /> Aprende a Vender este Curso
              </h4>
              <p className="text-sm font-medium text-slate-500">Mira estos videos exclusivos para afiliados y aprende estrategias ganadoras.</p>
            </div>

            {trainingVideos.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
                <PlayCircle className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Capacitación próximamente disponible</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {trainingVideos.map((video: any, i: number) => (
                  <div key={i} className="p-6 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-primary/30 transition-all">
                    <div className="flex items-center gap-5">
                      <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                        <PlayCircle className="h-6 w-6" />
                      </div>
                      <div>
                        <h5 className="font-black text-slate-800 text-sm uppercase tracking-tight">{video.title}</h5>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Video Tutorial Estratégico</p>
                      </div>
                    </div>
                    <Button asChild variant="outline" className="h-12 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest border-slate-100 hover:bg-primary hover:text-white transition-all">
                      <a href={video.url} target="_blank" rel="noopener noreferrer">VER VIDEO AHORA</a>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="p-8 border-t bg-slate-50/50">
          <Button className="w-full h-16 rounded-2xl bg-slate-900 text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-xl group">
            EMPEZAR A PROMOVER ESTE CURSO <ArrowRight className="ml-3 h-4 w-4 transition-transform group-hover:translate-x-2" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
