
"use client"

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ShoppingBag, Loader2, Calendar, Landmark, Info, Bell, MessageSquare } from 'lucide-react'
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
import { collection, query, where, doc, orderBy } from 'firebase/firestore'
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

  const notificationsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'notifications'), 
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
  }, [db, user]);

  const { data: notifications, isLoading: notificationsLoading } = useCollection(notificationsQuery);

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
          {/* Stats & Notifications */}
          <div className="md:col-span-4 space-y-8">
            <Card className="border-none shadow-sm rounded-[2rem] bg-white p-8 group hover:scale-[1.02] transition-transform">
              <div className="h-12 w-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-4 shadow-inner group-hover:rotate-12 transition-transform">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Compras</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">{purchases?.length || 0}</h3>
            </Card>

            <Card className="border-none shadow-2xl rounded-[3rem] bg-slate-900 text-white overflow-hidden ring-1 ring-white/5">
              <CardHeader className="px-8 pt-10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
                    <Bell className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-xl font-headline font-black">{t.platformMessages}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-10">
                <div className="space-y-4">
                  {notificationsLoading ? (
                    <div className="flex justify-center py-6"><Loader2 className="animate-spin h-5 w-5 text-primary" /></div>
                  ) : !notifications || notifications.length === 0 ? (
                    <div className="text-center py-6 opacity-30">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-[10px] uppercase font-black tracking-widest">Sin mensajes</p>
                    </div>
                  ) : (
                    notifications.slice(0, 3).map((n) => (
                      <div key={n.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-[8px] font-black uppercase text-primary tracking-widest">{n.type || 'SYSTEM'}</span>
                          <span className="text-[8px] font-bold text-slate-600">{n.createdAt ? new Date(n.createdAt).toLocaleDateString() : ''}</span>
                        </div>
                        <h4 className="text-xs font-black text-white mb-1">{n.title}</h4>
                        <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-2">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
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

        <div className="p-8 bg-amber-50 rounded-[2.5rem] border border-amber-100 flex items-start gap-5">
           <div className="h-12 w-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg">
             <Info className="h-6 w-6" />
           </div>
           <div className="space-y-1">
             <h4 className="font-black text-amber-900">¿Cómo comprar un nuevo producto?</h4>
             <p className="text-sm text-amber-800 leading-relaxed font-medium">
               Ve al mercado de productos, elige el que te interese y realiza el depósito bancario a la cuenta indicada. Luego, contacta al afiliado para que registre tu compra con el número de referencia del voucher.
             </p>
           </div>
        </div>
      </div>
    </DashboardShell>
  )
}
