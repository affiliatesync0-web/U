"use client"

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { 
  ShoppingBag, 
  Loader2, 
  Calendar, 
  ShieldCheck, 
  Truck,
  Package,
  Clock
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
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase'
import { collection, query, where, doc } from 'firebase/firestore'
import { cn } from '@/lib/utils'

export default function BuyerDashboard() {
  const { t } = useLanguage();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();

  const buyerRef = useMemoFirebase(() => (db && user ? doc(db, 'buyers', user.uid) : null), [db, user]);
  const { data: profile, isLoading: profileLoading } = useDoc(buyerRef);

  const purchasesQuery = useMemoFirebase(() => (db && user ? query(collection(db, 'sales'), where('buyerId', '==', user.uid)) : null), [db, user]);
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
            <Badge className="bg-primary/10 text-primary border-none font-black text-[9px] uppercase tracking-widest px-3 py-1">
              Mis Pedidos
            </Badge>
            <h1 className="text-4xl md:text-6xl font-headline font-black text-slate-900 tracking-tighter leading-none uppercase italic">
              {t.welcomeBack}, <span className="text-primary">{profile?.firstName || 'Campeón'}</span>
            </h1>
            <p className="text-slate-500 font-medium text-lg">Monitorea tus pedidos digitales y rastrea tus paquetes físicos.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4 space-y-8">
            <Card className="amazon-card p-8 border-t-4 border-primary">
                <div className="flex justify-between items-start mb-6">
                  <div className="h-14 w-14 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                    <ShoppingBag className="h-7 w-7" />
                  </div>
                  <Badge variant="outline" className="text-[10px] font-black uppercase">{purchases?.length || 0} TOTAL</Badge>
                </div>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Compras Realizadas</p>
                <h3 className="text-4xl font-black text-slate-900 italic">Historial</h3>
            </Card>

            <Card className="bg-slate-900 text-white p-10 relative overflow-hidden rounded-sm">
               <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12"><Truck className="h-32 w-32 text-white" /></div>
               <div className="relative z-10 space-y-4">
                  <div className="h-12 w-12 bg-white/10 rounded-lg flex items-center justify-center">
                    <Package className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="text-xl font-headline font-black uppercase italic">Logística Local</h4>
                  <p className="text-slate-400 text-xs font-medium leading-relaxed">
                    Si elegiste "Pago contra entrega", nuestro repartidor te llamará para confirmar la entrega en tu domicilio.
                  </p>
               </div>
            </Card>
          </div>

          <div className="lg:col-span-8">
            <Card className="amazon-card p-0 overflow-hidden">
              <CardHeader className="p-8 border-b bg-slate-50/50">
                <CardTitle className="text-xl font-headline font-black text-slate-900 uppercase">Mis Adquisiciones</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {purchasesLoading ? (
                  <div className="flex justify-center py-32"><Loader2 className="animate-spin h-10 w-10 text-primary opacity-20" /></div>
                ) : !purchases || purchases.length === 0 ? (
                  <div className="text-center py-32 opacity-20">
                    <Clock className="h-16 w-16 mx-auto text-slate-200 mb-4" />
                    <p className="text-xs font-black uppercase tracking-widest">Sin actividad comercial</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 h-16">
                          <TableHead className="px-8 uppercase text-[10px] font-black tracking-widest text-slate-400">Detalle del Pedido</TableHead>
                          <TableHead className="uppercase text-[10px] font-black tracking-widest text-slate-400 text-center">Formato</TableHead>
                          <TableHead className="uppercase text-[10px] font-black tracking-widest text-slate-400 text-center">Estatus de Entrega</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {purchases.map((sale) => {
                          const productData = allProducts?.find(p => p.id === sale.productId);
                          const isPhysical = sale.productType === 'Físico' || productData?.type === 'Físico';
                          
                          return (
                            <TableRow key={sale.id} className="h-24 hover:bg-slate-50 transition-colors border-b last:border-0 group">
                              <TableCell className="px-8">
                                <div className="space-y-1">
                                  <span className="font-black text-slate-800 uppercase text-xs">{sale.productName || 'Producto Sync'}</span>
                                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                     <Calendar className="h-3 w-3" /> {sale.saleDate ? new Date(sale.saleDate).toLocaleDateString() : 'N/A'}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline" className={cn("text-[9px] font-black uppercase px-3 py-1 rounded-sm", isPhysical ? "border-blue-100 bg-blue-50 text-blue-600" : "border-purple-100 bg-purple-50 text-purple-600")}>
                                  {isPhysical ? 'FÍSICO' : 'DIGITAL'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                {isPhysical && sale.status === 'Pending' ? (
                                  <Badge className="text-[10px] font-black px-4 py-2 rounded-full uppercase border-none bg-blue-600 text-white shadow-lg animate-pulse flex items-center gap-2 mx-auto w-fit">
                                    <Truck className="h-3.5 w-3.5" /> PENDIENTE DE LLEGAR
                                  </Badge>
                                ) : (
                                  <Badge className={cn(
                                    "text-[10px] font-black px-4 py-2 rounded-full uppercase border-none shadow-sm",
                                    sale.status === 'Completed' ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                                  )}>
                                    {sale.status === 'Completed' ? "ENTREGADO ✓" : "VALIDANDO PAGO"}
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
