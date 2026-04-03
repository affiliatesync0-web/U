"use client"

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ShoppingBag, Loader2, Calendar, Landmark, Info } from 'lucide-react'
import { useLanguage } from '@/components/language-context'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
          <p className="text-slate-500 font-medium">Gestiona tus productos adquiridos y revisa tu historial de pagos.</p>
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

            <div className="p-8 bg-amber-50 rounded-[2.5rem] border border-amber-100 flex items-start gap-5">
               <div className="h-12 w-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg">
                 <Info className="h-6 w-6" />
               </div>
               <div className="space-y-1">
                 <h4 className="font-black text-amber-900">¿Cómo comprar?</h4>
                 <p className="text-sm text-amber-800 leading-relaxed font-medium">
                   Explora el catálogo, elige un producto y realiza el depósito bancario. Envía el voucher a tu asesor.
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
                  <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary opacity-50" /></div>
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
                          <TableHead className="px-10 uppercase text-[10px] font-black text-slate-400 tracking-widest">Fecha</TableHead>
                          <TableHead className="uppercase text-[10px] font-black text-slate-400 tracking-widest">Producto</TableHead>
                          <TableHead className="uppercase text-[10px] font-black text-slate-400 tracking-widest">Importe</TableHead>
                          <TableHead className="uppercase text-[10px] font-black text-slate-400 tracking-widest">Estado</TableHead>
                          <TableHead className="px-10 text-right uppercase text-[10px] font-black text-slate-400 tracking-widest">Referencia</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {purchases.map((sale) => (
                          <TableRow key={sale.id} className="h-20 hover:bg-slate-50/30">
                            <TableCell className="px-10 text-xs text-slate-500 font-medium">
                              {sale.saleDate ? new Date(sale.saleDate).toLocaleDateString() : 'N/A'}
                            </TableCell>
                            <TableCell className="font-black text-slate-800">{sale.productName || 'Producto'}</TableCell>
                            <TableCell className="font-bold text-slate-900">${sale.saleAmount?.toFixed(2)}</TableCell>
                            <TableCell>
                              <span className="bg-green-100 text-green-700 text-[10px] font-black px-3 py-1 rounded-full uppercase">
                                {sale.status === 'Completed' ? t.completed : t.pending}
                              </span>
                            </TableCell>
                            <TableCell className="px-10 text-right font-mono text-xs font-bold text-slate-400">
                              {sale.voucherReference || 'N/A'}
                            </TableCell>
                          </TableRow>
                        ))}
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
