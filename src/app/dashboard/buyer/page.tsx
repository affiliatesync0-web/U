
"use client"

import { useState } from 'react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ShoppingBag, Loader2, Calendar, Landmark, Info, GraduationCap, PlayCircle, ExternalLink, ShieldCheck, Sparkles } from 'lucide-react'
import { useLanguage } from '@/components/language-context'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase'
import { collection, query, where, doc } from 'firebase/firestore'
import { cn } from '@/lib/utils'

export default function BuyerDashboard() {
  const { t } = useLanguage();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();

  const buyerRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'buyers', user.uid);
  }, [db, user]);
  
  const { data: profile, isLoading: profileLoading } = useDoc(buyerRef);

  const purchasesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'sales'), where('buyerId', '==', user.uid));
  }, [db, user]);
  
  const { data: purchases, isLoading: purchasesLoading } = useCollection(purchasesQuery);

  const productsQuery = useMemoFirebase(() => collection(db, 'products'), [db]);
  const { data: allProducts } = useCollection(productsQuery);

  if (isUserLoading || profileLoading) {
    return (
      <DashboardShell role="buyer">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell role="buyer">
      <div className="space-y-10">
        <div className="space-y-2">
          <h1 className="text-4xl font-headline font-black text-slate-900 tracking-tight">
            {t.welcomeBack}, {profile?.firstName || 'Comprador'} 👋
          </h1>
          <p className="text-slate-500 font-medium">Gestiona tus productos adquiridos y accede a tus lecciones en video.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Stats */}
          <div className="md:col-span-4 space-y-8">
            <Card className="border-none shadow-sm rounded-[2rem] bg-white p-8 group hover:scale-[1.02] transition-transform">
              <div className="h-12 w-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-4 shadow-inner group-hover:rotate-12 transition-transform">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Compras</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">{purchases?.length || 0}</h3>
            </Card>

            <div className="p-8 bg-blue-50 rounded-[2.5rem] border border-blue-100 flex items-start gap-5">
               <div className="h-12 w-12 bg-blue-500 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg">
                 <GraduationCap className="h-6 w-6" />
               </div>
               <div className="space-y-1">
                 <h4 className="font-black text-blue-900">¿Cómo estudiar?</h4>
                 <p className="text-sm text-blue-800 leading-relaxed font-medium">
                   Tus cursos aparecerán en la tabla. Una vez que tu pago sea validado, verás el botón para "Entrar al Aula Virtual".
                 </p>
               </div>
            </div>
          </div>

          {/* Purchases Table */}
          <div className="md:col-span-8">
            <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden ring-1 ring-slate-100">
              <CardHeader className="px-10 py-8 border-b bg-slate-50/30">
                <CardTitle className="text-2xl font-headline font-black text-slate-900 tracking-tight">{t.myPurchases}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {purchasesLoading ? (
                  <div className="flex justify-center py-20"><Loader2 className="animate-spin h-10 w-10 text-primary opacity-50" /></div>
                ) : !purchases || purchases.length === 0 ? (
                  <div className="text-center py-24">
                    <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                       <ShoppingBag className="h-10 w-10 text-slate-200" />
                    </div>
                    <p className="text-slate-400 font-bold">Aún no has realizado compras reales.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50/50 h-16">
                          <TableHead className="px-10 uppercase text-[10px] font-black text-slate-400 tracking-widest">Producto</TableHead>
                          <TableHead className="uppercase text-[10px] font-black text-slate-400 tracking-widest">Estado</TableHead>
                          <TableHead className="px-10 text-right uppercase text-[10px] font-black text-slate-400 tracking-widest">Acceso</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {purchases.map((sale) => {
                          const productData = allProducts?.find(p => p.id === sale.productId);
                          return (
                            <TableRow key={sale.id} className="h-24 hover:bg-slate-50/30 group">
                              <TableCell className="px-10">
                                <div className="flex flex-col">
                                  <span className="font-black text-slate-800 text-base uppercase tracking-tight">{sale.productName || 'Producto'}</span>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{sale.saleDate ? new Date(sale.saleDate).toLocaleDateString() : 'Fecha N/A'}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className={cn(
                                  "text-[9px] font-black px-3 py-1 rounded-full uppercase border shadow-sm",
                                  sale.status === 'Completed' ? "bg-green-50 text-green-700 border-green-100" : "bg-amber-50 text-amber-700 border-amber-100"
                                )}>
                                  {sale.status === 'Completed' ? "¡PAGO VALIDADO!" : "PAGO PENDIENTE"}
                                </span>
                              </TableCell>
                              <TableCell className="px-10 text-right">
                                {sale.status === 'Completed' ? (
                                  <CoursePlayerDialog product={productData} />
                                ) : (
                                  <Button variant="ghost" disabled className="h-12 px-6 rounded-xl font-black text-[9px] uppercase text-slate-300 gap-2">
                                    ESPERANDO VALIDACIÓN
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}

function CoursePlayerDialog({ product }: any) {
  const contentVideos = product?.videos?.filter((v: any) => v.type === 'content') || [];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="h-12 px-8 bg-slate-900 hover:bg-primary text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all gap-2">
          <GraduationCap className="h-4 w-4" /> ENTRAR AL AULA
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl rounded-[3.5rem] p-0 overflow-hidden border-none shadow-2xl bg-white">
        <div className="bg-slate-900 p-10 text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 p-10 opacity-10">
             <GraduationCap className="h-40 w-40" />
           </div>
           <div className="relative z-10 space-y-4">
             <div className="flex items-center gap-3">
               <div className="h-10 w-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary shadow-inner">
                 <Sparkles className="h-5 w-5" />
               </div>
               <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Aula Virtual Sync</span>
             </div>
             <DialogHeader>
               <DialogTitle className="text-3xl font-headline font-black text-white tracking-tighter leading-none uppercase">
                  {product?.name || "Tu Curso Digital"}
               </DialogTitle>
             </DialogHeader>
           </div>
        </div>
        
        <div className="p-10 grid grid-cols-1 md:grid-cols-12 gap-10 bg-[#F8FAFC]">
          <div className="md:col-span-12 space-y-6">
            <h4 className="text-xl font-headline font-black text-slate-900 tracking-tight flex items-center gap-2">
              <PlayCircle className="h-6 w-6 text-primary" /> Listado de Lecciones ({contentVideos.length})
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {contentVideos.length === 0 ? (
                <div className="col-span-2 text-center py-20 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
                  <PlayCircle className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">El contenido se está subiendo...</p>
                </div>
              ) : (
                contentVideos.map((video: any, i: number) => (
                  <div key={i} className="p-6 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:border-primary/30 transition-all flex flex-col justify-between gap-6 group">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-primary bg-primary/5 px-3 py-1 rounded-full uppercase tracking-widest">Módulo {i + 1}</span>
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      </div>
                      <h5 className="font-black text-slate-800 text-sm uppercase tracking-tight leading-tight line-clamp-2">{video.title}</h5>
                    </div>
                    <Button asChild className="w-full h-12 rounded-xl bg-slate-50 hover:bg-primary hover:text-white text-slate-900 font-black text-[9px] uppercase tracking-widest transition-all shadow-none">
                      <a href={video.url} target="_blank" rel="noopener noreferrer">
                        REPRODUCIR LECCIÓN <ExternalLink className="ml-2 h-3.5 w-3.5" />
                      </a>
                    </Button>
                  </div>
                ))
              )}
            </div>

            <div className="p-8 bg-green-50 rounded-[2.5rem] border border-green-100 flex items-center gap-6">
               <div className="h-12 w-12 bg-green-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-green-200">
                 <ShieldCheck className="h-6 w-6" />
               </div>
               <div>
                 <p className="font-black text-green-900 text-sm uppercase tracking-tight">Acceso Permanente Garantizado</p>
                 <p className="text-xs font-medium text-green-700 leading-relaxed">Puedes volver a esta aula cuando quieras desde tu panel de Sync Connect.</p>
               </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
