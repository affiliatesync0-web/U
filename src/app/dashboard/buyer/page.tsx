
"use client"

import { useState } from 'react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ShoppingBag, Loader2, Calendar, Landmark, Info, GraduationCap, PlayCircle, ExternalLink, ShieldCheck, Sparkles, FileVideo, Clock } from 'lucide-react'
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
            {t.welcomeBack}, {profile?.firstName || 'Campeón'} 👋
          </h1>
          <p className="text-slate-500 font-medium">Accede a tus lecciones de Marketing Digital y gestiona tus cursos.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-4 space-y-8">
            <Card className="border-none shadow-xl rounded-[2.5rem] bg-white p-10 ring-1 ring-slate-100">
              <div className="h-14 w-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                <ShoppingBag className="h-7 w-7" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Cursos Adquiridos</p>
              <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{purchases?.length || 0}</h3>
            </Card>

            <div className="p-10 bg-blue-50 rounded-[3rem] border border-blue-100 flex flex-col gap-6 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-6 opacity-5"><GraduationCap className="h-32 w-32" /></div>
               <div className="h-12 w-12 bg-blue-500 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg -rotate-3">
                 <GraduationCap className="h-6 w-6" />
               </div>
               <div className="space-y-2">
                 <h4 className="font-black text-blue-900 uppercase text-xs tracking-widest">Tu Academia Sync</h4>
                 <p className="text-xs text-blue-800 leading-relaxed font-medium">
                   Las lecciones se habilitan automáticamente una vez que el administrador valida tu comprobante de pago.
                 </p>
               </div>
            </div>
          </div>

          <div className="md:col-span-8">
            <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden ring-1 ring-slate-100">
              <CardHeader className="px-10 py-8 border-b bg-slate-50/30">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-headline font-black text-slate-900 tracking-tight">Mis Productos Digitales</CardTitle>
                  <Badge className="bg-primary/10 text-primary border-none font-black text-[9px] tracking-widest px-4 py-1.5 uppercase">Premium Access</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {purchasesLoading ? (
                  <div className="flex justify-center py-24"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>
                ) : !purchases || purchases.length === 0 ? (
                  <div className="text-center py-32">
                    <Clock className="h-16 w-16 text-slate-100 mx-auto mb-6" />
                    <p className="text-slate-400 font-black text-sm uppercase tracking-widest">Aún no tienes cursos registrados.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader><TableRow className="bg-slate-50/50 h-16">
                        <TableHead className="px-10 uppercase text-[10px] font-black tracking-widest text-slate-400">Curso</TableHead>
                        <TableHead className="uppercase text-[10px] font-black tracking-widest text-slate-400">Estado del Acceso</TableHead>
                        <TableHead className="px-10 text-right uppercase text-[10px] font-black tracking-widest text-slate-400">Aula Virtual</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>{purchases.map((sale) => {
                        const productData = allProducts?.find(p => p.id === sale.productId);
                        return (
                          <TableRow key={sale.id} className="h-24 hover:bg-slate-50/50 transition-all border-b last:border-0 group">
                            <TableCell className="px-10">
                              <div className="flex flex-col">
                                <span className="font-black text-slate-800 uppercase tracking-tight">{sale.productName || 'Curso de Marketing'}</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Compra: {sale.saleDate ? new Date(sale.saleDate).toLocaleDateString() : 'N/A'}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={cn(
                                "text-[9px] font-black px-4 py-1.5 rounded-full uppercase border-none shadow-sm",
                                sale.status === 'Completed' ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700 animate-pulse"
                              )}>
                                {sale.status === 'Completed' ? "ACTIVO ✓" : "VALIDANDO PAGO..."}
                              </Badge>
                            </TableCell>
                            <TableCell className="px-10 text-right">
                              {sale.status === 'Completed' ? (
                                <CoursePlayerDialog product={productData} />
                              ) : (
                                <div className="flex flex-col items-end gap-1">
                                  <span className="text-[10px] font-black text-slate-300 uppercase italic">Esperando aprobación</span>
                                  <p className="text-[8px] font-bold text-slate-400">Ref: {sale.voucherReference}</p>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}</TableBody>
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
        <Button className="h-12 px-8 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl hover:scale-105 transition-all group">
          <PlayCircle className="h-4 w-4 mr-2 text-primary" /> ENTRAR AL CURSO
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl rounded-[3.5rem] p-0 overflow-hidden border-none shadow-2xl bg-white">
        <div className="bg-slate-900 p-12 text-white relative">
           <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12"><GraduationCap className="h-40 w-40" /></div>
           <div className="relative z-10 space-y-6">
             <div className="flex items-center gap-3">
               <div className="h-10 w-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary shadow-inner">
                 <Sparkles className="h-5 w-5" />
               </div>
               <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Aula Virtual Elite Sync</span>
             </div>
             <DialogHeader>
               <DialogTitle className="text-4xl font-headline font-black uppercase tracking-tight leading-none">
                  {product?.name || "Marketing Digital Pro"}
               </DialogTitle>
               <p className="text-slate-400 font-bold text-sm tracking-wide uppercase">{contentVideos.length} LECCIONES DISPONIBLES</p>
             </DialogHeader>
           </div>
        </div>
        
        <div className="p-12 space-y-10 bg-[#F8FAFC]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
            {contentVideos.length === 0 ? (
              <div className="col-span-2 text-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                <PlayCircle className="h-16 w-16 text-slate-100 mx-auto mb-6" />
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">El contenido se está procesando...</p>
              </div>
            ) : (
              contentVideos.map((video: any, i: number) => {
                const isFirebaseStorage = video.url.includes('firebasestorage.googleapis.com');
                
                return (
                  <Card key={i} className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden ring-1 ring-slate-100 group hover:ring-primary/20 transition-all duration-500">
                    <div className="p-8 space-y-6">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-primary bg-primary/5 px-4 py-1.5 rounded-full uppercase tracking-widest">Módulo {i + 1}</span>
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                      </div>
                      <h5 className="font-black text-slate-800 text-lg uppercase leading-tight line-clamp-2 min-h-[3.5rem] tracking-tight">{video.title}</h5>
                      
                      <div className="pt-4">
                        {isFirebaseStorage ? (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button className="w-full h-14 rounded-2xl bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-primary transition-all">
                                <FileVideo className="mr-2 h-4 w-4" /> VER LECCIÓN AHORA
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl p-0 bg-black border-none rounded-none shadow-none">
                              <video src={video.url} controls className="w-full aspect-video" autoPlay />
                            </DialogContent>
                          </Dialog>
                        ) : (
                          <Button asChild className="w-full h-14 rounded-2xl bg-slate-50 text-slate-900 font-black text-[10px] uppercase tracking-widest border border-slate-100 hover:bg-primary hover:text-white transition-all shadow-sm">
                            <a href={video.url} target="_blank" rel="noopener noreferrer">
                              <PlayCircle className="mr-2 h-4 w-4" /> REPRODUCIR EXTERNO
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                )
              })
            )}
          </div>

          <div className="p-8 bg-green-50 rounded-[2.5rem] border border-green-100 flex items-center gap-6 shadow-inner">
             <div className="h-14 w-14 bg-green-500 text-white rounded-2xl flex items-center justify-center shadow-xl -rotate-3"><ShieldCheck className="h-7 w-7" /></div>
             <div>
               <p className="font-black text-green-900 text-sm uppercase tracking-widest">Aprendizaje Garantizado</p>
               <p className="text-[11px] font-bold text-green-700 uppercase tracking-widest opacity-70">Acceso vitalicio • Sync Connect Education</p>
             </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
