"use client"

import { useState } from 'react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { 
  ShoppingBag, 
  Loader2, 
  Calendar, 
  Landmark, 
  Info, 
  GraduationCap, 
  PlayCircle, 
  ExternalLink, 
  ShieldCheck, 
  Sparkles, 
  FileVideo, 
  Clock,
  ArrowRight,
  BookOpen
} from 'lucide-react'
import { useLanguage } from '@/components/language-context'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from '@/components/ui/badge'
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
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell role="buyer">
      <div className="space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary/10 text-primary border-none font-black text-[9px] uppercase tracking-widest px-3 py-1">
                Área de Estudiantes
              </Badge>
            </div>
            <h1 className="text-4xl md:text-6xl font-headline font-black text-slate-900 tracking-tighter leading-none uppercase italic">
              {t.welcomeBack}, <span className="text-primary">{profile?.firstName || 'Campeón'}</span>
            </h1>
            <p className="text-slate-500 font-medium text-lg leading-relaxed">Tu portal premium de formación y herramientas digitales.</p>
          </div>
          
          <Button onClick={() => window.open('https://syncacademy.systeme.io/', '_blank')} className="h-16 px-10 rounded-[1.5rem] bg-slate-900 text-white font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-slate-800 active:scale-95 transition-all gap-3">
             <BookOpen className="h-5 w-5" /> RECURSOS EXTERNOS
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4 space-y-8">
            <Card className="premium-card group overflow-hidden">
              <CardContent className="p-10">
                <div className="flex justify-between items-start mb-8">
                  <div className="h-16 w-16 bg-primary/10 text-primary rounded-[1.5rem] flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500">
                    <ShoppingBag className="h-8 w-8" />
                  </div>
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                </div>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Mis Adquisiciones</p>
                <h3 className="text-5xl font-black text-slate-900 tracking-tighter italic">{purchases?.length || 0}</h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-4">Formación certificada</p>
              </CardContent>
            </Card>

            <Card className="premium-card bg-blue-600 text-white p-10 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-1000">
                 <GraduationCap className="h-48 w-48 text-white" />
               </div>
               <div className="relative z-10 space-y-6 flex flex-col h-full justify-between">
                  <div className="space-y-4">
                    <div className="h-14 w-14 bg-white/20 backdrop-blur-md rounded-[1.25rem] flex items-center justify-center shadow-xl">
                      <Sparkles className="h-7 w-7 text-white" />
                    </div>
                    <h4 className="text-2xl font-headline font-black uppercase italic leading-tight">Aula Virtual <span className="text-blue-200">Elite</span></h4>
                    <p className="text-blue-100 text-sm font-medium leading-relaxed">
                      Todas tus lecciones están disponibles 24/7. Accede a ellas tan pronto el administrador valide tu depósito local.
                    </p>
                  </div>
                  <Button variant="outline" className="w-full h-14 rounded-2xl border-white/20 text-white font-black text-[10px] uppercase tracking-widest hover:bg-white/5 shadow-2xl">
                     EXPLORAR CURSOS
                  </Button>
               </div>
            </Card>
          </div>

          <div className="lg:col-span-8">
            <Card className="premium-card overflow-hidden">
              <CardHeader className="px-10 py-10 border-b border-slate-50 bg-slate-50/30">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-headline font-black text-slate-900 uppercase">Mi Catálogo Adquirido</CardTitle>
                  <div className="flex items-center gap-1 text-primary">
                     <ShieldCheck className="h-5 w-5" />
                     <span className="text-[9px] font-black uppercase tracking-widest">Sincronizado</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {purchasesLoading ? (
                  <div className="flex justify-center py-40"><Loader2 className="animate-spin h-10 w-10 text-primary opacity-20" /></div>
                ) : !purchases || purchases.length === 0 ? (
                  <div className="text-center py-40 space-y-6 opacity-20">
                    <Clock className="h-24 w-24 text-slate-200 mx-auto" />
                    <p className="text-sm font-black uppercase tracking-[0.4em]">Sin productos registrados</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50/50 h-20">
                          <TableHead className="px-10 uppercase text-[10px] font-black tracking-widest text-slate-400">Producto Digital</TableHead>
                          <TableHead className="uppercase text-[10px] font-black tracking-widest text-slate-400 text-center">Estado del Acceso</TableHead>
                          <TableHead className="px-10 text-right uppercase text-[10px] font-black tracking-widest text-slate-400">Acción</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {purchases.map((sale) => {
                          const productData = allProducts?.find(p => p.id === sale.productId);
                          return (
                            <TableRow key={sale.id} className="h-28 hover:bg-slate-50/50 transition-all border-b last:border-0 group">
                              <TableCell className="px-10">
                                <div className="flex flex-col gap-1">
                                  <span className="font-black text-slate-800 uppercase text-sm tracking-tight">{sale.productName || 'Curso Academy'}</span>
                                  <div className="flex items-center gap-2 text-slate-400">
                                     <Calendar className="h-3 w-3" />
                                     <span className="text-[9px] font-bold uppercase tracking-widest">{sale.saleDate ? new Date(sale.saleDate).toLocaleDateString() : 'N/A'}</span>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge className={cn(
                                  "text-[10px] font-black px-5 py-2 rounded-full uppercase border-none shadow-sm transition-all",
                                  sale.status === 'Completed' ? "bg-green-100 text-green-700 shadow-green-100" : "bg-amber-100 text-amber-700 animate-pulse"
                                )}>
                                  {sale.status === 'Completed' ? "ACTIVO ✓" : "EN VALIDACIÓN"}
                                </Badge>
                              </TableCell>
                              <TableCell className="px-10 text-right">
                                {sale.status === 'Completed' ? (
                                  <CoursePlayerDialog product={productData} />
                                ) : (
                                  <div className="flex flex-col items-end gap-1 opacity-40">
                                    <span className="text-[10px] font-black text-slate-400 uppercase italic">Ref: {sale.voucherReference}</span>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase">Esperando Admin</p>
                                  </div>
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
        <Button className="h-14 px-8 bg-slate-900 hover:bg-slate-800 text-white rounded-[1.25rem] font-black text-[11px] uppercase tracking-widest shadow-2xl transition-all hover:scale-105 active:scale-95 group">
          <PlayCircle className="h-5 w-5 mr-3 text-primary group-hover:rotate-12 transition-transform" /> EMPEZAR CURSO
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl rounded-[4rem] p-0 overflow-hidden border-none shadow-2xl bg-white h-[90vh] flex flex-col">
        <div className="bg-slate-950 p-12 text-white relative shrink-0">
           <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12"><GraduationCap className="h-48 w-48 text-primary" /></div>
           <div className="relative z-10 space-y-6">
             <div className="flex items-center gap-3">
               <div className="h-12 w-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary shadow-2xl">
                 <Sparkles className="h-6 w-6" />
               </div>
               <span className="text-[11px] font-black text-primary uppercase tracking-[0.4em]">Aula Virtual Sync Academy</span>
             </div>
             <DialogHeader>
               <DialogTitle className="text-4xl md:text-6xl font-headline font-black uppercase tracking-tighter leading-none italic">
                  {product?.name || "Marketing Digital Pro"}
               </DialogTitle>
               <div className="flex items-center gap-4 mt-4">
                  <Badge className="bg-white/10 text-white border-none text-[9px] font-black tracking-widest px-4 py-1.5 uppercase">
                     {contentVideos.length} LECCIONES HD
                  </Badge>
                  <div className="h-1 w-24 bg-primary rounded-full shadow-[0_0_15px_rgba(255,93,27,0.5)]" />
               </div>
             </DialogHeader>
           </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-12 space-y-12 bg-[#F8FAFC]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12">
            {contentVideos.length === 0 ? (
              <div className="col-span-full text-center py-40 bg-white rounded-[3.5rem] border-2 border-dashed border-slate-100">
                <PlayCircle className="h-20 w-20 text-slate-100 mx-auto mb-6" />
                <p className="text-sm font-black text-slate-400 uppercase tracking-[0.4em]">Procesando contenido digital...</p>
              </div>
            ) : (
              contentVideos.map((video: any, i: number) => {
                const isFirebaseStorage = video.url.includes('firebasestorage.googleapis.com');
                
                return (
                  <Card key={i} className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden ring-1 ring-slate-100 group hover:ring-primary/40 transition-all duration-700 hover:-translate-y-2">
                    <div className="p-8 space-y-6">
                      <div className="flex items-center justify-between">
                        <Badge className="text-[9px] font-black text-primary bg-primary/5 px-4 py-1.5 rounded-full uppercase tracking-widest border-none">Módulo {(i + 1).toString().padStart(2, '0')}</Badge>
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      </div>
                      <h5 className="font-black text-slate-900 text-lg uppercase leading-tight line-clamp-2 min-h-[3.5rem] tracking-tight group-hover:text-primary transition-colors">{video.title}</h5>
                      
                      <div className="pt-4">
                        {isFirebaseStorage ? (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button className="w-full h-16 rounded-[1.5rem] bg-slate-900 text-white font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-primary transition-all gap-2">
                                <FileVideo className="h-5 w-5" /> REPRODUCIR CLASE
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-5xl p-0 bg-black border-none rounded-none shadow-none h-auto">
                              <video src={video.url} controls className="w-full aspect-video shadow-2xl" autoPlay />
                            </DialogContent>
                          </Dialog>
                        ) : (
                          <Button asChild className="w-full h-16 rounded-[1.5rem] bg-slate-50 text-slate-900 font-black text-xs uppercase tracking-widest border border-slate-100 hover:bg-primary hover:text-white transition-all shadow-xl gap-2">
                            <a href={video.url} target="_blank" rel="noopener noreferrer">
                              <PlayCircle className="h-5 w-5" /> VER EN EXTERNO
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

          <Card className="premium-card p-10 bg-green-50/50 border border-green-100 flex flex-col md:flex-row items-center gap-8 shadow-inner shrink-0">
             <div className="h-20 w-20 bg-green-500 text-white rounded-[1.75rem] flex items-center justify-center shadow-2xl -rotate-6 shrink-0 transition-transform hover:rotate-0 duration-500">
                <ShieldCheck className="h-10 w-10" />
             </div>
             <div className="space-y-2 text-center md:text-left">
               <p className="font-black text-green-900 text-xl uppercase tracking-tight italic italic">Garantía de Aprendizaje Sync</p>
               <p className="text-sm font-bold text-green-700 uppercase tracking-widest opacity-70">Acceso vitalicio • Formación de alto impacto • Certificado de finalización</p>
             </div>
             <Button variant="outline" className="md:ml-auto h-14 px-8 rounded-2xl border-green-200 text-green-600 font-black text-[10px] uppercase tracking-widest bg-white">RECURSOS PDF</Button>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
