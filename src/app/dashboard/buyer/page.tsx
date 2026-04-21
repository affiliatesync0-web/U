"use client"

import { useState, useEffect } from 'react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { 
  ShoppingBag, 
  Loader2, 
  Calendar, 
  ShieldCheck, 
  Sparkles, 
  FileVideo, 
  Clock,
  PlayCircle,
  Truck,
  Package
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
                Mis Pedidos
              </Badge>
            </div>
            <h1 className="text-4xl md:text-6xl font-headline font-black text-slate-900 tracking-tighter leading-none uppercase italic">
              {t.welcomeBack}, <span className="text-primary">{profile?.firstName || 'Campeón'}</span>
            </h1>
            <p className="text-slate-500 font-medium text-lg">Gestiona tus productos digitales y el rastreo de tus paquetes físicos.</p>
          </div>
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
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Total Pedidos</p>
                <h3 className="text-5xl font-black text-slate-900 tracking-tighter italic">{purchases?.length || 0}</h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-4">Historial de compras</p>
              </CardContent>
            </Card>

            <Card className="premium-card bg-slate-900 text-white p-10 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-1000">
                 <Truck className="h-48 w-48 text-white" />
               </div>
               <div className="relative z-10 space-y-6 flex flex-col h-full justify-between">
                  <div className="space-y-4">
                    <div className="h-14 w-14 bg-white/20 backdrop-blur-md rounded-[1.25rem] flex items-center justify-center shadow-xl">
                      <Package className="h-7 w-7 text-primary" />
                    </div>
                    <h4 className="text-2xl font-headline font-black uppercase italic leading-tight">Logística <span className="text-primary">Sync</span></h4>
                    <p className="text-slate-400 text-sm font-medium leading-relaxed">
                      Si compraste un producto físico con Pago contra entrega, verás el estado actualizado conforme nuestro equipo coordine la llegada a tu dirección.
                    </p>
                  </div>
               </div>
            </Card>
          </div>

          <div className="lg:col-span-8">
            <Card className="premium-card overflow-hidden">
              <CardHeader className="px-10 py-10 border-b border-slate-50 bg-slate-50/30">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-headline font-black text-slate-900 uppercase">Estado de mis compras</CardTitle>
                  <div className="flex items-center gap-1 text-primary">
                     <ShieldCheck className="h-5 w-5" />
                     <span className="text-[9px] font-black uppercase tracking-widest">Verificado</span>
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
                          <TableHead className="px-10 uppercase text-[10px] font-black tracking-widest text-slate-400">Producto / Pedido</TableHead>
                          <TableHead className="uppercase text-[10px] font-black tracking-widest text-slate-400 text-center">Tipo</TableHead>
                          <TableHead className="uppercase text-[10px] font-black tracking-widest text-slate-400 text-center">Estado del Pedido</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {purchases.map((sale) => {
                          const productData = allProducts?.find(p => p.id === sale.productId);
                          const isPhysical = sale.productType === 'Físico' || productData?.type === 'Físico';
                          
                          return (
                            <TableRow key={sale.id} className="h-28 hover:bg-slate-50/50 transition-all border-b last:border-0 group">
                              <TableCell className="px-10">
                                <div className="flex flex-col gap-1">
                                  <span className="font-black text-slate-800 uppercase text-sm tracking-tight">{sale.productName || 'Producto Sync'}</span>
                                  <div className="flex items-center gap-2 text-slate-400">
                                     <Calendar className="h-3 w-3" />
                                     <span className="text-[9px] font-bold uppercase tracking-widest">{sale.saleDate ? new Date(sale.saleDate).toLocaleDateString() : 'N/A'}</span>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline" className={cn("text-[8px] font-black uppercase px-2 py-0.5 rounded-lg", isPhysical ? "border-blue-100 bg-blue-50 text-blue-600" : "border-purple-100 bg-purple-50 text-purple-600")}>
                                  {isPhysical ? 'FÍSICO' : 'DIGITAL'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                {isPhysical && sale.status === 'Pending' ? (
                                  <Badge className="text-[10px] font-black px-5 py-2 rounded-full uppercase border-none bg-blue-600 text-white shadow-lg animate-pulse flex items-center gap-2 mx-auto w-fit">
                                    <Truck className="h-3 w-3" /> PENDIENTE DE LLEGAR
                                  </Badge>
                                ) : (
                                  <Badge className={cn(
                                    "text-[10px] font-black px-5 py-2 rounded-full uppercase border-none shadow-sm",
                                    sale.status === 'Completed' ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700 animate-pulse"
                                  )}>
                                    {sale.status === 'Completed' ? "RECIBIDO / ACTIVO ✓" : "EN VALIDACIÓN"}
                                  </Badge>
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
